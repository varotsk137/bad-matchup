/**
 * Renders the schedule to a PNG.
 *
 * Drawn straight onto a canvas with fillText rather than going through
 * html2canvas or an SVG round-trip: those either pull in ~200 KB of library or
 * drop the Thai webfont when the SVG is rasterised. The canvas 2D context uses
 * the fonts already loaded by the page, so Thai names come out correct.
 *
 * The palette follows whichever theme the app is in, so the PNG looks like
 * what was on screen when the button was pressed.
 */

import { LEVEL_META } from './matchmaker'

const FONT = '"Noto Sans Thai", "Inter", system-ui, sans-serif'

/** Mirrors the app's own palettes (see index.css) so the PNG matches the screen. */
const PALETTES = {
  light: {
    bg: '#fbfaf6', // ivory paper
    stripe: '#f3f2ec',
    line: '#e3e1d8',
    hairline: '#edebe3',
    text: '#1c2b24',
    muted: '#6b7671',
    faint: '#9aa39e',
    teamA: '#0b6f9e',
    teamB: '#be2b4c',
    brand: '#2f7d55',
    accent: '#d9762b',
    onAccent: '#ffffff',
  },
  dark: {
    bg: '#0e1622', // deep navy page
    stripe: '#152a26', // deep green, the same layering the app uses
    line: '#2b3d39',
    hairline: '#1d2e2b',
    text: '#e8efec',
    muted: '#93a7a2',
    faint: '#637874',
    teamA: '#6cc4ee',
    teamB: '#f593aa',
    brand: '#55c98d',
    accent: '#e8913f',
    onAccent: '#1a1206',
  },
}

const isDarkNow = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

/* --- generous by design: the previous pass was cramped and read as squashed */
const PAD = 40
const COL_GAP = 34
const MIN_COL = 200
const MAX_COL = 460
const RND_W = 56
const CHIP = 34
const ROW_PAD_Y = 17
const TEAM_LH = 25
const MID_LH = 22
const TITLE_BLOCK = 78
const HEADER_H = 42
const FOOTER_H = 34

const ROW_H = ROW_PAD_Y * 2 + TEAM_LH * 2 + MID_LH

const font = (size, weight = 400) => `${weight} ${size}px ${FONT}`

const F = {
  title: font(26, 700),
  subtitle: font(14, 400),
  header: font(12, 700),
  team: font(17, 600),
  mid: font(12, 700),
  score: font(13, 700),
  bench: font(13, 400),
  chip: font(15, 700),
  footer: font(11, 400),
}

const levelCode = (v) => (LEVEL_META.find((l) => l.value === v) || LEVEL_META[0]).code

