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
 * with @fontsource); it runs only once the skin is shown. A `darkOnly` skin
 * keeps the page dark whatever the theme; its light token values are only
 * used to draw the shared schedule image, which is always on light paper.
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
      backdrop: 'repeating-linear-gradient(0deg, oklch(0.2 0.006 60 / 0.07) 0 1px, transparent 1px 3px)',
      live: {
        bg: 'transparent',
        ink: 'oklch(0.47 0.17 30)',
        border: '1px solid oklch(0.47 0.17 30)',
        radius: '0.1rem',
        tilt: '-2deg',
      },
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
      backdrop: 'radial-gradient(oklch(0.8 0.1 330 / 0.4) 1.5px, transparent 2px)',
      backdropSize: '12px 12px',
      live: {
        bg: 'oklch(0.76 0.15 12)',
        ink: 'oklch(0.2 0.05 300)',
        shadow: '0 3px 6px -3px oklch(0.6 0.2 12 / 0.6)',
      },
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
      backdrop: 'radial-gradient(oklch(0.5 0.05 255 / 0.25) 1px, transparent 1.3px)',
      backdropSize: '12px 12px',
      live: {
        bg: 'oklch(0.22 0.04 260)',
        ink: 'white',
        radius: '0.3rem',
        dot: 'oklch(0.85 0.17 130)',
      },
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
      live: {
        bg: 'black',
        ink: 'white',
        radius: '0.2rem',
      },
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
      backdrop: 'repeating-linear-gradient(135deg, oklch(0.5 0.02 250 / 0.12) 0 1px, transparent 1px 6px)',
      live: {
        bg: 'transparent',
        ink: 'oklch(0.42 0.06 250)',
        border: '1px solid oklch(0.5 0.06 250)',
      },
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
      backdrop: 'radial-gradient(ellipse 4px 3px at 30% 40%, oklch(0.8 0.1 350 / 0.7) 99%, transparent)',
      backdropSize: '22px 22px',
      live: {
        bg: 'oklch(0.93 0.04 350)',
        ink: 'oklch(0.4 0.12 350)',
        border: '1px solid oklch(0.8 0.08 350)',
        dot: 'oklch(0.62 0.16 350)',
      },
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
      backdrop: 'repeating-linear-gradient(45deg, oklch(0.6 0.1 80 / 0.16) 0 1px, transparent 1px 7px), repeating-linear-gradient(-45deg, oklch(0.6 0.1 80 / 0.16) 0 1px, transparent 1px 7px)',
      live: {
        bg: 'oklch(0.405 0.141 25)',
        ink: 'oklch(0.95 0.06 90)',
        border: '1px solid oklch(0.635 0.121 75)',
        radius: '0.15rem',
      },
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
      backdrop: 'radial-gradient(circle at 50% 100%, transparent 5px, oklch(0.55 0.08 195 / 0.25) 6px 7px, transparent 8px)',
      backdropSize: '14px 8px',
      live: {
        bg: 'oklch(0.5 0.116 195)',
        ink: 'white',
        dot: 'oklch(0.77 0.117 45)',
      },
    },
  },
  {
    id: 'neon',
    label: 'skinNeon',
    extra: true,
    // its own look is the dark one, so the app keeps it dark whatever the theme
    darkOnly: true,
    font: "'Chakra Petch', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/chakra-petch/thai-500.css'),
        import('@fontsource/chakra-petch/thai-600.css'),
        import('@fontsource/chakra-petch/thai-700.css'),
        import('@fontsource/chakra-petch/latin-500.css'),
        import('@fontsource/chakra-petch/latin-600.css'),
        import('@fontsource/chakra-petch/latin-700.css'),
      ]),
    bar: { light: '#f3f1fb', dark: '#0b0a1a' },
    preview: {
      page: '#0b0a1a',
      card: 'oklch(0.185 0.045 285)',
      line: '1px solid oklch(0.45 0.12 215)',
      shadow: '0 0 14px -4px oklch(0.78 0.14 215 / 0.7)',
      ink: '#e6e4f5',
      ta: 'oklch(0.82 0.12 215)',
      tb: 'oklch(0.78 0.17 345)',
      backdrop: 'repeating-linear-gradient(90deg, oklch(0.8 0.15 215 / 0.12) 0 1px, transparent 1px 16px)',
      radius: '0.375rem',
      brand: 'oklch(0.5 0.145 215)',
      accent: 'oklch(0.58 0.21 345)',
      live: {
        bg: 'oklch(0.14 0.045 285)',
        ink: 'oklch(0.86 0.1 215)',
        border: '1px solid oklch(0.78 0.14 215)',
        radius: '0.2rem',
        shadow: '0 0 8px oklch(0.78 0.15 215 / 0.8)',
        dot: 'oklch(0.72 0.2 345)',
      },
    },
  },
  {
    id: 'chalk',
    label: 'skinChalk',
    extra: true,
    // its own look is the dark one, so the app keeps it dark whatever the theme
    darkOnly: true,
    font: "'Sriracha', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/sriracha/thai-400.css'),
        import('@fontsource/sriracha/latin-400.css'),
      ]),
    bar: { light: '#f6f4ea', dark: '#1d3a30' },
    preview: {
      page: '#2c4a3e',
      card: 'oklch(0.36 0.04 160)',
      line: '1.5px solid oklch(0.5 0.035 160)',
      shadow: 'none',
      ink: '#efeee2',
      ta: 'oklch(0.86 0.09 230)',
      tb: 'oklch(0.84 0.1 355)',
      radius: '1rem',
      brand: 'oklch(0.5 0.126 92)',
      accent: 'oklch(0.61 0.13 355)',
      live: {
        bg: 'transparent',
        ink: 'oklch(0.9 0.12 95)',
        border: '1.5px solid oklch(0.9 0.12 95)',
        tilt: '-3deg',
      },
    },
  },
  {
    id: 'gym',
    label: 'skinGym',
    extra: true,
    font: "'Prompt', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/prompt/thai-600.css'),
        import('@fontsource/prompt/thai-700.css'),
        import('@fontsource/prompt/latin-600.css'),
        import('@fontsource/prompt/latin-700.css'),
      ]),
    bar: { light: '#ecd9bb', dark: '#1a130c' },
    preview: {
      page: 'oklch(0.885 0.055 72)',
      card: 'oklch(0.965 0.022 80)',
      line: '2px solid oklch(0.835 0.045 70)',
      shadow: '0 2px 0 0 oklch(0.55 0.08 60 / 0.35)',
      ink: '#3a2a1a',
      backdrop: 'repeating-linear-gradient(90deg, oklch(0.5 0.08 60 / 0.22) 0 1px, transparent 1px 24px)',
      radius: '0.375rem',
      brand: 'oklch(0.5 0.126 152)',
      accent: 'oklch(0.57 0.17 30)',
      live: {
        bg: 'oklch(0.42 0.114 152)',
        ink: 'white',
        border: '1.5px solid white',
        radius: '0.15rem',
        shadow: '0 0 0 1px oklch(0.34 0.1 152)',
      },
    },
  },
  {
    id: 'retro',
    label: 'skinRetro',
    extra: true,
    font: "'Pattaya', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/pattaya/thai-400.css'),
        import('@fontsource/pattaya/latin-400.css'),
      ]),
    bar: { light: '#fbeef3', dark: '#1a0f24' },
    preview: {
      page: 'oklch(0.955 0.02 330)',
      card: 'oklch(0.982 0.013 330)',
      line: '2px solid oklch(0.225 0.05 300)',
      shadow: '3px 3px 0 0 oklch(0.76 0.16 330 / 0.6)',
      ink: '#2a1a33',
      backdrop: 'linear-gradient(180deg, transparent 55%, oklch(0.82 0.12 60 / 0.4) 55% 62%, transparent 62% 70%, oklch(0.7 0.18 340 / 0.35) 70% 74%, transparent 74%)',
      radius: '0.5rem',
      brand: 'oklch(0.5 0.194 330)',
      accent: 'oklch(0.61 0.17 50)',
      live: {
        bg: 'oklch(0.71 0.16 50)',
        ink: 'oklch(0.17 0.05 300)',
        border: '1.5px solid oklch(0.17 0.05 300)',
        radius: '0.2rem',
        shadow: '2px 2px 0 0 oklch(0.62 0.2 330), 4px 4px 0 0 oklch(0.45 0.15 290)',
      },
    },
  },
  {
    id: 'manga',
    label: 'skinManga',
    extra: true,
    font: "'Itim', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/itim/thai-400.css'),
        import('@fontsource/itim/latin-400.css'),
      ]),
    bar: { light: '#ffffff', dark: '#0d0d0d' },
    preview: {
      page: 'oklch(0.97 0 0)',
      card: 'white',
      line: '2px solid #111',
      shadow: '2px 2px 0 0 #111',
      ink: '#111',
      backdrop: 'radial-gradient(oklch(0 0 0 / 0.16) 0.8px, transparent 1px)',
      backdropSize: '4px 4px',
      radius: '0.75rem',
      brand: 'oklch(0.5 0.194 25)',
      accent: 'oklch(0.6 0.15 255)',
      live: {
        bg: 'white',
        ink: '#111',
        border: '1.5px solid #111',
        shadow: '1.5px 1.5px 0 0 #111',
      },
    },
  },
  {
    id: 'plaid',
    label: 'skinPlaid',
    extra: true,
    font: "'Kodchasan', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/kodchasan/thai-500.css'),
        import('@fontsource/kodchasan/thai-600.css'),
        import('@fontsource/kodchasan/thai-700.css'),
        import('@fontsource/kodchasan/latin-500.css'),
        import('@fontsource/kodchasan/latin-600.css'),
        import('@fontsource/kodchasan/latin-700.css'),
      ]),
    bar: { light: '#f7f1e3', dark: '#0f1120' },
    preview: {
      page: 'oklch(0.955 0.016 85)',
      card: 'oklch(0.982 0.011 85)',
      line: '1.5px solid oklch(0.905 0.021 85)',
      shadow: '0 2px 8px -3px oklch(0.4 0.08 265 / 0.3)',
      ink: '#1d2033',
      backdrop: 'repeating-linear-gradient(0deg, oklch(0.55 0.17 25 / 0.14) 0 4px, transparent 4px 12px, oklch(0.45 0.15 265 / 0.14) 12px 14px, transparent 14px 20px), repeating-linear-gradient(90deg, oklch(0.55 0.17 25 / 0.14) 0 4px, transparent 4px 12px, oklch(0.45 0.15 265 / 0.14) 12px 14px, transparent 14px 20px)',
      radius: '0.625rem',
      brand: 'oklch(0.5 0.145 265)',
      accent: 'oklch(0.57 0.17 25)',
      live: {
        bg: 'oklch(0.5 0.165 25)',
        ink: 'white',
        border: '1px solid white',
        radius: '0.3rem',
        shadow: '0 0 0 1.5px oklch(0.5 0.145 265)',
      },
    },
  },
  {
    id: 'champ',
    label: 'skinChamp',
    extra: true,
    // its own look is the dark one, so the app keeps it dark whatever the theme
    darkOnly: true,
    font: "'Bai Jamjuree', 'Noto Sans Thai', sans-serif",
    fonts: () =>
      Promise.all([
        import('@fontsource/bai-jamjuree/thai-500.css'),
        import('@fontsource/bai-jamjuree/thai-600.css'),
        import('@fontsource/bai-jamjuree/thai-700.css'),
        import('@fontsource/bai-jamjuree/latin-500.css'),
        import('@fontsource/bai-jamjuree/latin-600.css'),
        import('@fontsource/bai-jamjuree/latin-700.css'),
      ]),
    bar: { light: '#f6f2e6', dark: '#0c0b09' },
    preview: {
      page: '#0c0b09',
      card: 'oklch(0.185 0.012 75)',
      line: '1px solid oklch(0.5 0.08 80)',
      shadow: '0 0 10px -4px oklch(0.8 0.12 85 / 0.6)',
      ink: '#f1ece0',
      ta: 'oklch(0.82 0.1 230)',
      tb: 'oklch(0.8 0.13 20)',
      backdrop: 'radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.8 0.12 85 / 0.3), transparent 70%)',
      radius: '0.5rem',
      brand: 'oklch(0.5 0.116 80)',
      accent: 'oklch(0.57 0.17 20)',
      live: {
        bg: 'linear-gradient(135deg, oklch(0.9 0.11 92), oklch(0.72 0.13 75))',
        ink: 'oklch(0.22 0.04 70)',
        border: '1px solid oklch(0.6 0.11 75)',
      },
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
