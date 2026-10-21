import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // relative base so the build works on Vercel/Netlify root *and* on a
  // GitHub Pages sub-path (username.github.io/bad-matchup/) without changes
  base: './',
  plugins: [react(), tailwindcss()],
  server: { host: true },
  // the schedules in the tests are real builds and take a few seconds each
  // e2e/ holds the Playwright specs, which run in a browser via `npm run e2e`;
  // rules-tests/ needs the Firestore emulator and runs via `npm run test:rules`
  test: {
    testTimeout: 60000,
    exclude: [
      ...configDefaults.exclude,
      'e2e/**',
      ...(process.env.FIRESTORE_EMULATOR_HOST ? [] : ['rules-tests/**']),
    ],
  },
})
