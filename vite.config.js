import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// the self-hosted fonts (see src/fonts.js and src/lib/skins.js), all SIL OFL 1.1
const FONTS = ['inter', 'noto-sans-thai', 'mitr', 'kanit', 'noto-serif-thai', 'mali']

/** The OFL asks for its text to travel with the fonts: one copy per family in dist/licenses. */
const fontLicenses = () => ({
  name: 'font-licenses',
  apply: 'build',
  generateBundle() {
    for (const font of FONTS)
      this.emitFile({
        type: 'asset',
        fileName: `licenses/${font}-OFL.txt`,
        source: readFileSync(`node_modules/@fontsource/${font}/LICENSE`, 'utf8'),
      })
  },
})

export default defineConfig({
  // relative base so the build works on Vercel/Netlify root *and* on a
  // GitHub Pages sub-path (username.github.io/bad-matchup/) without changes
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    fontLicenses(),
    VitePWA({
      // a new version waits for the "reload" toast — never mid-game on its own
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        id: './',
        name: 'Bad Matchup · จับคู่ตีแบด',
        short_name: 'Bad Matchup',
        description: 'จับคู่ตีแบดมินตัน จัดตารางลงคอร์ทอัตโนมัติ',
        lang: 'th',
        start_url: './',
        scope: './',
        display: 'standalone',
        theme_color: '#d1d9c6',
        background_color: '#e7e3d5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // The app shell and the default skin's fonts (Thai and Latin) go in
        // up front. Firebase is fetched only once someone opens or watches a
        // room, and the other skins' fonts only once a skin shows them; both
        // are kept from then on (runtimeCaching below).
        globPatterns: [
          '**/*.{js,css,html,svg,png}',
          'assets/noto-sans-thai-{thai,latin}-[4-7]00-normal-*.woff2',
          'assets/inter-latin-[4-7]00-normal-*.woff2',
        ],
        globIgnores: ['**/roomRemote-*.js', '**/firebase-*.js'],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/(roomRemote|firebase)-[\w-]+\.js$/,
            handler: 'CacheFirst',
            options: { cacheName: 'firebase', expiration: { maxEntries: 10 } },
          },
          {
            urlPattern: /\/assets\/[\w-]+\.woff2?$/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 80 } },
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // one predictable name for the SDK, so the service worker can leave it
        // out of the precache and keep it once it has been loaded
        manualChunks: (id) => (/node_modules\/@?firebase\//.test(id) ? 'firebase' : undefined),
      },
    },
  },
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
