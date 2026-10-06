import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

const TERMS_FILE = resolve(process.cwd(), 'src/data/italic-terms.yaml');

let cached: RegExp | null | undefined;

/** Species and gene names from src/data/italic-terms.yaml. */
export function loadItalicTerms(): string[] {
  const raw = parseYaml(readFileSync(TERMS_FILE, 'utf8')) as unknown;
  if (!Array.isArray(raw) || raw.some((t) => typeof t !== 'string')) {
    throw new Error('src/data/italic-terms.yaml must be a list of strings');
  }
  return raw.map((t: string) => t.trim()).filter(Boolean);
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * One regular expression matching any listed term as a whole word.
 * Longest terms first, so "Escherichia coli" wins over a shorter overlap.
 */
export function italicTermsPattern(): RegExp | null {
  if (cached !== undefined) return cached ? new RegExp(cached.source, cached.flags) : null;
  const terms = loadItalicTerms().sort((a, b) => b.length - a.length);
  cached = terms.length
    ? new RegExp(`(?<![\\w-])(?:${terms.map(escapeRegex).join('|')})(?![\\w-])`, 'g')
    : null;
  return cached ? new RegExp(cached.source, cached.flags) : null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Escapes plain text and wraps listed species and gene names in <em>.
 * For text that comes from YAML or frontmatter (titles, summaries, chips).
 */
export function italicize(text: string): string {
  const escaped = escapeHtml(text);
  const pattern = italicTermsPattern();
  if (!pattern) return escaped;
  // Terms contain no HTML-special characters, so matching after escaping is safe.
  return escaped.replace(pattern, (match) => `<em>${match}</em>`);
}

/** Splits text into plain and italic runs, for renderers that are not HTML (LaTeX, images). */
export function splitItalic(text: string): Array<{ text: string; italic: boolean }> {
  const pattern = italicTermsPattern();
  if (!pattern) return [{ text, italic: false }];
  const parts: Array<{ text: string; italic: boolean }> = [];
  let last = 0;
  for (const m of text.matchAll(pattern)) {
    const at = m.index ?? 0;
    if (at > last) parts.push({ text: text.slice(last, at), italic: false });
    parts.push({ text: m[0], italic: true });
    last = at + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), italic: false });
  return parts;
}
