/**
 * Renders the schedule to a PNG: a matchday poster for the club's LINE group.
 *
 * Drawn straight onto a canvas with fillText rather than going through
 * html2canvas or an SVG round-trip: those either pull in ~200 KB of library or
 * drop the Thai webfont when the SVG is rasterised. The canvas 2D context uses
 * the fonts already loaded by the page, so Thai names come out correct.
 *
 * Every colour and the display face come from the active skin's CSS variables,
 * in the theme the organiser is using: a dark app makes a dark poster.
 */
import { BODY_FONT, CLASSIC } from './imageLook'

export const APP_URL = 'bad-matchup.varot.me'

/* Logical px. LINE recompresses, so nothing is drawn under 26px. */
const PAD = 64
const MIN_W = 1080
const MIN_COL = 300
const MAX_COL = 540
const COL_GAP = 48
const NAME_LH = 46
const VS_LH = 32
const ROW_PAD = 24
const BENCH_LH = 36
const CELL_H = NAME_LH * 2 + VS_LH
// iOS Safari refuses a canvas over ~16.7M pixels and hands back a blank one
const MAX_PIXELS = 16_000_000

/** The skin's tokens, read live; a fallback only for a token the canvas cannot parse. */
export function posterTheme() {
  const root = document.documentElement
  const css = getComputedStyle(root)
  const probe = document.createElement('canvas').getContext('2d')
  const read = (name, fallback) => {
    const v = css.getPropertyValue(name).trim()
    if (!v) return fallback
    probe.fillStyle = '#010203'
    probe.fillStyle = v
    return probe.fillStyle === '#010203' ? fallback : v
  }
  const dark = root.classList.contains('dark')
  const s = (n) => `--color-slate-${n}`
  const colors = {
    bg: read(s(dark ? 950 : 50), CLASSIC.bg),
    // the ink block the app uses for "the one thing a screen is about";
    // on a dark page it lifts a step so it still reads as a block
    block: read(s(dark ? 800 : 900), CLASSIC.text),
    onBlock: read(s(50), CLASSIC.bg),
    onBlockMuted: read(s(dark ? 400 : 300), CLASSIC.faint),
    text: read(s(dark ? 50 : 900), CLASSIC.text),
    muted: read(s(dark ? 400 : 600), CLASSIC.muted),
    faint: read(s(500), CLASSIC.faint),
    line: read(s(dark ? 800 : 200), CLASSIC.line),
    accent: read('--color-accent-500', CLASSIC.accent),
    courts: [1, 2, 3, 4, 5].map((n) => read(`--color-court-${n}`, CLASSIC.text)),
  }
  const weight = Number(css.getPropertyValue('--display-weight').trim())
  return {
    colors,
    display: css.getPropertyValue('--font-display').trim() || BODY_FONT,
    // a face that only comes in one weight would be smeared by a fake bold
    displayWeight: weight === 400 ? 400 : 600,
    slant: css.getPropertyValue('--num-style').trim() === 'italic' ? 'italic ' : '',
  }
}

/** Device sharpness, capped so a 30-round poster still fits the canvas limit. */
export function posterDpr(width, height, deviceDpr = 1) {
  const want = Math.min(3, Math.max(2, deviceDpr || 1))
  return Math.min(want, Math.sqrt(MAX_PIXELS / (width * height)))
}

/** Everyone in the schedule, on court or sitting out. */
export function playerCount(rounds) {
  const ids = new Set()
  for (const r of rounds) {
    for (const m of r.matches) for (const id of [...m.teamA, ...m.teamB]) if (id) ids.add(id)
    for (const id of r.benched || []) ids.add(id)
  }
  return ids.size
}

/** Team as one line: "สมชาย + หมู"; an empty slot shows as a dash. */
function teamLine(ids, playersById) {
  return ids.map((id) => (id && playersById.get(id)?.name) || '—').join(' + ')
}

