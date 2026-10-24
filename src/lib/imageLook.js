/**
 * How the shared pictures (the schedule and the bill) look: the active skin's
 * own colours and display face, always taken from its light values, so the
 * picture sits on light paper whatever theme the organiser uses — the group
 * reads it in LINE. Classic keeps the hand-tuned palette the images always had.
 */
export const BODY_FONT = '"Noto Sans Thai", "Inter", system-ui, sans-serif'

/** The images' original colours, kept for Classic. */
export const CLASSIC = {
  bg: '#fbfaf6', // ivory paper
  stripe: '#f3f2ec',
  line: '#e3e1d8',
  hairline: '#edebe3',
  text: '#1c2b24',
  muted: '#6b7671',
  faint: '#9aa39e',
  brand: '#2f7d55',
  accent: '#d9762b',
  onAccent: '#ffffff',
}

const TOKENS = {
  bg: '--color-slate-50',
  stripe: '--color-slate-100',
  line: '--color-slate-200',
  hairline: '--color-slate-200',
  text: '--color-slate-900',
  muted: '--color-slate-600',
  faint: '--color-slate-500',
  brand: '--color-brand-600',
  accent: '--color-accent-500',
  onAccent: '--color-on-accent',
}

let probe = null

/** Any CSS colour (oklch included) as #rrggbb, or null if the canvas cannot read it. */
function toHex(color) {
  if (!color) return null
  probe ||= document.createElement('canvas').getContext('2d', { willReadFrequently: true })
  probe.fillStyle = '#010203'
  probe.fillStyle = color
  if (probe.fillStyle === '#010203') return null
  probe.clearRect(0, 0, 1, 1)
  probe.fillRect(0, 0, 1, 1)
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data
  return a ? '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('') : null
}

/** Two #rrggbb colours blended, `t` of the way from `a` to `b`. */
function mix(a, b, t) {
  const ch = (hex, i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  return (
    '#' +
    [0, 1, 2]
      .map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t).toString(16).padStart(2, '0'))
      .join('')
  )
}

/** @returns {{ colors: typeof CLASSIC, display: string, displayWeight: number }} */
export function skinLook() {
  const classic = { colors: CLASSIC, display: BODY_FONT, displayWeight: 700 }
  if (typeof document === 'undefined') return classic
  const root = document.documentElement
  if ((root.dataset.skin || 'classic') === 'classic') return classic

  // read the light values even when the page is dark: drop the class for the
  // read and put it straight back, before anything is painted
  const wasDark = root.classList.contains('dark')
  if (wasDark) root.classList.remove('dark')
  const css = getComputedStyle(root)
  const raw = Object.fromEntries(
    Object.entries(TOKENS).map(([key, name]) => [key, css.getPropertyValue(name).trim()])
  )
  const display = css.getPropertyValue('--font-display').trim()
  const weight = Number(css.getPropertyValue('--display-weight').trim())
  if (wasDark) root.classList.add('dark')

  const colors = { ...CLASSIC }
  for (const [key, value] of Object.entries(raw)) {
    const hex = toHex(value)
    if (hex) colors[key] = hex
  }
  // a skin's page tone can be deep (Gym's wood); the picture's row stripes
  // stay a soft step off the paper, as they always were
  colors.stripe = mix(colors.bg, colors.stripe, 0.55)
  return {
    colors,
    display: display || BODY_FONT,
    // a face that only comes in one weight would be smeared by a fake bold
    displayWeight: weight === 400 ? 400 : 700,
  }
}
