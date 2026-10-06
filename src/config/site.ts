/**
 * Site-wide settings. Personal details (name, email, links) live in
 * src/data/profile.yaml; this file holds the technical settings.
 *
 * The live address is set in ONE place: `defaultUrl` and `defaultBase` below.
 * The deploy workflow overrides both automatically from GitHub Pages, so a
 * renamed repository or a custom domain needs no code change.
 */

/** Origin used for canonical URLs when no SITE_URL is given (local builds). */
const defaultUrl = 'https://farhanishraq184-max.github.io';

/**
 * Sub-path the site is served from. A repository named `<username>.github.io`
 * is served from the root, so use ''. Any other repository name, such as
 * `Website`, is served from `/<repository-name>`.
 */
const defaultBase = '/Website';

function cleanBase(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, '');
  return trimmed ? `/${trimmed}` : '';
}

export const SITE = {
  url: (process.env.SITE_URL || defaultUrl).replace(/\/+$/, ''),
  base: cleanBase(process.env.BASE_PATH ?? defaultBase),
  /** Public source repository, linked from the footer. */
  repository: 'https://github.com/farhanishraq184-max/Website',
  lang: 'en',
  locale: 'en_GB',
  titleSuffix: 'Farhan Ishrak Rafi',
  homeTitle: 'Farhan Ishrak Rafi · Biochemist and computational biologist',
} as const;

/** Header navigation, in display order. `Notes` hides itself until a note is public. */
export const NAV = [
  { label: 'Research', href: '/research/' },
  { label: 'Publications', href: '/publications/' },
  { label: 'CV', href: '/cv/' },
  { label: 'Notes', href: '/notes/' },
  { label: 'Contact', href: '/contact/' },
] as const;

export const FEATURES = {
  /** Show the search button in the header and the search box on the 404 page. */
  search: true,
  /** Aggregate metrics (h-index, total citations) appear once there are this many papers. */
  metricsMinPapers: 3,
} as const;

/**
 * Cookieless analytics. Leave both empty to load no analytics at all.
 * GoatCounter: the code is the part before `.goatcounter.com`.
 * Cloudflare Web Analytics: the token from the JS snippet Cloudflare shows you.
 */
export const ANALYTICS = {
  goatcounterCode: '',
  cloudflareToken: '',
} as const;

/** Search engine verification codes (HTML meta-tag method). Empty means no tag. */
export const VERIFICATION = {
  google: '',
  bing: '',
} as const;
