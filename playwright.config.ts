import { defineConfig, devices } from '@playwright/test';
import { SITE } from './src/config/site.ts';

/**
 * Runs against the built site (`npm run build` first) served by `astro preview`.
 * The base path comes from src/config/site.ts (or BASE_PATH), the same as the build.
 */
const base = SITE.base;
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
