import type { Root, Parent, RootContent, PhrasingContent, Text } from 'mdast';
import { visitParents, SKIP } from 'unist-util-visit-parents';
import { italicTermsPattern } from '../lib/italics.ts';

/** Node types whose text must never be changed. */
const SKIP_ANCESTORS = new Set(['emphasis', 'inlineCode', 'code', 'inlineMath', 'math', 'html']);

/**
 * Remark plugin: italicises species and gene names listed in
 * src/data/italic-terms.yaml. Skips code, math, raw HTML, text that is
 * already in italics, and bare URLs.
 */
export default function remarkItalicTerms() {
  return (tree: Root) => {
    const pattern = italicTermsPattern();
    if (!pattern) return;

    visitParents(tree, 'text', (node: Text, ancestors) => {
      if (ancestors.some((a) => SKIP_ANCESTORS.has(a.type))) return;
      const parent = ancestors[ancestors.length - 1] as Parent | undefined;
      if (!parent) return;
      // An autolinked URL shows the URL itself as its text: leave it alone.
      if (parent.type === 'link' && 'url' in parent && (parent as { url: string }).url.includes(node.value)) return;

      pattern.lastIndex = 0;
      if (!pattern.test(node.value)) return;
      pattern.lastIndex = 0;

      const pieces: PhrasingContent[] = [];
      let last = 0;
      for (const m of node.value.matchAll(pattern)) {
        const at = m.index ?? 0;
        if (at > last) pieces.push({ type: 'text', value: node.value.slice(last, at) });
        pieces.push({ type: 'emphasis', children: [{ type: 'text', value: m[0] }] });
        last = at + m[0].length;
      }
      if (last < node.value.length) pieces.push({ type: 'text', value: node.value.slice(last) });

      const index = parent.children.indexOf(node as RootContent);
      parent.children.splice(index, 1, ...(pieces as RootContent[]));
      // Skip over the new nodes so the emphasis text is not visited again.
      return [SKIP, index + pieces.length];
    });
  };
}
