/**
 * DOI enrichment (SPEC.md section 9).
 *
 * Reads src/data/publications.yaml, fetches metadata from Crossref and
 * citation counts from OpenAlex, and writes
 * src/data/generated/publications.enriched.json, which is committed as a cache.
 *
 * It never breaks the build: on a network error, a missing API key or an
 * HTTP error it keeps the last cached record and prints a warning.
 * Fields typed in publications.yaml always win over fetched ones (that merge
 * happens in src/lib/publications.ts).
 *
 * Usage: npm run enrich            (OPENALEX_API_KEY optional, from the environment)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';

const ROOT = resolve(import.meta.dirname, '..');
const YAML_FILE = resolve(ROOT, 'src/data/publications.yaml');
const PROFILE_FILE = resolve(ROOT, 'src/data/profile.yaml');
const OUT_FILE = resolve(ROOT, 'src/data/generated/publications.enriched.json');

interface Person {
  given?: string;
  family?: string;
  literal?: string;
}

interface Crossref {
  checkedAt: string;
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

interface OpenAlex {
  checkedAt: string;
  citedByCount?: number;
  isOa?: boolean;
  oaUrl?: string;
}

interface Record_ {
  doi: string;
  crossref?: Crossref;
  openalex?: OpenAlex;
}

interface CacheFile {
  _note?: string;
  records: Record<string, Record_>;
}

const warn = (msg: string) => console.warn(`[enrich] warning: ${msg}`);
const info = (msg: string) => console.log(`[enrich] ${msg}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Polite fetch: one request per second, two retries with backoff, 20 s timeout. */
let lastRequest = 0;
async function getJson(url: string, headers: Record<string, string>): Promise<unknown> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    const wait = lastRequest + 1000 - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(20_000) });
      if (res.ok) return await res.json();
      lastError = new Error(`HTTP ${res.status}`);
      // A 4xx other than rate limiting will not get better on retry.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
    } catch (error) {
      lastError = error;
    }
    await sleep(2000 * 2 ** attempt);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Crossref abstracts are JATS XML; keep the text only. */
export function cleanAbstract(jats: string): string {
  return jats
    .replace(/<jats:title>.*?<\/jats:title>/gis, ' ')
    .replace(/<\/jats:p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\s*\n\s*\n\s*/g, '\n\n')
    .trim();
}

const first = (v: unknown): string | undefined =>
  Array.isArray(v) && typeof v[0] === 'string' ? v[0] : typeof v === 'string' ? v : undefined;

/** Maps a Crossref `message` object to the fields the site uses. */
export function fromCrossref(message: Record<string, unknown>, checkedAt: string): Crossref {
  const authors = Array.isArray(message.author)
    ? (message.author as Array<Record<string, unknown>>).map((a) =>
        typeof a.family === 'string'
          ? { given: typeof a.given === 'string' ? a.given : undefined, family: a.family }
          : { literal: String(a.name ?? '') },
      )
    : undefined;
  const dateSource = (message['published-print'] ??
    message['published-online'] ??
    message.published ??
    message.issued) as { 'date-parts'?: number[][] } | undefined;
  const published = dateSource?.['date-parts']?.[0]?.filter((n) => typeof n === 'number');
  const licenses = Array.isArray(message.license) ? (message.license as Array<{ URL?: string }>) : [];
  return {
    checkedAt,
    title: first(message.title),
    authors: authors?.length ? authors : undefined,
    journal: first(message['container-title']),
    journalShort: first(message['short-container-title']),
    volume: typeof message.volume === 'string' ? message.volume : undefined,
    issue: typeof message.issue === 'string' ? message.issue : undefined,
    articleNumber: typeof message['article-number'] === 'string' ? message['article-number'] : undefined,
    page: typeof message.page === 'string' ? message.page : undefined,
    published: published?.length ? published : undefined,
    abstract: typeof message.abstract === 'string' ? cleanAbstract(message.abstract) : undefined,
    license: licenses.find((l) => l.URL)?.URL,
    publisher: typeof message.publisher === 'string' ? message.publisher : undefined,
    url: typeof message.URL === 'string' ? message.URL : undefined,
  };
}

