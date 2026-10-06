import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';

/** Loads a YAML file that holds one object as a single entry with the given id. */
const singleYaml = (path: string, id: string) =>
  file(path, { parser: (text) => [{ id, ...(parseYaml(text) as Record<string, unknown>) }] });

/** An optional link: a full URL, or an empty string that hides the link. */
const optionalUrl = z.union([z.url(), z.literal('')]).optional();

// ---------------------------------------------------------------- profile
const profile = defineCollection({
  loader: singleYaml('src/data/profile.yaml', 'profile'),
  schema: z.object({
    name: z.string(),
    nameVariants: z.array(z.string()),
    headline: z.string().max(90),
    researchStatement: z.string().max(220),
    affiliation: z.string(),
    institution: z.string(),
    location: z.string(),
    timezone: z.string(),
    email: z.email(),
    availability: z.string().optional(),
    openTo: z.array(z.string()).default([]),
    photo: z.string(),
    photoAlt: z.string().min(1),
    links: z.object({
      orcid: optionalUrl,
      scholar: optionalUrl,
      github: optionalUrl,
      linkedin: optionalUrl,
      researchgate: optionalUrl,
    }),
    showProfessionalExperience: z.boolean().default(true),
  }),
});

// ---------------------------------------------------------------- CV
const cvItem = z.object({
  title: z.string(),
  org: z.string().optional(),
  location: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  details: z.string().optional(),
  bullets: z.array(z.string()).default([]),
  showOnSite: z.boolean().default(true),
});

const cv = defineCollection({
  loader: singleYaml('src/data/cv.yaml', 'cv'),
  schema: z.object({
    education: z.array(cvItem).default([]),
    researchExperience: z.array(cvItem).default([]),
    training: z.array(cvItem).default([]),
    workshops: z.array(cvItem).default([]),
    experience: z.array(cvItem).default([]),
    leadership: z.array(cvItem).default([]),
    awards: z.array(cvItem).default([]),
    memberships: z.array(z.string()).default([]),
    languages: z.array(z.object({ name: z.string(), level: z.string() })).default([]),
    skills: z.object({
      wetLab: z.array(z.string()).default([]),
      genomics: z.array(z.string()).default([]),
      structural: z.array(z.string()).default([]),
      omics: z.array(z.string()).default([]),
      tools: z.array(z.string()).default([]),
    }),
  }),
});

// ---------------------------------------------------------------- publications
const publications = defineCollection({
  loader: file('src/data/publications.yaml', {
    parser: (text) => parseYaml(text) as Array<Record<string, unknown>>,
  }),
  schema: z
    .object({
      id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be lowercase-hyphenated'),
      type: z.enum(['journal', 'preprint', 'conference', 'thesis', 'chapter']),
      status: z.enum(['published', 'accepted', 'under-review', 'in-preparation']),
      title: z.string(),
      authors: z.array(z.string()).default([]),
      /** false: the list above is partial and the full list comes from Crossref. */
      authorsComplete: z.boolean().default(true),
      year: z.number().int(),
      journal: z.string().optional(),
      volume: z.string().optional(),
      issue: z.string().optional(),
      articleNumber: z.string().optional(),
      doi: z
        .string()
        .regex(/^10\.\d{4,9}\/\S+$/)
        .optional(),
      pdf: z.url().optional(),
      openAccess: z.boolean().default(false),
      role: z.enum(['first-author', 'equal-first', 'co-author', 'corresponding']),
      abstract: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      selected: z.boolean().default(false),
      relatedProject: z.string().optional(),
      quartile: z.object({ value: z.string(), source: z.string(), year: z.number() }).optional(),
    })
    .refine((p) => p.status !== 'in-preparation' || !p.journal, {
      message: 'an in-preparation entry must not name a target journal',
    }),
});

// ---------------------------------------------------------------- themes
const themes = defineCollection({
  loader: file('src/data/themes.yaml', {
    parser: (text) => parseYaml(text) as Array<Record<string, unknown>>,
  }),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    summary: z.string(),
    methods: z.array(z.string()).max(4),
  }),
});

// ---------------------------------------------------------------- projects
export const THEME_IDS = ['amr-genomics', 'drug-discovery', 'multi-omics', 'microbiome', 'other'] as const;
export const PROJECT_STATUSES = [
  'published',
  'under-review',
  'in-preparation',
  'ongoing',
  'completed',
  'proposal',
] as const;

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string(),
        summary: z.string().max(200),
        status: z.enum(PROJECT_STATUSES),
        themes: z.array(z.enum(THEME_IDS)).min(1),
        role: z.string(),
        supervisor: z.string().optional(),
        lab: z.string().optional(),
        /** Leave out until the real date is confirmed; never guess. */
        start: z.coerce.date().optional(),
        end: z.coerce.date().optional(),
        organisms: z.array(z.string()).default([]),
        targets: z.array(z.string()).default([]),
        methods: z.array(z.string()).min(1),
        featured: z.boolean().default(false),
        order: z.number().default(100),
        resultsPublic: z.boolean().default(false),
        visibility: z.enum(['public', 'draft']).default('draft'),
        publications: z.array(z.string()).default([]),
        links: z
          .object({
            code: z.url(),
            data: z.url(),
            preprint: z.url(),
            poster: z.url(),
          })
          .partial()
          .default({}),
        cover: image().optional(),
        coverAlt: z.string().optional(),
      })
      .refine((p) => !p.cover || !!p.coverAlt, { message: 'cover needs coverAlt' }),
});

// ---------------------------------------------------------------- news and notes
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    date: z.coerce.date(),
    text: z.string().max(280),
    link: z.url().optional(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(160),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(true),
  }),
});

export const collections = { profile, cv, publications, themes, projects, news, notes };
