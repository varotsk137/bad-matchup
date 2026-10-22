import { useMemo } from 'react'
import { QUIET, qrModules, qrPath } from '../lib/qr'
import { cx } from './ui'

/** A QR code drawn as SVG — black on white in both themes, so every camera reads it. */
export default function QrCode({ text, label, className = '' }) {
  const { size, d } = useMemo(() => {
    const modules = qrModules(text)
    return { size: modules.length + QUIET * 2, d: qrPath(modules) }
  }, [text])
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
      className={cx('rounded-lg bg-white', className)}
    >
      <path d={d} fill="#000" />
    </svg>
  )
}
