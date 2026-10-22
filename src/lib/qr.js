import { encode } from 'uqr'

/**
 * QR modules as rows of booleans (true = dark), with no quiet zone — callers
 * draw their own white margin. Medium error correction survives a phone
 * camera pointed at another phone's screen.
 */
export const qrModules = (text) => encode(text, { ecc: 'M', border: 0 }).data

/** Quiet zone the QR spec asks for, in modules. */
export const QUIET = 4

/** Every dark module as one SVG path, so the browser draws a single shape. */
export function qrPath(modules) {
  let d = ''
  modules.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) d += `M${x + QUIET} ${y + QUIET}h1v1h-1z`
    })
  })
  return d
}

/** Draws the QR onto a canvas, white margin included, at (x, y) and `size` wide. */
export function drawQr(ctx, modules, x, y, size) {
  const n = modules.length + QUIET * 2
  const cell = size / n
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x, y, size, size)
  ctx.fillStyle = '#000000'
  modules.forEach((row, my) => {
    row.forEach((dark, mx) => {
      // a hair of overlap so no seams show between neighbouring squares
      if (dark)
        ctx.fillRect(x + (mx + QUIET) * cell, y + (my + QUIET) * cell, cell + 0.4, cell + 0.4)
    })
  })
}
