import { Fragment, useMemo } from 'react'
import { levelMeta } from './PlayerBits'
import { Card, courtTone, cx } from './ui'

/**
 * The whole session on one grid: a row per round (1 → n), a column per court.
 * Deliberately dense — this is the "what's the plan" view, the card list is
 * the "what's happening right now" view.
 */
export default function ScheduleTable({
  rounds,
  courts,
  playersById,
  t,
  setToast,
  staminaLimit = 2,
  // checking aids, switched from the view row above; they stay out of the image
  showLevels = false,
  showStamina = false,
  onToggleDone, // absent in the read-only shared view
}) {

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

  // per round, per player: how many rounds in a row they have played (or sat
  // out) up to and including that round — the same counter the stamina rule uses
  const stamina = useMemo(() => {
    const play = new Map()
    const rest = new Map()
    return rounds.map((round) => {
      const on = new Set(round.matches.flatMap((m) => [...m.teamA, ...m.teamB]).filter(Boolean))
      const ids = new Set([...on, ...round.benched, ...play.keys(), ...rest.keys()])
      const row = new Map()
      for (const id of ids) {
        if (on.has(id)) {
          play.set(id, (play.get(id) || 0) + 1)
          rest.set(id, 0)
        } else {
          rest.set(id, (rest.get(id) || 0) + 1)
          play.set(id, 0)
        }
        row.set(id, { play: play.get(id), rest: rest.get(id) })
      }
      return row
    })
  }, [rounds])

  const benchNames = (round) =>
    round.benched
      .map((id) => playersById.get(id)?.name)
      .filter(Boolean)
      .join(', ')

  const benchList = (round, ri) =>
    !round.benched.length
      ? '—'
      : showStamina
        ? round.benched.map((id, j) => {
            const p = playersById.get(id)
            if (!p) return null
            return (
              <Fragment key={id}>
                {j > 0 && ', '}
                <span className="whitespace-nowrap">
                  {p.name}
                  <RestBadge n={stamina[ri].get(id)?.rest ?? 1} />
                </span>
              </Fragment>
            )
          })
        : benchNames(round) || '—'

  const hasBench = rounds.some((r) => r.benched.length)
  // the first round that is not fully ticked off is the one on court now
  const currentIdx = rounds.findIndex((r) => !r.matches.every((m) => m.done))

  const PlayBadge = ({ n }) => (
    <span
      className={cx(
        'ml-0.5 inline-block rounded px-1 text-xs leading-4 font-bold tabular-nums',
        n > staminaLimit
          ? 'bg-rose-600 text-white'
          : n === staminaLimit
            ? 'bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-300'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
      )}
    >
      {n}/{staminaLimit}
    </span>
  )

  const RestBadge = ({ n }) => (
    <span
      className={cx(
        'ml-0.5 inline-block rounded px-1 text-xs leading-4 font-bold tabular-nums',
        n >= 3
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          : 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
      )}
    >
      💤{n}
    </span>
  )

  /** One side of a net on a single line: "สมชาย + หมู" */
  const Side = ({ ids, tone, ri }) => (
    <span
      className={cx(
        'block text-[13px] leading-5 font-semibold [overflow-wrap:anywhere]',
        tone === 'A' ? 'text-sky-700 dark:text-sky-300' : 'text-rose-700 dark:text-rose-300'
      )}
    >
      {ids.map((id, i) => {
        const p = id ? playersById.get(id) : null
        return (
          <span key={i}>
            {i > 0 && <span className="font-normal text-slate-600 dark:text-slate-400"> + </span>}
            {p ? p.name : '—'}
            {p && showLevels && (
              <span className="ml-0.5 text-[10px] font-medium text-slate-400">
                {levelMeta(p.level).code}
              </span>
            )}
            {p && showStamina && <PlayBadge n={stamina[ri].get(id)?.play ?? 1} />}
          </span>
        )
      })}
    </span>
  )

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="sticky left-0 z-10 bg-slate-50 py-1.5 pr-2 pl-3 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                #
              </th>
              {columns.map((c, ci) => (
                <th
                  key={c.id}
                  colSpan={onToggleDone ? 2 : 1}
                  className="px-2 py-1.5 text-left sm:min-w-36"
                >
                  <span
                    className={cx(
                      'font-display inline-block rounded-[var(--radius-pill)] border-(length:--line-w) border-btn-edge px-2.5 py-0.5 text-xs whitespace-nowrap',
                      courtTone(ci)
                    )}
                  >
                    {t('courtLabel')} {c.name}
                  </span>
                </th>
              ))}
              {hasBench && (
                <th className="hidden min-w-24 px-2 py-1.5 text-xs font-semibold text-slate-600 sm:table-cell dark:text-slate-400">
                  {t('bench')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, i) => {
              const finished = round.matches.length > 0 && round.matches.every((m) => m.done)
              const current = i === currentIdx
              const tone = cx(
                current
                  ? 'bg-brand-50 dark:bg-brand-950/40'
                  : i % 2 === 1 && 'bg-slate-50/60 dark:bg-slate-800/20',
                finished && 'opacity-55'
              )
              const benchLine = hasBench && round.benched.length > 0
              return (
                <Fragment key={round.id}>
                  <tr
                    className={cx(
                      'border-b border-slate-100 last:border-0 dark:border-slate-800/70',
                      benchLine && 'max-sm:border-b-0',
                      tone
                    )}
                  >
                    <td
                      className={cx(
                        'sticky left-0 z-10 py-1.5 pr-2 pl-3 align-middle',
                        current
                          ? 'border-l-4 border-brand-600 bg-brand-50 pl-2 dark:bg-brand-950'
                          : 'bg-slate-50 dark:bg-slate-900'
                      )}
                    >
                      <span
                        className={cx(
                          'block text-xs font-bold tabular-nums',
                          current ? 'text-brand-700 dark:text-brand-300' : 'text-slate-600 dark:text-slate-400'
                        )}
                      >
                        {i + 1}
                      </span>
                      {current && (
                        <span className="flex items-start gap-1 text-xs leading-tight font-semibold text-brand-700 dark:text-brand-300">
                          <span className="live-dot mt-1" aria-hidden />
                          {t('nowPlaying')}
                        </span>
                      )}
                    </td>

                    {columns.map((c) => {
                      const m = round.matches.find((x) => x.courtId === c.id)
                      if (!m)
                        return (
                          <td
                            key={c.id}
                            colSpan={onToggleDone ? 2 : 1}
                            className="px-2 py-1.5 text-xs text-slate-300"
                          >
                            —
                          </td>
                        )
                      const hasScore =
                        typeof m.scoreA === 'number' && typeof m.scoreB === 'number'
                      return (
                        <Fragment key={c.id}>
                          <td
                            className={cx(
                              'py-1.5 pl-2 align-middle',
                              onToggleDone ? 'pr-1' : 'pr-2'
                            )}
                          >
                            <div className="min-w-0">
                              <Side ids={m.teamA} tone="A" ri={i} />
                              <span className="flex items-center gap-1 text-xs leading-4 font-semibold text-slate-600 dark:text-slate-400">
                                {t('vs')}
                                {hasScore && (
                                  <span className="text-slate-600 tabular-nums dark:text-slate-400">
                                    {m.scoreA}–{m.scoreB}
                                  </span>
                                )}
                                {m.done && !onToggleDone && (
                                  <span className="text-brand-600 dark:text-brand-400">✓</span>
                                )}
                              </span>
                              <Side ids={m.teamB} tone="B" ri={i} />
                            </div>
                          </td>
                          {/* its own narrow column, so the ticks line up row after row and
                              sit right after the longest names on that court */}
                          {onToggleDone && (
                            <td className="w-px py-0 pr-1 align-middle">
                              {/* a round tick the size of a thumb, labelled for screen readers */}
                              <button
                                onClick={() => onToggleDone(round, m.id)}
                                aria-pressed={!!m.done}
                                aria-label={t(m.done ? 'reopen' : 'finishGame')}
                                title={t(m.done ? 'reopen' : 'finishGame')}
                                className="group grid h-11 w-11 shrink-0 place-items-center"
                              >
                                <span
                                  className={cx(
                                    'grid h-9 w-9 place-items-center rounded-full border-2 font-semibold transition group-active:scale-90',
                                    m.done
                                      ? 'border-brand-600 bg-brand-600 text-sm text-white'
                                      : 'border-slate-300 text-xs text-slate-600 group-hover:border-brand-500 dark:border-slate-600 dark:text-slate-300'
                                  )}
                                  aria-hidden
                                >
                                  {m.done ? '✓' : t('finishGameShort')}
                                </span>
                              </button>
                            </td>
                          )}
                        </Fragment>
                      )
                    })}

                    {hasBench && (
                      <td className="hidden px-2 py-1.5 align-middle text-xs leading-4 text-slate-600 sm:table-cell dark:text-slate-400">
                        {benchList(round, i)}
                      </td>
                    )}
                  </tr>
                  {/* on a phone the bench gets a line under its round, so two courts fit */}
                  {benchLine && (
                    <tr
                      className={cx(
                        'border-b border-slate-100 last:border-0 sm:hidden dark:border-slate-800/70',
                        tone
                      )}
                    >
                      <td
                        colSpan={1 + columns.length * (onToggleDone ? 2 : 1)}
                        className={cx(
                          'pt-0 pr-3 pb-2 pl-3 text-xs leading-5 text-slate-600 dark:text-slate-400',
                          current && 'border-l-4 border-brand-600 pl-2'
                        )}
                      >
                        <span className="font-semibold">{t('bench')}</span> {benchList(round, i)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* under the table, so switching the badges on never pushes the rounds down */}
      {showStamina && (
        <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
          {t('staminaLegend', { a: `1/${staminaLimit}`, b: '💤1' })}
        </p>
      )}
    </Card>
  )
}
