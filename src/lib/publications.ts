import { getCollection, getEntry } from 'astro:content';
import enrichedFile from '../data/generated/publications.enriched.json';
import {
  comparePublications,
  matchesName,
  mergePublication,
  type EnrichedRecord,
  type Person,
  type Publication,
  type PublicationEntry,
} from './publication-merge.ts';

export {
  fullName,
  initials,
  parseName,
  shortName,
  sourceDetails,
  type Person,
  type Publication,
} from './publication-merge.ts';

const enriched = (enrichedFile as { records?: Record<string, EnrichedRecord> }).records ?? {};

export const TYPE_LABELS: Record<PublicationEntry['type'], string> = {
  journal: 'Journal article',
  preprint: 'Preprint',
  conference: 'Conference abstract',
  thesis: 'Thesis',
  chapter: 'Book chapter',
};

export const ROLE_LABELS: Record<PublicationEntry['role'], string> = {
  'first-author': 'First author',
  'equal-first': 'Equal first author',
  'co-author': 'Co-author',
  corresponding: 'Corresponding author',
};

export const PUB_STATUS_LABELS: Record<PublicationEntry['status'], string> = {
  published: 'Published',
  accepted: 'Accepted',
  'under-review': 'Under review',
  'in-preparation': 'In preparation',
};

let selfNames: string[] | undefined;

/** True when the person is the site owner, matched against every name variant in profile.yaml. */
export async function isSelf(p: Person): Promise<boolean> {
  if (!selfNames) {
    const profile = await getEntry('profile', 'profile');
    selfNames = [profile?.data.name ?? '', ...(profile?.data.nameVariants ?? [])];
  }
  return matchesName(p, selfNames);
}

/** All publications, newest first, merged with fetched Crossref and OpenAlex data. */
export async function getPublications(): Promise<Publication[]> {
  const entries = await getCollection('publications');
  return entries.map((e) => mergePublication(e.data, enriched[e.data.id])).sort(comparePublications);
}

/** Total citations, the oldest "as of" date among them, and the h-index. */
export function citationSummary(pubs: Publication[]) {
  const counted = pubs.flatMap((p) => (p.citations ? [p.citations] : []));
  if (!counted.length) return undefined;
  const total = counted.reduce((sum, c) => sum + c.count, 0);
  const asOf = counted.map((c) => c.asOf).sort()[0] ?? '';
  const counts = counted.map((c) => c.count).sort((a, b) => b - a);
  const hIndex = counts.filter((c, i) => c >= i + 1).length;
  return { total, asOf, hIndex };
}