/** Team as one line: "สมชาย + หมู" (levels optional). */
function teamLine(ids, playersById, showLevels) {
  return ids
    .map((id) => {
      const p = id ? playersById.get(id) : null
      if (!p) return '—'
      return showLevels ? `${p.name} ${levelCode(p.level)}` : p.name
    })
    .join('  +  ')
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

/** @returns {HTMLCanvasElement} */
export function drawSchedule({
  rounds,
  courts,
  playersById,
  title,
  subtitle,
  labels,
  showLevels = false,
  dark = isDarkNow(),
}) {
  const C = dark ? PALETTES.dark : PALETTES.light

  // ---- columns, in the same order the on-screen table uses ---------------
  const columns = []
  const seen = new Set()
  for (const c of courts) {
    if (rounds.some((r) => r.matches.some((m) => m.courtId === c.id))) {
      columns.push({ id: c.id, name: c.name })
      seen.add(c.id)
    }
  }
  for (const r of rounds) {
    for (const m of r.matches) {
      if (!seen.has(m.courtId)) {
        columns.push({ id: m.courtId, name: m.courtName })
        seen.add(m.courtId)
      }
    }
  }

  const benchOf = (round) =>
    round.benched
      .map((id) => playersById.get(id)?.name)
      .filter(Boolean)
      .join(', ')

  const hasBench = rounds.some((r) => benchOf(r))

  const cellOf = (round, col) => {
    const m = round.matches.find((x) => x.courtId === col.id)
    if (!m) return null
    const scored = typeof m.scoreA === 'number' && typeof m.scoreB === 'number'
    return {
      a: teamLine(m.teamA, playersById, showLevels),
      b: teamLine(m.teamB, playersById, showLevels),
      score: scored ? `${m.scoreA} – ${m.scoreB}` : '',
      done: !!m.done,
    }
  }

  // ---- measure first so columns fit the real names -----------------------
  const meas = document.createElement('canvas').getContext('2d')
  const widthOf = (text, f) => {
    meas.font = f
    return meas.measureText(text).width
  }

  const colWidths = columns.map((col) => {
    let w = widthOf(`${labels.court} ${col.name}`, F.header)
    for (const round of rounds) {
      const cell = cellOf(round, col)
      if (!cell) continue
      w = Math.max(w, widthOf(cell.a, F.team), widthOf(cell.b, F.team))
      if (cell.score) w = Math.max(w, widthOf(`${labels.vs}   ${cell.score}  ✓`, F.score))
    }
    return Math.round(Math.min(MAX_COL, Math.max(MIN_COL, w + 8)))
  })

  let benchW = 0
  if (hasBench) {
    benchW = widthOf(labels.bench, F.header)
    for (const r of rounds) benchW = Math.max(benchW, widthOf(benchOf(r), F.bench))
    benchW = Math.round(Math.min(300, Math.max(130, benchW + 8)))
  }

  const width =
    PAD * 2 +
    RND_W +
    colWidths.reduce((s, w) => s + w + COL_GAP, 0) +
    (hasBench ? benchW : -COL_GAP)
  const height = PAD * 2 + TITLE_BLOCK + HEADER_H + ROW_H * rounds.length + FOOTER_H

  // ---- canvas ------------------------------------------------------------
  const dpr = Math.min(3, Math.max(2, window.devicePixelRatio || 1))
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(width * dpr)
  canvas.height = Math.ceil(height * dpr)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.textBaseline = 'alphabetic'

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, width, height)

  // ---- title -------------------------------------------------------------
  let y = PAD + 28
  ctx.fillStyle = C.text
  ctx.font = F.title
  ctx.fillText(`🏸 ${title}`, PAD, y)
  y += 24
  ctx.fillStyle = C.muted
  ctx.font = F.subtitle
  ctx.fillText(subtitle, PAD, y)
  y += TITLE_BLOCK - 52

  // ---- column origins ----------------------------------------------------
  const xs = []
  let x = PAD + RND_W
  for (const w of colWidths) {
    xs.push(x)
    x += w + COL_GAP
  }
  const benchX = x
  const contentRight = width - PAD

  // ---- header ------------------------------------------------------------
  ctx.fillStyle = C.muted
  ctx.font = F.header
  ctx.fillText(labels.round, PAD, y + 24)
  columns.forEach((col, i) => ctx.fillText(`${labels.court} ${col.name}`, xs[i], y + 24))
  if (hasBench) ctx.fillText(labels.bench, benchX, y + 24)

  y += HEADER_H
  ctx.strokeStyle = C.line
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(PAD, y - 0.75)
  ctx.lineTo(contentRight, y - 0.75)
  ctx.stroke()

  const tableTop = y
  const tableBottom = y + ROW_H * rounds.length

  // ---- rows --------------------------------------------------------------
  rounds.forEach((round, ri) => {
    const top = y + ri * ROW_H

    if (ri % 2 === 1) {
      ctx.fillStyle = C.stripe
      ctx.fillRect(PAD - 10, top, contentRight - PAD + 20, ROW_H)
    }

    // round number chip
    ctx.fillStyle = C.accent
    roundRect(ctx, PAD, top + (ROW_H - CHIP) / 2, CHIP, CHIP, 10)
    ctx.fill()
    ctx.fillStyle = C.onAccent
    ctx.font = F.chip
    ctx.textAlign = 'center'
    ctx.fillText(String(ri + 1), PAD + CHIP / 2, top + ROW_H / 2 + 6)
    ctx.textAlign = 'left'

    const lineA = top + ROW_PAD_Y + 18
    const lineMid = lineA + MID_LH
    const lineB = lineMid + TEAM_LH

    columns.forEach((col, i) => {
      const cell = cellOf(round, col)
      const w = colWidths[i]
      if (!cell) {
        ctx.fillStyle = C.faint
        ctx.font = F.team
        ctx.fillText('—', xs[i], lineMid)
        return
      }

      ctx.font = F.team
      ctx.fillStyle = C.teamA
      ctx.fillText(ellipsize(ctx, cell.a, w), xs[i], lineA)

      ctx.font = F.mid
      ctx.fillStyle = C.faint
      ctx.fillText(labels.vs, xs[i], lineMid)
      let cursor = xs[i] + ctx.measureText(labels.vs).width + 12
      if (cell.score) {
        ctx.font = F.score
        ctx.fillStyle = C.text
        ctx.fillText(cell.score, cursor, lineMid)
        cursor += ctx.measureText(cell.score).width + 10
      }
      if (cell.done) {
        ctx.font = F.score
        ctx.fillStyle = C.brand
        ctx.fillText('✓', cursor, lineMid)
      }

      ctx.font = F.team
      ctx.fillStyle = C.teamB
      ctx.fillText(ellipsize(ctx, cell.b, w), xs[i], lineB)
    })

    if (hasBench) {
      ctx.fillStyle = C.muted
      ctx.font = F.bench
      const lines = wrap(ctx, benchOf(round) || '—', benchW, 3)
      const startY = top + ROW_H / 2 - ((lines.length - 1) * 18) / 2 + 5
      lines.forEach((ln, li) => ctx.fillText(ln, benchX, startY + li * 18))
    }

    if (ri < rounds.length - 1) {
      ctx.strokeStyle = C.hairline
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(PAD, top + ROW_H - 0.5)
      ctx.lineTo(contentRight, top + ROW_H - 0.5)
      ctx.stroke()
    }
  })

  // faint rules between the courts, so wide tables stay easy to scan across
  ctx.strokeStyle = C.hairline
  ctx.lineWidth = 1
  columns.forEach((_, i) => {
    if (i === 0) return
    const gx = xs[i] - COL_GAP / 2
    ctx.beginPath()
    ctx.moveTo(gx, tableTop)
    ctx.lineTo(gx, tableBottom)
    ctx.stroke()
  })
  if (hasBench) {
    const gx = benchX - COL_GAP / 2
    ctx.beginPath()
    ctx.moveTo(gx, tableTop)
    ctx.lineTo(gx, tableBottom)
    ctx.stroke()
  }

  ctx.strokeStyle = C.line
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(PAD, tableBottom + 0.75)
  ctx.lineTo(contentRight, tableBottom + 0.75)
  ctx.stroke()

  // ---- footer ------------------------------------------------------------
  ctx.fillStyle = C.faint
  ctx.font = F.footer
  ctx.fillText(labels.footer, PAD, height - PAD + 10)

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
  return lines.slice(0, maxLines)
}

const toBlob = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  )

const filename = () =>
  `bad-matchup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.png`

/**
 * Saves the schedule image. On phones that support it, offers the native
 * share sheet first (so it can go straight into the group chat) and falls
 * back to a plain download.
 * @returns {Promise<'shared'|'downloaded'>}
 */
export async function exportSchedulePng(options) {
  if (document.fonts?.ready) await document.fonts.ready
  const canvas = drawSchedule(options)
  const blob = await toBlob(canvas)
  const name = filename()

  const file = new File([blob], name, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: options.title })
      return 'shared'
    } catch (err) {
      // user dismissed the sheet — nothing more to do
      if (err?.name === 'AbortError') return 'shared'
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
