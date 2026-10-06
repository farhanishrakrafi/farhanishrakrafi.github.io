import { SITE } from '../config/site.ts';
import { absoluteUrl } from './paths.ts';

export interface Crumb {
  name: string;
  path: string;
}

export function pageTitle(title?: string): string {
  return title ? `${title} · ${SITE.titleSuffix}` : SITE.homeTitle;
}

export function breadcrumbJsonLd(crumbs: Crumb[], site: URL | undefined) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.path, site),
    })),
  };
}

/** Serialises JSON-LD safely for a <script> tag. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Social card path for a page key, for example "research-mdr-ecoli-st361-genomics". */
export function ogPath(key: string): string {
  return `/og/${key}.png`;
}
