import { LEVEL_META } from '../lib/matchmaker'
import { cx } from './ui'

export const levelMeta = (v) => LEVEL_META.find((l) => l.value === v) || LEVEL_META[0]

export function levelLabel(v, lang) {
  const m = levelMeta(v)
  return `${m.code} · ${lang === 'en' ? m.en : m.th}`
}

/**
 * One ramp, light to dark, so a higher rung simply reads as "stronger" — in
 * the skin's own slate and brand, never a hue of its own. Shared by the level
 * badge and the avatar on Players.
 */
const LEVEL_TONE = [
  'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100', // NB
  'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100', // BG
  'bg-brand-300 text-brand-950 dark:bg-brand-700 dark:text-white', // N
  'bg-brand-600 text-white dark:bg-brand-500 dark:text-brand-950', // S
  'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900', // P
]
export const levelTone = (level) => LEVEL_TONE[levelMeta(level).value - 1]

export function LevelBadge({ level, className = '' }) {
  const m = levelMeta(level)
  return (
    <span
      className={cx(
        'inline-flex h-5 shrink-0 items-center rounded px-1.5 text-xs font-bold',
        LEVEL_TONE[m.value - 1],
        className
      )}
      title={m.th}
    >
      {m.code}
    </span>
  )
}

/** The level as five pips and its code: quiet, but the rung reads at a glance. */
export function LevelPips({ level, className = '' }) {
  const m = levelMeta(level)
  return (
    <span className={cx('inline-flex items-center gap-1.5', className)} title={m.th}>
      <span className="flex gap-0.5" aria-hidden>
        {LEVEL_META.map((l) => (
          <span
            key={l.value}
            className={cx(
              'h-1.5 w-1.5 rounded-full',
              l.value <= m.value
                ? 'bg-brand-600 dark:bg-brand-300'
                : 'bg-slate-300 dark:bg-slate-700'
            )}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.code}</span>
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

