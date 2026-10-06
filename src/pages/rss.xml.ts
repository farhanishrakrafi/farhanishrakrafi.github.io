import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getNews, getNotes } from '../lib/content.ts';
import { absoluteUrl } from '../lib/paths.ts';
import { SITE } from '../config/site.ts';

export async function GET(context: APIContext) {
  const news = await getNews();
  const notes = (await getNotes()).filter((n) => !n.data.draft);
  const items = [
    ...news.map((n) => ({
      title: n.data.text.length > 90 ? `${n.data.text.slice(0, 87)}...` : n.data.text,
      description: n.data.text,
      pubDate: n.data.date,
      link: n.data.link ?? absoluteUrl('/news/', context.site),
    })),
    ...notes.map((n) => ({
      title: n.data.title,
      description: n.data.description,
      pubDate: n.data.date,
      link: absoluteUrl(`/notes/${n.id}/`, context.site),
      categories: n.data.tags,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: `${SITE.titleSuffix}: news and notes`,
    description: 'Research news, protocols and bioinformatics notes from Farhan Ishrak Rafi.',
    site: absoluteUrl('/', context.site),
    items,
    customData: '<language>en</language>',
  });
}
