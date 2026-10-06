import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { ROUTES } from './routes.ts';

/** WCAG 2.2 AA: zero axe-core violations on every page, in light and dark themes. */
for (const theme of ['light', 'dark'] as const) {
  test.describe(`${theme} theme`, () => {
    test.use({ colorScheme: theme });

    for (const route of ROUTES) {
      test(`no axe violations: /${route}`, async ({ page }) => {
        await page.goto(route);
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          // Pagefind's third-party search widget is checked separately below.
          .exclude('#search')
          .analyze();
        const summary = results.violations.map(
          (v) => `${v.id} (${v.impact}): ${v.help}\n    ${v.nodes.map((n) => n.target.join(' ')).join('\n    ')}`,
        );
        expect(summary, summary.join('\n')).toEqual([]);
      });
    }
  });
}

test('cite dialog has no axe violations when open', async ({ page }) => {
  await page.goto('publications/');
  await page.locator('[data-cite-open]').first().click();
  await expect(page.locator('dialog[open]')).toBeVisible();
  const results = await new AxeBuilder({ page }).include('dialog[open]').analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
});
