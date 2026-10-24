/**
 * The skins the app can wear. Each one is a block of token values in
 * src/index.css (selected by <html data-skin="…">); this list is what the
 * settings picker shows (`extra` ones in their own sheet). A skin only changes the look — layout, wording and
 * matchmaking stay the same.
 *
 * `preview` is a tiny swatch of the skin drawn with inline styles, so the
 * picker can show every skin side by side whichever one is active. `bar` is
 * the browser toolbar colour (meta theme-color) for light and dark. The
 * preview may also carry the skin's signature — `backdrop`/`backdropSize` and
 * `live` (how the round on court is marked) — mirroring its tokens. `fonts`
 * loads a display face src/fonts.js does not already bring in (self-hosted
 * with @fontsource); it runs only once the skin is shown.
 */
export const SKINS = [
  {
    id: 'classic',
    label: 'skinClassic',
    font: "'Noto Sans Thai', sans-serif",
    bar: { light: '#d1d9c6', dark: '#031822' },
    preview: {
      page: 'oklch(0.915 0.019 91)',
      card: 'oklch(0.952 0.014 92)',
      line: '1px solid oklch(0.858 0.021 91)',
      shadow: '0 1px 3px 0 rgb(0 0 0 / 0.12)',
      radius: '0.375rem',
      brand: 'oklch(0.546 0.136 154)',
      accent: 'oklch(0.706 0.168 55)',
      pick: 'oklch(0.952 0.014 92)',
    },
  },
  {
    id: 'league',
    label: 'skinLeague',
    font: "'Mitr', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/mitr/thai-400.css'),
        import('@fontsource/mitr/thai-500.css'),
        import('@fontsource/mitr/thai-600.css'),
        import('@fontsource/mitr/latin-400.css'),
        import('@fontsource/mitr/latin-500.css'),
        import('@fontsource/mitr/latin-600.css'),
      ]),
    bar: { light: '#fef5e6', dark: '#1c1109' },
    preview: {
      page: 'oklch(0.972 0.022 80)',
      card: 'oklch(0.992 0.008 85)',
      line: '2px solid oklch(0.255 0.032 54)',
      shadow: '2px 2px 0 0 oklch(0.255 0.032 54)',
      radius: '9999px',
      brand: 'oklch(0.52 0.2 268)',
      accent: 'oklch(0.69 0.19 48)',
      pick: 'oklch(0.88 0.16 95)',
      backdrop: 'radial-gradient(oklch(0.255 0.032 54 / 0.14) 1px, transparent 1.3px)',
      backdropSize: '8px 8px',
      live: {
        bg: 'oklch(0.88 0.16 95)',
        ink: 'oklch(0.3 0.06 80)',
        border: '1.5px solid oklch(0.255 0.032 54)',
        shadow: '1.5px 1.5px 0 0 oklch(0.255 0.032 54)',
        tilt: '-4deg',
      },
    },
  },
  {
    id: 'scoreboard',
    label: 'skinScoreboard',
    font: "'Kanit', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/kanit/thai-400.css'),
        import('@fontsource/kanit/thai-500.css'),
        import('@fontsource/kanit/thai-600.css'),
        import('@fontsource/kanit/latin-400.css'),
        import('@fontsource/kanit/latin-500.css'),
        import('@fontsource/kanit/latin-600.css'),
      ]),
    bar: { light: '#dbe0e6', dark: '#040710' },
    preview: {
      page: 'oklch(0.952 0.006 255)',
      card: 'oklch(0.985 0.003 255)',
      line: '1px solid oklch(0.83 0.014 255)',
      shadow: 'inset 0 2px 0 0 oklch(0.74 0.17 62)',
      radius: '0.125rem',
      brand: 'oklch(0.53 0.16 242)',
      accent: 'oklch(0.74 0.17 62)',
      pick: 'oklch(0.215 0.028 262)',
      backdrop:
        'repeating-linear-gradient(90deg, oklch(0.5 0.03 255 / 0.14) 0 1px, transparent 1px 18px)',
      live: { bg: 'oklch(0.215 0.028 262)', ink: 'white', radius: '0.2rem', dot: 'oklch(0.79 0.16 70)' },
    },
  },
  {
    id: 'editorial',
    label: 'skinEditorial',
    font: "'Noto Serif Thai', Georgia, serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/noto-serif-thai/thai-500.css'),
        import('@fontsource/noto-serif-thai/thai-600.css'),
        import('@fontsource/noto-serif-thai/thai-700.css'),
        import('@fontsource/noto-serif-thai/latin-500.css'),
        import('@fontsource/noto-serif-thai/latin-600.css'),
        import('@fontsource/noto-serif-thai/latin-700.css'),
      ]),
    bar: { light: '#fdfcf9', dark: '#0d0b09' },
    preview: {
      page: 'oklch(0.962 0.009 88)',
      card: 'oklch(0.99 0.004 90)',
      line: '1px solid oklch(0.2 0.006 60)',
      shadow: '3px 3px 0 -1px oklch(0.99 0.004 90), 3px 3px 0 0 oklch(0.2 0.006 60)',
      radius: '0.0625rem',
      brand: 'oklch(0.43 0.12 258)',
      accent: 'oklch(0.55 0.2 30)',
      pick: 'oklch(0.2 0.006 60)',
    },
  },
  {
    id: 'candy',
    label: 'skinCandy',
    font: "'Mali', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/mali/thai-500.css'),
        import('@fontsource/mali/thai-600.css'),
        import('@fontsource/mali/thai-700.css'),
        import('@fontsource/mali/latin-500.css'),
        import('@fontsource/mali/latin-600.css'),
        import('@fontsource/mali/latin-700.css'),
      ]),
    bar: { light: '#fffbff', dark: '#141024' },
    preview: {
      page: 'oklch(0.965 0.02 310)',
      card: 'oklch(0.992 0.007 320)',
      line: '1px solid oklch(0.92 0.03 305)',
      shadow: '0 4px 10px -4px oklch(0.55 0.2 300 / 0.45)',
      radius: '9999px',
      brand: 'oklch(0.55 0.22 300)',
      accent: 'oklch(0.68 0.19 12)',
      pick: 'oklch(0.89 0.1 170)',
    },
  },
  // the extra skins: picked from their own sheet, so the main grid stays five
  {
    id: 'night',
    label: 'skinNight',
    extra: true,
    font: "'Kanit', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/kanit/thai-400.css'),
        import('@fontsource/kanit/thai-500.css'),
        import('@fontsource/kanit/thai-600.css'),
        import('@fontsource/kanit/latin-400.css'),
        import('@fontsource/kanit/latin-500.css'),
        import('@fontsource/kanit/latin-600.css'),
      ]),
    bar: { light: '#cad9eb', dark: '#040c22' },
    preview: {
      page: 'oklch(0.915 0.018 250)',
      card: 'oklch(0.955 0.012 250)',
      line: '1px solid oklch(0.86 0.024 252)',
      shadow: '0 1px 0 0 oklch(0.88 0.2 125 / 0.5), 0 2px 8px -2px oklch(0.2 0.05 262 / 0.35)',
      radius: '0.375rem',
      brand: 'oklch(0.53 0.165 135)',
      accent: 'oklch(0.625 0.13 220)',
      pick: 'oklch(0.9 0.2 125)',
    },
  },
  {
    id: 'contrast',
    label: 'skinContrast',
    extra: true,
    font: "'Noto Sans Thai', sans-serif",
    bar: { light: '#ffffff', dark: '#000000' },
    preview: {
      page: 'oklch(0.985 0 0)',
      card: 'oklch(1 0 0)',
      line: '2px solid oklch(0 0 0)',
      shadow: 'none',
      radius: '0.375rem',
      brand: 'oklch(0.48 0.194 265)',
      accent: 'oklch(0.565 0.19 35)',
      pick: 'oklch(0.92 0.19 103)',
    },
  },
  {
    id: 'feather',
    label: 'skinFeather',
    extra: true,
    font: "'Noto Sans Thai', sans-serif",
    bar: { light: '#fcfdff', dark: '#0b0f17' },
    preview: {
      page: 'oklch(0.975 0.005 250)',
      card: 'oklch(0.995 0.002 250)',
      line: '1px solid oklch(0.925 0.008 252)',
      shadow: '0 1px 2px 0 oklch(0.3 0.02 260 / 0.08)',
      radius: '0.5rem',
      brand: 'oklch(0.52 0.165 260)',
      accent: 'oklch(0.575 0.06 250)',
      pick: 'oklch(0.995 0.002 250)',
    },
  },
  {
    id: 'sakura',
    label: 'skinSakura',
    extra: true,
    font: "'Noto Sans Thai', sans-serif",
    bar: { light: '#fff8fb', dark: '#190b15' },
    preview: {
      page: 'oklch(0.958 0.016 352)',
      card: 'oklch(0.985 0.008 350)',
      line: '1px solid oklch(0.91 0.024 354)',
      shadow: '0 6px 18px -10px oklch(0.5 0.15 350 / 0.35)',
      radius: '9999px',
      brand: 'oklch(0.51 0.155 350)',
      accent: 'oklch(0.605 0.16 8)',
      pick: 'oklch(0.9 0.06 355)',
    },
  },
  {
    id: 'thai',
    label: 'skinThai',
    extra: true,
    font: "'Taviraj', 'Noto Serif Thai', serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/taviraj/thai-500.css'),
        import('@fontsource/taviraj/thai-600.css'),
        import('@fontsource/taviraj/thai-700.css'),
        import('@fontsource/taviraj/latin-500.css'),
        import('@fontsource/taviraj/latin-600.css'),
        import('@fontsource/taviraj/latin-700.css'),
      ]),
    bar: { light: '#f5ecda', dark: '#1b0a07' },
    preview: {
      page: 'oklch(0.945 0.026 85)',
      card: 'oklch(0.975 0.016 85)',
      line: '1px solid oklch(0.89 0.036 84)',
      shadow: '0 0 0 1px oklch(0.75 0.11 82 / 0.55), 0 2px 6px -2px oklch(0.3 0.06 40 / 0.25)',
      radius: '0.25rem',
      brand: 'oklch(0.49 0.155 25)',
      accent: 'oklch(0.555 0.13 75)',
      pick: 'oklch(0.82 0.12 85)',
    },
  },
  {
    id: 'ocean',
    label: 'skinOcean',
    extra: true,
    font: "'Noto Sans Thai', sans-serif",
    bar: { light: '#d2efec', dark: '#001218' },
    preview: {
      page: 'oklch(0.955 0.014 190)',
      card: 'oklch(0.982 0.008 195)',
      line: '1px solid oklch(0.905 0.02 188)',
      shadow: '0 2px 10px -4px oklch(0.4 0.06 205 / 0.3)',
      radius: '0.75rem',
      brand: 'oklch(0.5 0.116 195)',
      accent: 'oklch(0.605 0.15 45)',
      pick: 'oklch(0.982 0.008 195)',
    },
  },
]

export const DEFAULT_SKIN = 'classic'

export const BASE_SKINS = SKINS.filter((s) => !s.extra)
export const EXTRA_SKINS = SKINS.filter((s) => s.extra)

export const isSkin = (id) => SKINS.some((s) => s.id === id)

export const skinById = (id) =>
  SKINS.find((s) => s.id === id) || SKINS.find((s) => s.id === DEFAULT_SKIN)

const loaded = new Set()

/** Adds the skin's display font to the page, once. If it cannot load, the page font stands in. */
export function loadSkinFont(skin) {
  if (!skin?.fonts || typeof document === 'undefined' || loaded.has(skin.id)) return
  loaded.add(skin.id)
  skin.fonts().catch(() => loaded.delete(skin.id))
}
