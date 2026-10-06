/**
 * Every internal link goes through `url()`, so the site works both at a
 * domain root and under a sub-path such as /my-repository/.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function url(path = '/'): string {
  if (/^[a-z]+:/i.test(path) || path.startsWith('#')) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${BASE}${clean}`;
}

/** Absolute URL for canonical links, feeds and structured data. */
export function absoluteUrl(path: string, site: URL | undefined): string {
  return new URL(url(path), site ?? 'http://localhost:4321').toString();
}

/** The current path without the base, for nav highlighting. */
export function stripBase(pathname: string): string {
  return BASE && pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
}

export function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
