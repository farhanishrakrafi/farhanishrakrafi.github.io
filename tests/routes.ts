import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SITE } from '../src/config/site.ts';

/** Every page in the built sitemap, as a path relative to the site base (for example "research/"). */
export function sitemapPaths(): string[] {
  const xml = readFileSync(resolve(import.meta.dirname, '../dist/sitemap-0.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  return urls.map((p) => p.slice(SITE.base.length).replace(/^\//, ''));
}

/** Pages to test: every sitemap page plus the search page. */
export const ROUTES = [...new Set([...sitemapPaths(), 'search/'])];

/** Draft project slugs: must never be built. */
export const DRAFT_PROJECTS = [
  'providencia-comparative-genomics',
  'pcos-obesity-mets-esr1',
  'head-neck-cancer-mapk3',
  'sjogren-multiomics',
  'gout-microbiome-meta-analysis',
  'abroma-augusta-ethnobotany',
  'tec-atlas-proposal',
];
