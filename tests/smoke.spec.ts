import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';
import { DRAFT_PROJECTS, ROUTES } from './routes.ts';

for (const route of ROUTES) {
  test(`page structure: /${route}`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main#main')).toHaveCount(1);
    await expect(page.locator('header nav').first()).toBeAttached();
    await expect(page.locator('footer[data-site-footer]')).toHaveCount(1);
    await expect(page).toHaveTitle(/Farhan Ishrak Rafi/);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description?.length ?? 0).toBeGreaterThanOrEqual(100);
    expect(description?.length ?? 0).toBeLessThanOrEqual(160);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\//);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/og\/.+\.png$/);
    // The skip link is the first focusable element.
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveText(/Skip to main content/);
    // No em dash in visible copy.
    expect(await page.locator('main').innerText()).not.toContain(String.fromCharCode(0x2014));
  });
}

test('draft projects are not built and not in the sitemap', async ({ page }) => {
  const sitemap = readFileSync(resolve(import.meta.dirname, '../dist/sitemap-0.xml'), 'utf8');
  for (const slug of DRAFT_PROJECTS) {
    expect(sitemap).not.toContain(slug);
    const response = await page.goto(`research/${slug}/`);
    expect(response?.status()).toBe(404);
  }
  await page.goto('research/');
  await expect(page.locator('[data-project]')).toHaveCount(2);
});

test('unpublished findings are hidden', async ({ page }) => {
  await page.goto('research/mdr-ecoli-st361-genomics/');
  await expect(page.locator('#findings + p')).toHaveText('Results will be shared after publication.');
});

test('species and gene names are italic', async ({ page }) => {
  await page.goto('research/mdr-ecoli-st361-genomics/');
  await expect(page.locator('h1 em', { hasText: 'Escherichia coli' })).toHaveCount(1);
  await expect(page.locator('h1 em', { hasText: 'blaNDM-5' })).toHaveCount(1);
  await expect(page.locator('.prose em', { hasText: 'blaOXA-181' }).first()).toBeVisible();
});

test('theme toggle switches and remembers the theme', async ({ page }) => {
  await page.goto('');
  const html = page.locator('html');
  const before = await html.getAttribute('data-theme');
  await page.locator('[data-theme-toggle]').click();
  const after = before === 'dark' ? 'light' : 'dark';
  await expect(html).toHaveAttribute('data-theme', after);
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', after);
});

test('research filters read and write the URL', async ({ page }) => {
  await page.goto('research/?theme=drug-discovery');
  await expect(page.locator('[data-project-list] > li:visible')).toHaveCount(1);
  await expect(page.locator('[data-project-list] > li:visible')).toContainText('butyrylcholinesterase');
  await page.locator('[data-filter="theme"][data-value="drug-discovery"]').click();
  await expect(page).toHaveURL(/\/research\/$/);
  await expect(page.locator('[data-project-list] > li:visible')).toHaveCount(2);
});

test('cite dialog opens, switches format, closes with Escape and returns focus', async ({ page }) => {
  await page.goto('publications/');
  const trigger = page.locator('[data-cite-open]').first();
  await trigger.click();
  const dialog = page.locator('dialog[open]');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('tab', { name: 'BibTeX' }).click();
  await expect(dialog.getByRole('tabpanel')).toContainText('@article{islam-2025-scirep-buche');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('contact page reveals the email only on request', async ({ page }) => {
  await page.goto('contact/');
  const html = await page.content();
  expect(html).not.toContain('farhanishrakrafi@yahoo.com');
  await page.getByRole('button', { name: 'Show email' }).click();
  await expect(page.locator('a[href^="mailto:"]')).toHaveText('farhanishrakrafi@yahoo.com');
});

test('search finds the thesis project by typing NDM', async ({ page }) => {
  await page.goto('search/');
  const input = page.locator('#search input');
  await input.fill('NDM');
  await expect(page.locator('.pagefind-ui__result-link').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.pagefind-ui__results')).toContainText('Escherichia coli');
});

test('machine routes exist', async ({ request }) => {
  for (const path of ['sitemap-index.xml', 'robots.txt', 'rss.xml', 'publications.bib', 'og/home.png', 'favicon.svg']) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
  const robots = await (await request.get('robots.txt')).text();
  expect(robots).toContain('Sitemap:');
  const bib = await (await request.get('publications.bib')).text();
  expect(bib).toContain('10.1038/s41598-025-98092-y');
});

test('publication page has Google Scholar meta tags', async ({ page }) => {
  await page.goto('publications/islam-2025-scirep-buche/');
  await expect(page.locator('meta[name="citation_title"]')).toHaveCount(1);
  expect(await page.locator('meta[name="citation_author"]').count()).toBeGreaterThan(0);
  await expect(page.locator('meta[name="citation_publication_date"]')).toHaveAttribute('content', /^\d{4}(\/\d{1,2}){0,2}$/);
  await expect(page.locator('meta[name="citation_journal_title"]')).toHaveAttribute('content', 'Scientific Reports');
  await expect(page.locator('meta[name="citation_firstpage"]')).toHaveAttribute('content', '17134');
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.some((j) => j.includes('"ScholarlyArticle"'))).toBe(true);
});

test('home page has Person structured data', async ({ page }) => {
  await page.goto('');
  const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(jsonLd.some((j) => j.includes('"@type":"Person"'))).toBe(true);
});
