/**
 * Plain functions shared by the site (src/lib/publications.ts) and the CV
 * generator (scripts/build-cv-tex.ts). No Astro imports here.
 */

export interface Person {
  given?: string | undefined;
  family?: string | undefined;
  /** Used when a name cannot be split into given and family parts. */
  literal?: string | undefined;
}

export interface CrossrefRecord {
  checkedAt?: string;
  title?: string;
  authors?: Person[];
  journal?: string;
  journalShort?: string;
  volume?: string;
  issue?: string;
  articleNumber?: string;
  page?: string;
  published?: number[];
  abstract?: string;
  license?: string;
  publisher?: string;
  url?: string;
}

export interface OpenAlexRecord {
  checkedAt?: string;
  citedByCount?: number;
  isOa?: boolean;
  oaUrl?: string;
}

export interface EnrichedRecord {
  doi?: string;
  crossref?: CrossrefRecord;
  openalex?: OpenAlexRecord;
}

/** The fields of a publications.yaml entry after schema defaults are applied. */
export interface PublicationEntry {
  id: string;
  type: 'journal' | 'preprint' | 'conference' | 'thesis' | 'chapter';
  status: 'published' | 'accepted' | 'under-review' | 'in-preparation';
  title: string;
  authors: string[];
  authorsComplete: boolean;
  year: number;
  journal?: string | undefined;
  volume?: string | undefined;
  issue?: string | undefined;
  articleNumber?: string | undefined;
  doi?: string | undefined;
  pdf?: string | undefined;
  openAccess: boolean;
  role: 'first-author' | 'equal-first' | 'co-author' | 'corresponding';
  abstract?: string | undefined;
  keywords: string[];
  selected: boolean;
  relatedProject?: string | undefined;
  quartile?: { value: string; source: string; year: number } | undefined;
}

export interface Publication extends Omit<PublicationEntry, 'authors'> {
  authors: Person[];
  /** True when the author list is partial and should end with "et al." */
  etAl: boolean;
  /** [year, month?, day?] */
  date: number[];
  journalShort?: string | undefined;
  doiUrl?: string | undefined;
  /** Best open-access copy: the YAML pdf, else OpenAlex's link. */
  oaUrl?: string | undefined;
  license?: string | undefined;
  publisher?: string | undefined;
  citations?: { count: number; asOf: string } | undefined;
}

/**
 * Parses a typed author name. "Islam MT" (family + initials),
 * "Rafi, Farhan Ishrak" and "Farhan Ishrak Rafi" are all understood.
 */
export function parseName(name: string): Person {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.includes(',')) {
    const [family, given] = clean.split(',', 2).map((s) => s.trim());
    return { family: family || clean, given: given || undefined };
  }
  const initialsForm = clean.match(/^(.+?) ((?:[A-Z]\.?){1,4})$/);
  if (initialsForm?.[1] && initialsForm[2]) {
    const letters = initialsForm[2].replace(/\./g, '').split('');
    return { family: initialsForm[1], given: letters.map((l) => `${l}.`).join(' ') };
  }
  const parts = clean.split(' ');
  if (parts.length === 1) return { literal: clean };
  return { family: parts.at(-1), given: parts.slice(0, -1).join(' ') };
}

export function initials(given = ''): string {
  return given
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

/** "Rafi FI" style, as used in Vancouver author lists. */
export function shortName(p: Person): string {
  if (p.literal) return p.literal;
  return [p.family, initials(p.given)].filter(Boolean).join(' ');
}

/** "Farhan Ishrak Rafi" style. */
export function fullName(p: Person): string {
  if (p.literal) return p.literal;
  return [p.given, p.family].filter(Boolean).join(' ');
}

export const normaliseName = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** True when the person matches any of the given name variants. */
export function matchesName(p: Person, variants: Iterable<string>): boolean {
  const names = new Set([...variants].filter(Boolean).map(normaliseName));
  const candidates = [
    fullName(p),
    shortName(p),
    p.family && p.given ? `${p.family}, ${p.given}` : '',
    p.family && p.given ? `${initials(p.given).split('').join('. ')}. ${p.family}` : '',
  ];
  return candidates.filter(Boolean).some((c) => names.has(normaliseName(c)));
}

/** Merges a YAML entry with its fetched record. Typed fields always win. */
export function mergePublication(entry: PublicationEntry, record: EnrichedRecord | undefined): Publication {
  // A cached record for a different DOI is stale: ignore it.
  const usable = record && (!record.doi || record.doi.toLowerCase() === entry.doi?.toLowerCase());
  const cr: CrossrefRecord = usable ? (record.crossref ?? {}) : {};
  const oa: OpenAlexRecord = usable ? (record.openalex ?? {}) : {};

  const typedAuthors = entry.authors.map(parseName);
  let authors = typedAuthors;
  let etAl = false;
  if (!entry.authorsComplete) {
    if (cr.authors?.length) authors = cr.authors;
    else etAl = true;
  } else if (!typedAuthors.length && cr.authors?.length) {
    authors = cr.authors;
  }

  const date = cr.published?.[0] === entry.year ? cr.published : [entry.year];

  return {
    ...entry,
    authors,
    etAl,
    date,
    journal: entry.journal ?? cr.journal,
    journalShort: cr.journalShort,
    volume: entry.volume ?? cr.volume,
    issue: entry.issue ?? cr.issue,
    articleNumber: entry.articleNumber ?? cr.articleNumber ?? cr.page,
    abstract: entry.abstract ?? cr.abstract,
    openAccess: entry.openAccess || oa.isOa === true,
    doiUrl: entry.doi ? `https://doi.org/${entry.doi}` : undefined,
    oaUrl: entry.pdf ?? oa.oaUrl,
    license: cr.license,
    publisher: cr.publisher,
    citations:
      typeof oa.citedByCount === 'number' && oa.checkedAt
        ? { count: oa.citedByCount, asOf: oa.checkedAt }
        : undefined,
  };
}

/** Newest first, then by title. */
export function comparePublications(a: Publication, b: Publication): number {
  const byDate = (b.date[0] ?? 0) - (a.date[0] ?? 0) || (b.date[1] ?? 0) - (a.date[1] ?? 0);
  return byDate || a.title.localeCompare(b.title);
}

/** "15, 17134" or "15(2), 17134": volume, issue and article number. */
export function sourceDetails(p: Publication): string {
  const parts: string[] = [];
  if (p.volume) parts.push(p.issue ? `${p.volume}(${p.issue})` : p.volume);
  if (p.articleNumber) parts.push(p.articleNumber);
  return parts.join(', ');
}
