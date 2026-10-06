import type { APIContext } from 'astro';
import { absoluteUrl } from '../lib/paths.ts';

/** Allows every crawler and points to the sitemap. */
export function GET(context: APIContext) {
  const body = ['User-agent: *', 'Allow: /', '', `Sitemap: ${absoluteUrl('/sitemap-index.xml', context.site)}`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