/** Trims to fit, so a long line can never bleed into the next column. */
function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (ctx.measureText(text.slice(0, mid) + '…').width <= maxWidth) lo = mid
    else hi = mid - 1
  }
  return text.slice(0, lo) + '…'
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Names and small print in the body face; title, numbers, pills and "vs" wear the skin's. */
const fontsFor = ({ display, displayWeight: dw, slant }) => ({
  title: (size) => `${slant}${dw} ${size}px ${display}`,
  date: `600 30px ${BODY_FONT}`,
  meta: `400 28px ${BODY_FONT}`,
  head: `500 26px ${BODY_FONT}`,
  pill: `${dw} 26px ${display}`,
  num: `${slant}${dw} 72px ${display}`,
  name: `600 34px ${BODY_FONT}`,
  vs: `${slant}${dw} 26px ${display}`,
  bench: `400 26px ${BODY_FONT}`,
  brand: `${slant}${dw} 30px ${display}`,
  url: `400 26px ${BODY_FONT}`,
})

function defaultDate() {
  const locale = document.documentElement.lang === 'en' ? 'en-GB' : 'th-TH'
  return new Date().toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/**
 * `labels.playersUnit/courtsUnit/roundsUnit` turn on the date line and the
 * "8 คน · 2 คอร์ท · 6 รอบ" line; without them the old `subtitle` is shown.
 * @returns {HTMLCanvasElement}
 */
export function drawSchedule({
  rounds,
  courts,
  playersById,
  title,
  subtitle,
  date,
  labels,
  theme = posterTheme(),
}) {
  const C = theme.colors
  const F = fontsFor(theme)

  // ---- columns, in the same order the on-screen table uses ---------------
  const columns = []
  const seen = new Set()
  courts.forEach((c, i) => {
    if (rounds.some((r) => r.matches.some((m) => m.courtId === c.id))) {
      columns.push({ id: c.id, name: c.name, tone: i })
      seen.add(c.id)
    }
  })
  for (const r of rounds) {
    for (const m of r.matches) {
      if (!seen.has(m.courtId)) {
        columns.push({ id: m.courtId, name: m.courtName, tone: columns.length })
        seen.add(m.courtId)
      }
    }
  }

  const cellOf = (round, col) => {
    const m = round.matches.find((x) => x.courtId === col.id)
    // the plan only: who plays whom where. Levels, scores and ticks are for
    // the organiser's screen, not the group chat
    return m && { a: teamLine(m.teamA, playersById), b: teamLine(m.teamB, playersById) }
  }
  const benchOf = (round) =>
    (round.benched || [])
      .map((id) => playersById.get(id)?.name)
      .filter(Boolean)
      .join(', ')

  // ---- measure first so columns fit the real names -----------------------
  const meas = document.createElement('canvas').getContext('2d')
  const widthOf = (text, f) => {
    meas.font = f
    return meas.measureText(text).width
  }
  const pillLabel = (col) => `${labels.court} ${col.name}`

  const numW =
    Math.max(widthOf(String(rounds.length), F.num), widthOf(labels.round, F.head)) + 36
  let colWidths = columns.map((col) => {
    let w = widthOf(pillLabel(col), F.pill) + 40
    for (const round of rounds) {
      const cell = cellOf(round, col)
      if (cell) w = Math.max(w, widthOf(cell.a, F.name), widthOf(cell.b, F.name))
    }
    return Math.min(MAX_COL, Math.max(MIN_COL, Math.ceil(w)))
  })
  const tableW = (ws) => numW + ws.reduce((sum, w) => sum + w, 0) + COL_GAP * (ws.length - 1)
  const width = Math.ceil(Math.max(MIN_W, PAD * 2 + tableW(colWidths)))
  // a narrow table (one court) stretches to the poster rather than leaving a gap
  const spare = width - PAD * 2 - tableW(colWidths)
  if (spare > 0 && columns.length) colWidths = colWidths.map((w) => w + spare / columns.length)
  const contentW = width - PAD * 2

  meas.font = F.bench
  const benchLines = rounds.map((r) => {
    const names = benchOf(r)
    return names ? wrap(meas, `${labels.bench}: ${names}`, contentW - numW, 3) : []
  })
  // rows grow with what they hold, so 30 rounds make a taller poster, never a squashed one
  const rowH = benchLines.map(
    (lines) => ROW_PAD * 2 + CELL_H + (lines.length ? 12 + lines.length * BENCH_LH : 0)
  )

  // ---- header text --------------------------------------------------------
  let titleSize = 88
  while (titleSize > 56 && widthOf(title, F.title(titleSize)) > contentW) titleSize -= 4
  const units = labels.playersUnit && labels.courtsUnit && labels.roundsUnit
  const lineOne = units ? date || defaultDate() : subtitle
  const lineTwo = units
    ? [
        `${playerCount(rounds)} ${labels.playersUnit}`,
        `${columns.length} ${labels.courtsUnit}`,
        `${rounds.length} ${labels.roundsUnit}`,
      ].join('  ·  ')
    : ''

  const blockH =
    64 + Math.round(titleSize * 0.82) + (lineOne ? 74 : 0) + (lineTwo ? 46 : 0) + 64
  const tableTop = blockH + 64
  const headH = 44
  const rowsTop = tableTop + headH + 24
  const footTop = rowsTop + rowH.reduce((sum, h) => sum + h, 0)
  const height = footTop + 40 + 30 + 56

  // ---- canvas ------------------------------------------------------------
  const dpr = posterDpr(width, height, window.devicePixelRatio)
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * dpr)
  canvas.height = Math.ceil(height * dpr)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, width, height)

  // ---- header block: the first frame LINE shows in the chat ----------------
  ctx.fillStyle = C.block
  ctx.fillRect(0, 0, width, blockH)
  let y = 64 + Math.round(titleSize * 0.82)
  ctx.fillStyle = C.onBlock
  ctx.font = F.title(titleSize)
  ctx.fillText(ellipsize(ctx, title, contentW), PAD, y)
  if (lineOne) {
    y += 74
    ctx.font = F.date
    ctx.fillText(ellipsize(ctx, lineOne, contentW), PAD, y)
  }
  if (lineTwo) {
    y += 46
    ctx.fillStyle = C.onBlockMuted
    ctx.font = F.meta
    ctx.fillText(ellipsize(ctx, lineTwo, contentW), PAD, y)
  }
  // the accent: a short bar riding the block's lower edge
  ctx.fillStyle = C.accent
  ctx.fillRect(PAD, blockH - 6, 128, 12)

  // ---- column heads --------------------------------------------------------
  const xs = []
  let x = PAD + numW
  for (const w of colWidths) {
    xs.push(x)
    x += w + COL_GAP
  }
  ctx.fillStyle = C.muted
  ctx.font = F.head
  ctx.fillText(labels.round, PAD, tableTop + 31)
  ctx.font = F.pill
  columns.forEach((col, i) => {
    const label = ellipsize(ctx, pillLabel(col), colWidths[i] - 40)
    ctx.fillStyle = C.courts[col.tone % C.courts.length]
    roundRect(ctx, xs[i], tableTop, ctx.measureText(label).width + 40, headH, headH / 2)
    ctx.fill()
    ctx.fillStyle = '#fff' // the app's court pills are white on the court colour too
    ctx.fillText(label, xs[i] + 20, tableTop + 31)
  })

  // ---- one row per round ---------------------------------------------------
  const rule = (yy, w) => {
    ctx.strokeStyle = C.line
    ctx.lineWidth = w
    ctx.beginPath()
    ctx.moveTo(PAD, yy)
    ctx.lineTo(width - PAD, yy)
    ctx.stroke()
  }
  rule(rowsTop - 1, 2)
  let top = rowsTop
  rounds.forEach((round, ri) => {
    const cellTop = top + ROW_PAD
    const lineA = cellTop + 34
    const lineVs = lineA + VS_LH + 2
    const lineB = lineA + NAME_LH + VS_LH

    ctx.fillStyle = C.text
    ctx.font = F.num
    ctx.fillText(String(ri + 1), PAD, cellTop + CELL_H / 2 + 26)

    columns.forEach((col, i) => {
      const cell = cellOf(round, col)
      const w = colWidths[i]
      if (!cell) {
        ctx.fillStyle = C.faint
        ctx.font = F.name
        ctx.fillText('—', xs[i], lineVs + 4)
        return
      }
      ctx.fillStyle = C.text
      ctx.font = F.name
      ctx.fillText(ellipsize(ctx, cell.a, w), xs[i], lineA)
      ctx.fillText(ellipsize(ctx, cell.b, w), xs[i], lineB)
      ctx.fillStyle = C.muted
      ctx.font = F.vs
      ctx.fillText(labels.vs, xs[i], lineVs)
    })

    ctx.fillStyle = C.muted
    ctx.font = F.bench
    benchLines[ri].forEach((ln, li) =>
      ctx.fillText(ln, PAD + numW, cellTop + CELL_H + 12 + 27 + li * BENCH_LH)
    )

    top += rowH[ri]
    if (ri < rounds.length - 1) rule(top - 0.5, 1)
  })
  rule(footTop + 1, 2)

  // ---- footer --------------------------------------------------------------
  const footBase = footTop + 40 + 30
  ctx.fillStyle = C.text
  ctx.font = F.brand
  ctx.fillText(labels.footer, PAD, footBase)
  ctx.fillStyle = C.muted
  ctx.font = F.url
  ctx.textAlign = 'right'
  ctx.fillText(APP_URL, width - PAD, footBase)
  ctx.textAlign = 'left'

  return canvas
}

