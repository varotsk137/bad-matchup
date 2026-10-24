import { roundsForTime, suggestRounds } from '../lib/matchmaker'
import Icon from './Icon'
import { cx } from './ui'

const HOURS = [1, 1.5, 2, 2.5, 3, 4]
const MINUTES = [10, 12, 15, 20]

/**
 * Before a session: how many rounds make sense. Two angles — enough for
 * everyone to partner everyone, and what fits the court booking — each with a
 * one-tap "use".
 */
export default function RoundAdvisor({ state, t, actions, onUse }) {
  const s = suggestRounds(state)
  if (!s) return null
  const o = state.options
  const hours = o.bookingHours ?? 2
  const minutes = o.minutesPerGame ?? 15
  const byTime = roundsForTime(hours, minutes)
  const pool = state.players.filter((p) => p.active !== false && !p.resting).length
  const gamesByTime = Math.round((byTime * s.seats) / Math.max(1, pool))

  return (
    <div className="space-y-2 rounded-xl bg-slate-100 p-2.5 text-xs dark:bg-slate-950/60">
      {s.coverAll && (
        <Row
          icon="users"
          text={t('adviseCover', { n: s.coverAll, g: s.gamesEach })}
          onUse={() => onUse(Math.min(100, s.coverAll))}
          t={t}
        />
      )}
      <Row
        icon="clock"
        text={
          t('adviseTime', { n: byTime, g: gamesByTime }) +
          (s.coverAll && byTime < s.coverAll ? ` · ${t('adviseTimeShort')}` : '')
        }
        onUse={() => onUse(Math.min(100, byTime))}
        t={t}
      >
        <span className="mt-1 flex flex-wrap items-center gap-1">
          <Pick
            values={HOURS}
            value={hours}
            format={(h) => t('hoursN', { n: h })}
            onChange={(v) => actions.setOption('bookingHours', v)}
          />
          <span className="text-slate-400">·</span>
          <Pick
            values={MINUTES}
            value={minutes}
            format={(m) => t('minutesPerGameN', { n: m })}
            onChange={(v) => actions.setOption('minutesPerGame', v)}
          />
        </span>
      </Row>
    </div>
  )
}

function Row({ icon, text, onUse, t, children }) {
  return (
    <div className="flex items-start gap-2">
      <Icon name={icon} className="mt-0.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
      <span className="min-w-0 flex-1 text-slate-600 dark:text-slate-300">
        {text}
        {children}
      </span>
      <button
        onClick={onUse}
        className="shrink-0 rounded-lg bg-brand-600 px-2.5 py-1 font-semibold text-white active:scale-95"
      >
        {t('adviseUse')}
      </button>
    </div>
  )
}

/** A compact native select styled as a chip — fine-grained enough, tiny on screen. */
function Pick({ values, value, format, onChange }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cx(
        'rounded-md border border-slate-300 bg-slate-50 px-1.5 py-0.5 text-xs font-medium',
        'dark:border-slate-700 dark:bg-slate-900'
      )}
    >
      {values.map((v) => (
        <option key={v} value={v}>
          {format(v)}
        </option>
      ))}
    </select>
  )
}
