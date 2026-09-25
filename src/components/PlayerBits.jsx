import { LEVEL_META } from '../lib/matchmaker'
import { cx } from './ui'

export const levelMeta = (v) => LEVEL_META.find((l) => l.value === v) || LEVEL_META[0]

export function levelLabel(v, lang) {
  const m = levelMeta(v)
  return `${m.emoji} ${m.code} · ${lang === 'en' ? m.en : m.th}`
}

/**
 * A distinct hue per rung so the ladder is readable at a glance, running cool
 * (NB) to warm (P). Green is skipped on purpose — it belongs to the brand and
 * would read as "selected" rather than "this is their level".
 */
const LEVEL_TONE = [
  'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200', // NB
  'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300', // BG
  'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300', // N
  'bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-300', // S
  'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300', // P
]

export function LevelBadge({ level, withEmoji = true, className = '' }) {
  const m = levelMeta(level)
  return (
    <span
      className={cx(
        'inline-flex h-5 shrink-0 items-center gap-0.5 rounded px-1 text-[10px] font-bold',
        LEVEL_TONE[m.value - 1],
        className
      )}
      title={m.th}
    >
      {withEmoji && <span aria-hidden>{m.emoji}</span>}
      {m.code}
    </span>
  )
}

export function GenderDot({ gender, className = '' }) {
  if (gender !== 'M' && gender !== 'F') return null
  return (
    <span
      className={cx(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        gender === 'M' ? 'bg-sky-500' : 'bg-pink-500',
        className
      )}
      aria-hidden
    />
  )
}

export function initials(name = '') {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  // Thai names rarely split usefully on spaces, so take the leading glyphs
  const parts = trimmed.split(/\s+/)
  if (parts.length > 1 && /^[A-Za-z]/.test(trimmed)) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return trimmed.slice(0, 2)
}

export function Avatar({ name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-11 w-11 text-sm',
  }
  // stable pastel per name
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360
  return (
    <span
      className={cx(
        'inline-grid shrink-0 place-items-center rounded-full font-bold text-white select-none',
        sizes[size],
        className
      )}
      style={{ background: `oklch(0.62 0.13 ${hash})` }}
      aria-hidden
    >
      {initials(name)}
    </span>
  )
}

/** Name + level badge, used everywhere a player shows up in a list. */
export function PlayerLine({ player, right, className = '' }) {
  return (
    <div className={cx('flex min-w-0 items-center gap-2.5', className)}>
      <Avatar name={player.name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <GenderDot gender={player.gender} />
          <span className="truncate font-medium">{player.name}</span>
        </div>
        {right}
      </div>
      <LevelBadge level={player.level} />
    </div>
  )
}