function wrap(ctx, text, maxWidth, maxLines) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
      if (lines.length === maxLines) break
    } else {
      line = test
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length === maxLines) {
    const shown = lines.join(' ')
    if (shown.length < text.length) {
      lines[maxLines - 1] = ellipsize(ctx, lines[maxLines - 1] + ' …', maxWidth)
    }
  }
  return lines.slice(0, maxLines).map((ln) => ellipsize(ctx, ln, maxWidth))
}

const toBlob = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  )

const filename = () =>
  `bad-matchup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.png`

/**
 * Renders the schedule to a PNG. Saving and sharing are separate steps on
 * purpose: going straight to the share sheet left phones with no way to keep
 * the picture — Android's sheet only lists apps, and iOS drops "Save Image"
 * when a title rides along with the file.
 * @returns {Promise<{ blob: Blob, name: string }>}
 */
export async function renderSchedulePng(options) {
  const theme = options.theme || posterTheme()
  const F = fontsFor(theme)
  // a webfont face loads per weight and style on first use; drawing before it
  // arrives would bake a fallback face into the picture
  if (document.fonts?.load) {
    await Promise.all(
      [F.title(88), F.num, F.pill, F.name, F.date, F.bench].map((f) =>
        document.fonts.load(f, 'กขค 0123456789 Aa').catch(() => {})
      )
    )
  }
  if (document.fonts?.ready) await document.fonts.ready
  const blob = await toBlob(drawSchedule({ ...options, theme }))
  return { blob, name: filename() }
}

/** A plain download — lands in Downloads / the Files app. */
export function downloadPng({ blob, name }) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const asFile = ({ blob, name }) => new File([blob], name, { type: 'image/png' })

export const canSharePng = (png) => !!navigator.canShare?.({ files: [asFile(png)] })

/**
 * Native share sheet with the file and nothing else, so iOS keeps
 * "Save Image" in the list.
 * @returns {Promise<boolean>} false when the user dismissed the sheet
 */
export async function sharePng(png) {
  try {
    await navigator.share({ files: [asFile(png)] })
    return true
  } catch (err) {
    if (err?.name === 'AbortError') return false
    throw err
  }
}
