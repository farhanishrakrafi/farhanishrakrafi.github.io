import { defineConfig, devices } from '@playwright/test';

/**
 * Runs against the built site (`npm run build` first) served by `astro preview`.
 * BASE_PATH must match the build: '' for a root build, '/Website' for the default.
 */
const base = (process.env.BASE_PATH ?? '/Website').replace(/\/+$/, '');
const port = Number(process.env.PORT ?? 4321);
const executablePath = process.env.CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${port}${base}/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { executablePath } } },
  ],
  webServer: {
    command: `npx astro preview --port ${port} --ignore-lock`,
    url: `http://localhost:${port}${base}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
