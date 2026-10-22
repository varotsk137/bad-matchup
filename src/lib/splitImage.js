/**
 * Renders the bill to a PNG for the group chat: what was spent, what each
 * person owes, who has paid (in the per-person view) and how to pay.
 *
 * Drawn onto a canvas with fillText for the same reasons as the schedule
 * image (see exportImage.js): no library, and the page's Thai font is used
 * as-is. Kept in its own file so the two renderers can change independently.
 */
import { drawQr, qrModules } from './qr'

const FONT = '"Noto Sans Thai", "Inter", system-ui, sans-serif'
const font = (size, weight = 400) => `${weight} ${size}px ${FONT}`

/** Same palettes as the schedule image, so both pictures look like the app. */
const PALETTES = {
  light: {
    bg: '#fbfaf6',
    panel: '#f3f2ec',
    line: '#e3e1d8',
    hairline: '#edebe3',
    text: '#1c2b24',
    muted: '#6b7671',
    brand: '#2f7d55',
    owe: '#be2b4c',
  },
  dark: {
    bg: '#0e1622',
    panel: '#152a26',
    line: '#2b3d39',
    hairline: '#1d2e2b',
    text: '#e8efec',
    muted: '#93a7a2',
    brand: '#55c98d',
    owe: '#f593aa',
  },
}

const isDarkNow = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

const W = 560
const PAD = 36
const ROW = 28
const PERSON = 32
const QR = 184

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

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

const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/**
 * @param {{
 *   title: string, subtitle: string,
 *   rows: { label: string, value: string }[], total: { label: string, value: string },
 *   headline: string, working: string,
 *   people?: { name: string, paid: boolean }[], amount: string, paidLabel: string,
 *   pay?: { qr?: string, image?: HTMLImageElement, lines: string[] },
 *   footer: string, dark?: boolean,
 * }} bill
 * @returns {HTMLCanvasElement}
 */
export function drawBill(bill) {
  const C = (bill.dark ?? isDarkNow()) ? PALETTES.dark : PALETTES.light
  const people = bill.people || []
  const height =
    PAD * 2 +
    64 + // title + date
    ROW * (bill.rows.length + 1) +
    16 +
    104 + // the amount panel
    (people.length ? 16 + PERSON * people.length : 0) +
    (bill.pay ? 24 + QR : 0) +
    36 // footer

  const dpr = Math.min(3, Math.max(2, window.devicePixelRatio || 1))
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(W * dpr)
  canvas.height = Math.ceil(height * dpr)
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, height)
  const right = W - PAD
  const inner = W - PAD * 2

  // ---- title -------------------------------------------------------------
  let y = PAD + 26
  ctx.fillStyle = C.text
  ctx.font = font(24, 700)
  ctx.fillText(ellipsize(ctx, `💰 ${bill.title}`, inner), PAD, y)
  y += 24
  ctx.fillStyle = C.muted
  ctx.font = font(14)
  ctx.fillText(bill.subtitle, PAD, y)
  y += 14

  // ---- what was spent ----------------------------------------------------
  const line = (label, value, bold) => {
    y += ROW
    ctx.font = font(15, bold ? 700 : 400)
    ctx.fillStyle = bold ? C.text : C.muted
    ctx.textAlign = 'right'
    ctx.fillText(value, right, y - 9)
    const vw = ctx.measureText(value).width
    ctx.textAlign = 'left'
    ctx.fillText(ellipsize(ctx, label, inner - vw - 16), PAD, y - 9)
  }
  bill.rows.forEach((r) => line(r.label, r.value))
  ctx.strokeStyle = C.line
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(PAD, y + 0.75)
  ctx.lineTo(right, y + 0.75)
  ctx.stroke()
  line(bill.total.label, bill.total.value, true)
  y += 16

  // ---- what each person owes --------------------------------------------
  ctx.fillStyle = C.panel
  roundRect(ctx, PAD, y, inner, 88, 16)
  ctx.fill()
  ctx.textAlign = 'center'
  ctx.fillStyle = C.text
  ctx.font = font(30, 700)
  ctx.fillText(bill.headline, W / 2, y + 46)
  ctx.fillStyle = C.muted
  ctx.font = font(13)
  ctx.fillText(ellipsize(ctx, bill.working, inner - 24), W / 2, y + 72)
  ctx.textAlign = 'left'
  y += 104

  // ---- who has paid ------------------------------------------------------
  if (people.length) {
    y += 16
    people.forEach((p, i) => {
      const top = y + i * PERSON
      ctx.font = font(15, p.paid ? 600 : 700)
      ctx.fillStyle = p.paid ? C.brand : C.owe
      ctx.textAlign = 'right'
      const mark = p.paid ? `✓ ${bill.paidLabel}` : bill.amount
      ctx.fillText(mark, right, top + 21)
      const mw = ctx.measureText(mark).width
      ctx.textAlign = 'left'
      ctx.fillStyle = C.text
      ctx.font = font(15, 500)
      ctx.fillText(ellipsize(ctx, p.name, inner - mw - 16), PAD, top + 21)
      if (i < people.length - 1) {
        ctx.strokeStyle = C.hairline
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(PAD, top + PERSON - 0.5)
        ctx.lineTo(right, top + PERSON - 0.5)
        ctx.stroke()
      }
    })
    y += PERSON * people.length
  }

  // ---- how to pay --------------------------------------------------------
  if (bill.pay) {
    y += 24
    if (bill.pay.qr) {
      drawQr(ctx, qrModules(bill.pay.qr), PAD, y, QR)
    } else if (bill.pay.image) {
      const img = bill.pay.image
      ctx.fillStyle = '#ffffff'
      roundRect(ctx, PAD, y, QR, QR, 10)
      ctx.fill()
      const s = Math.min(QR / img.width, QR / img.height)
      const w = img.width * s
      const h = img.height * s
      ctx.drawImage(img, PAD + (QR - w) / 2, y + (QR - h) / 2, w, h)
    }
    const tx = PAD + QR + 20
    const tw = right - tx
    const lines = bill.pay.lines.filter(Boolean)
    const startY = y + QR / 2 - ((lines.length - 1) * 24) / 2 + 5
    lines.forEach((ln, i) => {
      ctx.fillStyle = i === 0 ? C.text : C.muted
      ctx.font = font(i === 0 ? 16 : 14, i === 0 ? 700 : 400)
      ctx.fillText(ellipsize(ctx, ln, tw), tx, startY + i * 24)
    })
    y += QR
  }

  // ---- footer ------------------------------------------------------------
  ctx.fillStyle = C.muted
  ctx.font = font(11)
  ctx.fillText(bill.footer, PAD, height - PAD + 10)

  return canvas
}

const toBlob = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png')
  )

/**
 * @param {Parameters<typeof drawBill>[0] & { pay?: { imageSrc?: string } }} bill
 * @returns {Promise<{ blob: Blob, name: string }>} ready for ImageSheet
 */
export async function renderBillPng(bill) {
  if (document.fonts?.ready) await document.fonts.ready
  const pay = bill.pay?.imageSrc
    ? { ...bill.pay, image: await loadImage(bill.pay.imageSrc) }
    : bill.pay
  const blob = await toBlob(drawBill({ ...bill, pay }))
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  return { blob, name: `bad-matchup-bill-${stamp}.png` }
}
