import { Cite } from '@citation-js/core';
import '@citation-js/plugin-csl';
import '@citation-js/plugin-bibtex';
import type { Publication } from './publications.ts';

const CSL_TYPES: Record<Publication['type'], string> = {
  journal: 'article-journal',
  preprint: 'article',
  conference: 'paper-conference',
  thesis: 'thesis',
  chapter: 'chapter',
};

/** Converts a publication to CSL-JSON, the input format of citation-js. */
export function toCsl(p: Publication): Record<string, unknown> {
  const csl: Record<string, unknown> = {
    id: p.id,
    'citation-key': p.id,
    type: CSL_TYPES[p.type],
    title: p.title,
    author: p.authors.map((a) => (a.literal ? { literal: a.literal } : { given: a.given, family: a.family })),
    issued: { 'date-parts': [p.date] },
  };
  if (p.journal) csl['container-title'] = p.journal;
  if (p.journalShort) csl['container-title-short'] = p.journalShort;
  if (p.volume) csl.volume = p.volume;
  if (p.issue) csl.issue = p.issue;
  if (p.articleNumber) {
    csl.page = p.articleNumber;
    csl.number = p.articleNumber;
  }
  if (p.doi) csl.DOI = p.doi;
  return csl;
}

export interface CitationFormats {
  apa: string;
  vancouver: string;
  bibtex: string;
}

const cache = new Map<string, CitationFormats>();

/** APA, Vancouver and BibTeX strings for one publication, computed at build time. */
export function formatCitation(p: Publication): CitationFormats {
  const hit = cache.get(p.id);
  if (hit) return hit;
  const cite = new Cite([toCsl(p)]);
  const etAl = p.etAl ? ' et al.' : '';
  const apa = String(cite.format('bibliography', { format: 'text', template: 'apa', lang: 'en-US' })).trim();
  const vancouver = String(cite.format('bibliography', { format: 'text', template: 'vancouver', lang: 'en-US' }))
    .trim()
    .replace(/^1\.\s*/, '');
  const bibtex = String(cite.format('bibtex'))
    .trim()
    .replace(/^@(\w+)\{[^,]*,/, `@$1{${p.id},`);
  const result: CitationFormats = {
    // A partial author list is marked so a copied citation is never mistaken for complete.
    apa: etAl ? apa.replace(/\. \((\d{4})/, `.,${etAl} ($1`) : apa,
    vancouver: etAl ? vancouver.replace(/\. /, `,${etAl} `) : vancouver,
    bibtex: etAl ? bibtex.replace(/(author = \{[^}]*)\}/, '$1 and others}') : bibtex,
  };
  cache.set(p.id, result);
  return result;
}

/** All publications as one BibTeX file. */
export function bibliographyBibtex(pubs: Publication[]): string {
  return pubs.map((p) => formatCitation(p).bibtex).join('\n\n') + '\n';
}
