/**
 * Audit System Test Configuration
 * Configuration for automated audit system tests
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: [
    'audit-system-comprehensive.test.ts',
    'audit-api-integration.test.ts',
    'audit-system.test.ts'
  ],
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },
  fullyParallel: false, // Run audit tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Use single worker for audit tests
  reporter: [
    ['html', { outputFolder: 'audit-test-results' }],
    ['json', { outputFile: 'audit-test-results.json' }],
    ['junit', { outputFile: 'audit-test-results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  projects: [
    {
      name: 'audit-system-tests',
      testMatch: /audit-system.*\.test\.ts/,
      use: {
        // Specific configuration for audit system tests
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    },
    {
      name: 'audit-api-tests',
      testMatch: /audit-api.*\.test\.ts/,
      use: {
        // Specific configuration for API tests
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    }
  ],
  // No webServer configuration - assume app is already running
  // Tests will connect to existing localhost:3000
});
