import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Project = CollectionEntry<'projects'>;
export type ProjectStatus = Project['data']['status'];
export type ThemeId = Project['data']['themes'][number];

/** Drafts are visible only in `npm run dev`, never in a production build. */
const SHOW_DRAFTS = import.meta.env.DEV;

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  published: 'Published',
  'under-review': 'Under review',
  'in-preparation': 'In preparation',
  ongoing: 'Ongoing',
  completed: 'Completed',
  proposal: 'Proposal',
};

/** Order of status filter chips on /research/. */
export const STATUS_ORDER: ProjectStatus[] = [
  'published',
  'under-review',
  'in-preparation',
  'ongoing',
  'completed',
  'proposal',
];

export const THEME_LABELS: Record<ThemeId, string> = {
  'amr-genomics': 'AMR and bacterial genomics',
  'drug-discovery': 'Drug discovery',
  'multi-omics': 'Multi-omics',
  microbiome: 'Microbiome',
  other: 'Other',
};

export async function getProjects(): Promise<Project[]> {
  const all = await getCollection(
    'projects',
    ({ data }) => data.visibility === 'public' || SHOW_DRAFTS,
  );
  return all.sort(
    (a, b) =>
      a.data.order - b.data.order || (b.data.start?.getTime() ?? 0) - (a.data.start?.getTime() ?? 0),
  );
}

export async function getNotes() {
  const all = await getCollection('notes', ({ data }) => !data.draft || SHOW_DRAFTS);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getNews() {
  const all = await getCollection('news');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getProfile() {
  const entry = await getEntry('profile', 'profile');
  if (!entry) throw new Error('src/data/profile.yaml is missing');
  return entry.data;
}

export async function getCv() {
  const entry = await getEntry('cv', 'cv');
  if (!entry) throw new Error('src/data/cv.yaml is missing');
  return entry.data;
}

export async function getThemes() {
  return (await getCollection('themes')).map((t) => t.data);
}

/** Reading time in minutes at 220 words per minute. */
export function readingTime(body = ''): number {
  const words = body.replace(/[`*#>{}[\]()_-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
