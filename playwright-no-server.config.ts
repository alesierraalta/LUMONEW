import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config without webServer - assumes app is already running
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run audit tests sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for audit tests
  reporter: [
    ['list'], // Simple console output
    ['json', { outputFile: 'audit-test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer - assume app is already running on localhost:3000
});
