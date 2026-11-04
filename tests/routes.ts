import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { SITE } from '../src/config/site.ts';

/** Every page in the built sitemap, as a path relative to the site base (for example "research/"). */
export function sitemapPaths(): string[] {
  const xml = readFileSync(resolve(import.meta.dirname, '../dist/sitemap-0.xml'), 'utf8');
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]!).pathname);
  return urls.map((p) => p.slice(SITE.base.length).replace(/^\//, ''));
}

/** Pages to test: every sitemap page plus the search page. */
export const ROUTES = [...new Set([...sitemapPaths(), 'search/'])];

interface ProjectSource {
  slug: string;
  visibility?: 'public' | 'draft';
  themes: string[];
  resultsPublic?: boolean;
}

// Test the build against the content author's visibility decisions. This also
// keeps the regression checks current when a project is released or added.
const projectDirectory = resolve(import.meta.dirname, '../src/content/projects');
const projects: ProjectSource[] = readdirSync(projectDirectory)
  .filter((file) => file.endsWith('.mdx'))
  .sort()
  .map((file) => {
    const text = readFileSync(resolve(projectDirectory, file), 'utf8');
    const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text)?.[1];
    if (!frontmatter) throw new Error(`Missing project frontmatter: ${file}`);
    return {
      ...(parseYaml(frontmatter) as Omit<ProjectSource, 'slug'>),
      slug: file.replace(/\.mdx$/, ''),
    };
  });

export const PUBLIC_PROJECTS = projects.filter((project) => project.visibility === 'public');

/** Draft project slugs, including the default visibility: must never be built. */
export const DRAFT_PROJECTS = projects
  .filter((project) => project.visibility !== 'public')
  .map((project) => project.slug);