/** Maps an OpenAlex work to citation count and open-access status. */
export function fromOpenAlex(work: Record<string, unknown>, checkedAt: string): OpenAlex {
  const oa = (work.open_access ?? {}) as { is_oa?: boolean; oa_url?: string | null };
  const best = (work.best_oa_location ?? {}) as { pdf_url?: string | null; landing_page_url?: string | null };
  return {
    checkedAt,
    citedByCount: typeof work.cited_by_count === 'number' ? work.cited_by_count : undefined,
    isOa: typeof oa.is_oa === 'boolean' ? oa.is_oa : undefined,
    oaUrl: best.pdf_url ?? oa.oa_url ?? undefined,
  };
}

function readCache(): CacheFile {
  try {
    const data = JSON.parse(readFileSync(OUT_FILE, 'utf8')) as CacheFile;
    return { ...data, records: data.records ?? {} };
  } catch {
    return { records: {} };
  }
}

async function main() {
  const pubs = (parseYaml(readFileSync(YAML_FILE, 'utf8')) ?? []) as Array<{ id: string; doi?: string }>;
  const profile = parseYaml(readFileSync(PROFILE_FILE, 'utf8')) as { email?: string };
  const contact = process.env.CROSSREF_MAILTO || profile.email || '';
  const apiKey = process.env.OPENALEX_API_KEY?.trim();
  const userAgent = `academic-profile-site/1.0 (${contact ? `mailto:${contact}` : 'no contact set'})`;
  const cache = readCache();
  const now = new Date().toISOString();
  const next: CacheFile = { _note: cache._note, records: {} };

  if (!apiKey) warn('OPENALEX_API_KEY is not set: keeping cached citation counts.');

  for (const pub of pubs) {
    if (!pub.doi) continue;
    const doi = pub.doi.trim();
    const old = cache.records[pub.id];
    const sameDoi = old?.doi?.toLowerCase() === doi.toLowerCase();
    const record: Record_ = { doi, crossref: sameDoi ? old?.crossref : undefined, openalex: sameDoi ? old?.openalex : undefined };

    try {
      const json = (await getJson(`https://api.crossref.org/works/${encodeURIComponent(doi)}`, {
        'User-Agent': userAgent,
      })) as { message?: Record<string, unknown> };
      if (json.message) {
        record.crossref = fromCrossref(json.message, now);
        info(`Crossref ok: ${pub.id}`);
      }
    } catch (error) {
      warn(`Crossref failed for ${pub.id} (${(error as Error).message}); keeping the cached record.`);
    }

    if (apiKey) {
      try {
        const params = new URLSearchParams({ api_key: apiKey });
        if (contact) params.set('mailto', contact);
        const work = (await getJson(`https://api.openalex.org/works/doi:${encodeURIComponent(doi)}?${params}`, {
          'User-Agent': userAgent,
        })) as Record<string, unknown>;
        record.openalex = fromOpenAlex(work, now);
        info(`OpenAlex ok: ${pub.id} (${record.openalex.citedByCount ?? 'no'} citations)`);
      } catch (error) {
        warn(`OpenAlex failed for ${pub.id} (${(error as Error).message}); keeping the cached record.`);
      }
    }

    next.records[pub.id] = record;
  }

  writeFileSync(OUT_FILE, `${JSON.stringify(next, null, 2)}\n`);
  info(`wrote ${Object.keys(next.records).length} record(s) to src/data/generated/publications.enriched.json`);
}

// Run only when executed directly, so the mapping functions can be imported by tests.
if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) {
  main().catch((error) => {
    // Last line of defence: never fail the build.
    warn(`enrichment skipped: ${(error as Error).message}`);
  });
}
