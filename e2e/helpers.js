// Must match the key in src/lib/storage.js.
export const STORAGE_KEY = 'bad-matchup:v1'

/**
 * Puts a saved state in place before the app boots — once per test. A plain
 * init script would run again on every reload and wipe whatever the app had
 * saved, which is exactly what the persistence checks need to see.
 */
export async function seed(page, state) {
  await page.addInitScript(
    ([key, value]) => {
      if (sessionStorage.getItem('e2e-seeded')) return
      localStorage.setItem(key, value)
      sessionStorage.setItem('e2e-seeded', '1')
    },
    [STORAGE_KEY, JSON.stringify({ lang: 'en', theme: 'light', ...state })]
  )
}

export const players = (names) =>
  names.map((name, i) => ({
    id: `p${i}`,
    name,
    level: 3,
    gender: '-',
    active: true,
    resting: false,
  }))

export const savedState = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), STORAGE_KEY)

/**
 * A share link in the uncompressed form (codec '0'), built by hand so the test
 * does not lean on the app's own encoder to check its decoder.
 */
export function shareHash(packed, mode = 'v') {
  const b64 = Buffer.from(JSON.stringify(packed), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `#s=0${b64}&m=${mode}`
}

// Must match PREVIEW_PORT in playwright.config.js: the built app, with its service worker.
export const PREVIEW_URL = 'http://localhost:5181'
