/**
 * The skins the app can wear. Each one is a block of token values in
 * src/index.css (selected by <html data-skin="…">); this list is what the
 * settings picker shows. A skin only changes the look — layout, wording and
 * matchmaking stay the same.
 *
 * `preview` is a tiny swatch of the skin drawn with inline styles, so the
 * picker can show every skin side by side whichever one is active. `bar` is
 * the browser toolbar colour (meta theme-color) for light and dark. `fonts`
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
]

export const DEFAULT_SKIN = 'classic'

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
