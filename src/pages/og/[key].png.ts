import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { APIContext, GetStaticPaths } from 'astro';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { STATUS_LABELS, getNotes, getProfile, getProjects } from '../../lib/content.ts';
import { getPublications } from '../../lib/publications.ts';
import { splitItalic } from '../../lib/italics.ts';

/** 1200 x 630 social cards for LinkedIn and X, one per page, made at build time. */

interface Card {
  title: string;
  kicker: string;
  footer: string;
}

const require = createRequire(import.meta.url);
const font = (pkg: string, file: string) => readFileSync(require.resolve(`${pkg}/files/${file}`));
const fonts = [
  { name: 'Serif', data: font('@fontsource/source-serif-4', 'source-serif-4-latin-600-normal.woff'), weight: 600, style: 'normal' },
  { name: 'Serif', data: font('@fontsource/source-serif-4', 'source-serif-4-latin-600-italic.woff'), weight: 600, style: 'italic' },
  { name: 'Sans', data: font('@fontsource/inter', 'inter-latin-400-normal.woff'), weight: 400, style: 'normal' },
  { name: 'Sans', data: font('@fontsource/inter', 'inter-latin-600-normal.woff'), weight: 600, style: 'normal' },
] as const;

export const getStaticPaths = (async () => {
  const profile = await getProfile();
  const projects = await getProjects();
  const pubs = await getPublications();
  const notes = await getNotes();

  const page = (key: string, title: string, kicker: string, footer = profile.headline) => ({
    params: { key },
    props: { title, kicker, footer } satisfies Card,
  });

  return [
    page('home', profile.name, profile.headline, profile.affiliation),
    page('research', 'Research projects', profile.name),
    page('publications', 'Publications', profile.name),
    page('cv', 'Curriculum vitae', profile.name),
    page('contact', 'Contact', profile.name, profile.availability || profile.headline),
    page('news', 'News', profile.name),
    page('notes', 'Notes: protocols and tutorials', profile.name),
    page('search', 'Search', profile.name),
    ...projects.map((p) =>
      page(`research-${p.id}`, p.data.title, `Research project · ${STATUS_LABELS[p.data.status]}`, profile.name),
    ),
    ...pubs.map((p) =>
      page(
        `publications-${p.id}`,
        p.title,
        [p.journal, p.date[0]].filter(Boolean).join(' · '),
        profile.name,
      ),
    ),
    ...notes.map((n) => page(`notes-${n.id}`, n.data.title, 'Notes', profile.name)),
  ];
}) satisfies GetStaticPaths;

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown): Node => ({
  type,
  props: { style, children },
});

export async function GET({ props }: APIContext) {
  const { title, kicker, footer } = props as Card;
  const size = title.length > 110 ? 46 : title.length > 70 ? 54 : 64;

  // One span per word, so long titles wrap and species names stay italic.
  const words = splitItalic(title).flatMap((part) =>
    part.text
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => el('span', { marginRight: Math.round(size * 0.25), fontStyle: part.italic ? 'italic' : 'normal' }, w)),
  );

  const tree = el(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      background: '#F6FAF9',
      fontFamily: 'Sans',
      color: '#111827',
    },
    [
      el('div', { width: 24, height: 630, background: '#0F766E' }),
      el(
        'div',
        { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', flex: 1 },
        [
          el('div', { fontSize: 28, fontWeight: 600, color: '#0F766E', display: 'flex' }, kicker),
          el(
            'div',
            {
              display: 'flex',
              flexWrap: 'wrap',
              fontFamily: 'Serif',
              fontWeight: 600,
              fontSize: size,
              lineHeight: 1.15,
              maxHeight: size * 1.15 * 4,
              overflow: 'hidden',
            },
            words,
          ),
          el('div', { fontSize: 26, color: '#4B5563', display: 'flex' }, footer),
        ],
      ),
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: fonts.map((f) => ({ ...f, data: f.data })) as Parameters<typeof satori>[1]['fonts'],
  });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
}
