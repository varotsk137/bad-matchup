import { defineConfig, devices } from '@playwright/test'

// End-to-end checks of the flows a club night depends on. They drive the real
// app in a browser, so a refactor that keeps the unit tests green but breaks
// the wiring between the screens and the data still gets caught.
const PORT = 5180
// the built app, service worker and all, for the checks that need one
const PREVIEW_PORT = 5181

export default defineConfig({
  testDir: 'e2e',
  // building a schedule runs the full matchmaker, which takes a few seconds
  timeout: 60_000,
  expect: { timeout: 30_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: `npm run dev -- --port ${PORT} --strictPort`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npm run build && npx vite preview --port ${PREVIEW_PORT} --strictPort`,
      url: `http://localhost:${PREVIEW_PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
})
