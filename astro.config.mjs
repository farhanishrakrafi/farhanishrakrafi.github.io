// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { SITE } from './src/config/site.ts';
import remarkItalicTerms from './src/plugins/remark-italic-terms.ts';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: SITE.url,
  base: SITE.base || '/',
  trailingSlash: 'always',
  build: { format: 'directory' },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkItalicTerms, remarkMath],
      rehypePlugins: [[rehypeKatex, { output: 'html' }]],
      // Keep straight dashes as typed: the site never uses em dashes.
      smartypants: { dashes: false },
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !/\/(404|search)\/?$/.test(page),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    // 3Dmol.js (about 560 kB) is one lazy chunk, loaded only when a molecule viewer scrolls into view.
    build: { chunkSizeWarningLimit: 700 },
  },
});
