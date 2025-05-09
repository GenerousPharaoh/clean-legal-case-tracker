import { defineConfig, devices } from '@playwright/test';

// Resolve port from env or default (match Vite HMR port)
const port = Number(process.env.VITE_DEV_PORT) || 3008;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 5000 },
  use: {
    // Allow overriding via APP_URL env var, fallback to localhost and matching port
    baseURL: process.env.APP_URL || `http://localhost:${port}`,
    headless: true,
    viewport: { width: 1280, height: 720 },
    video: 'retain-on-failure',
    actionTimeout: 5000,
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
}); 