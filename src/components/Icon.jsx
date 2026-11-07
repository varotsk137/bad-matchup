// ui.jsx uses these icons, so this file keeps its own class joiner
const cx = (...parts) => parts.filter(Boolean).join(' ')

/**
 * The app's line icons, one set for every screen instead of emoji (which
 * change look from phone to phone and ignore the skin). They draw in the text
 * colour, and the stroke weight comes from the skin's --icon-stroke.
 */
const PATHS = {
  shuttle: (
    <>
      <path d="M5.5 3.5h9L11.9 12H8.1L5.5 3.5Z" />
      <path d="M8.6 3.5 9.3 12M11.4 3.5 10.7 12" />
      <path d="M8 12h4v1.8a2 2 0 0 1-4 0V12Z" />
    </>
  ),
  sun: (
    <>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v1.8M10 16.2V18M2 10h1.8M16.2 10H18M4.3 4.3l1.3 1.3M14.4 14.4l1.3 1.3M4.3 15.7l1.3-1.3M14.4 5.6l1.3-1.3" />
    </>
  ),
  moon: <path d="M16.5 12.4A6.8 6.8 0 0 1 7.6 3.5a6.8 6.8 0 1 0 8.9 8.9Z" />,
  wallet: (
    <>
      <path d="M3.5 6.5h13a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-9Z" />
      <path d="M3.5 6.5 13 3.5l1 3M13.5 12h1.5" />
    </>
  ),
  book: (
    <>
      <path d="M4.5 4.5A1.5 1.5 0 0 1 6 3h9.5v11.5H6a1.5 1.5 0 0 0-1.5 1.5V4.5Z" />
      <path d="M4.5 16A1.5 1.5 0 0 0 6 17.5h9.5M8 6.5h4.5" />
    </>
  ),
  users: (
    <>
      <circle cx="7.5" cy="7" r="2.5" />
      <path d="M2.5 16.5a5 5 0 0 1 10 0" />
      <circle cx="14" cy="8" r="2" />
      <path d="M13.2 12.3a4 4 0 0 1 4.3 4.2" />
    </>
  ),
  court: (
    <>
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M3 10h14M10 3v14" />
    </>
  ),
  chart: <path d="M4 16.5V10M10 16.5V4M16 16.5v-6" />,
  clock: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 1.5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" />
      <circle cx="10" cy="10" r="2.3" />
    </>
  ),
  pencil: <path d="M13.5 3.5 16.5 6.5 7 16H4v-3l9.5-9.5Z" />,
  trash: <path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L15 6" />,
  close: <path d="M5 5l10 10M15 5 5 15" />,
  copy: (
    <>
      <rect x="7" y="7" width="9.5" height="9.5" rx="1.5" />
      <path d="M13 7V4.5A1.5 1.5 0 0 0 11.5 3h-7A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13H7" />
    </>
  ),
  refresh: <path d="M16.5 10a6.5 6.5 0 1 1-1.9-4.6M16.5 3v3.5H13" />,
  phone: (
    <>
      <rect x="6" y="2.5" width="8" height="15" rx="2" />
      <path d="M9 14.5h2" />
    </>
  ),
  link: (
    <path d="M8.5 11.5l3-3M7 9.2 5.5 10.7a2.5 2.5 0 0 0 3.5 3.6l1.5-1.5M13 10.8l1.5-1.5a2.5 2.5 0 0 0-3.5-3.6L9.5 7.2" />
  ),
}

export default function Icon({ name, className = 'h-4 w-4' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cx('icon shrink-0', className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {PATHS[name]}
    </svg>
  )
}

/** A live room's red dot, which does not need to be an emoji either. */
export function LiveDot({ className = '' }) {
  return (
    <span
      className={cx('inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500', className)}
      aria-hidden
    />
  )
}
