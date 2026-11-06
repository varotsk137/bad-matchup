import { roundsForTime } from '../lib/matchmaker'
import Icon from './Icon'

const HOURS = [1, 1.5, 2, 2.5, 3, 4]
const MINUTES = [10, 12, 15, 20]

/**
 * Before a session: how many rounds make sense. Two angles — enough for
 * everyone to partner everyone, and what fits the court booking — each with a
 * one-tap "use". Lives inside the Play screen's ink setup card, so it is drawn
 * light-on-ink; `s` is suggestRounds(state), worked out once by the caller.
 */
export default function RoundAdvisor({ s, state, t, actions, onUse }) {
  if (!s) return null
  const o = state.options
  const hours = o.bookingHours ?? 2
  const minutes = o.minutesPerGame ?? 15
  const byTime = roundsForTime(hours, minutes)
  const pool = state.players.filter((p) => p.active !== false && !p.resting).length
  const gamesByTime = Math.round((byTime * s.seats) / Math.max(1, pool))

  return (
    <div className="divide-y divide-slate-50/10 border-y border-slate-50/10">
      {s.coverAll && (
        <Row
          icon="users"
          text={t('adviseCover', { n: s.coverAll, g: s.gamesEach })}
          n={Math.min(100, s.coverAll)}
          onUse={onUse}
          t={t}
        />
      )}
      <Row
        icon="clock"
        text={
          t('adviseTime', { n: byTime, g: gamesByTime }) +
          (s.coverAll && byTime < s.coverAll ? ` · ${t('adviseTimeShort')}` : '')
        }
        n={Math.min(100, byTime)}
        onUse={onUse}
        t={t}
      >
        <span className="mt-2 flex flex-wrap items-center gap-2">
          <Pick
            label={t('v4BookingHours')}
            values={HOURS}
            value={hours}
            format={(h) => t('hoursN', { n: h })}
            onChange={(v) => actions.setOption('bookingHours', v)}
          />
          <Pick
            label={t('v4MinutesPerGame')}
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

function Row({ icon, text, n, onUse, t, children }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon name={icon} className="mt-0.5 h-5 w-5 text-slate-300" />
      <div className="min-w-0 flex-1 text-sm leading-snug text-slate-200">
        {text}
        {children}
      </div>
      <button
        type="button"
        onClick={() => onUse(n)}
        className="press h-11 shrink-0 rounded-[var(--radius-pill)] border border-slate-50/30 px-3.5 text-sm font-semibold text-slate-50 hover:bg-slate-50/10 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
      >
        {t('v4UseN', { n })}
      </button>
    </div>
  )
}

/** A native select, labelled, tall enough to hit. */
function Pick({ label, values, value, format, onChange }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-11 rounded-xl border border-slate-50/25 bg-slate-800 px-3 text-sm font-medium text-slate-50 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none dark:bg-slate-700"
    >
      {values.map((v) => (
        <option key={v} value={v}>
          {format(v)}
        </option>
      ))}
    </select>
  )
}
