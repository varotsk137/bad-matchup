import { useState } from 'react'
import { TEAM_TEXT } from './MatchCard'
import { Button, Segmented, Sheet, cx } from './ui'

const sameSlot = (a, b) =>
  a &&
  b &&
  a.bench === b.bench &&
  (a.bench
    ? a.playerId === b.playerId
    : a.matchId === b.matchId && a.team === b.team && a.idx === b.idx)

/**
 * "ปรับคนลง": everyone in one round on one sheet, grouped by court and bench.
 * Pick who comes out, then who goes in, read the summary, then swap. Tapping
 * two names on the card still works too; this is the spelled-out way.
 */
export default function SwapSheet({
  round,
  number,
  playersById,
  t,
  onSwap,
  onResize,
  onClose,
}) {
  const [first, setFirst] = useState(null)
  const [second, setSecond] = useState(null)
  if (!round) return null

  const nameOf = (slot) => {
    const id = slot.bench
      ? slot.playerId
      : round.matches.find((m) => m.id === slot.matchId)?.[
          slot.team === 'A' ? 'teamA' : 'teamB'
        ][slot.idx]
    return (id && playersById.get(id)?.name) || t('emptySlot')
  }
  const placeOf = (slot) =>
    slot.bench
      ? t('bench')
      : t('swapCourt', { court: round.matches.find((m) => m.id === slot.matchId)?.courtName })

  const pick = (slot) => {
    if (sameSlot(slot, first)) {
      setFirst(second)
      setSecond(null)
    } else if (sameSlot(slot, second)) setSecond(null)
    else if (!first) setFirst(slot)
    // two people on the bench trade nothing: the new tap replaces the first
    else if (first.bench && slot.bench) setFirst(slot)
    else setSecond(slot)
  }

  const chip = (slot, label, tone) => {
    const { locked, ...place } = slot
    const isFirst = sameSlot(place, first)
    const isSecond = sameSlot(place, second)
    return (
      <button
        key={place.bench ? place.playerId : `${place.matchId}-${place.team}-${place.idx}`}
        onClick={() => pick(place)}
        disabled={locked}
        aria-pressed={isFirst || isSecond}
        className={cx(
          'h-11 max-w-full truncate rounded-xl border px-3.5 text-sm font-semibold transition active:scale-95 disabled:opacity-40',
          'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
          tone ?? 'text-slate-700 dark:text-slate-200',
          isFirst
            ? 'border-accent-500 bg-accent-100 ring-2 ring-accent-500 dark:bg-accent-900/40'
            : isSecond
              ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-900/40'
              : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
        )}
      >
        {label}
      </button>
    )
  }

  const close = () => {
    setFirst(null)
    setSecond(null)
    onClose()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={t('swapTitle', { n: number })}
      footer={
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!first || !second}
          onClick={() => {
            onSwap(first, second)
            close()
          }}
        >
          {t('swapDo')}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          <span
            className={cx(
              'rounded-full px-2.5 py-1',
              first
                ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
                : 'bg-preset text-preset-ink'
            )}
          >
            {first ? `1 ${nameOf(first)} ✓` : t('swapStep1')}
          </span>
          <span
            className={cx(
              'rounded-full px-2.5 py-1',
              second
                ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
                : first
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
            )}
          >
            {second ? `2 ${nameOf(second)} ✓` : t('swapStep2')}
          </span>
        </div>

        {round.matches.map((m) => (
          <div key={m.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 text-xs font-semibold whitespace-nowrap text-slate-600 dark:text-slate-400">
                {t('swapCourt', { court: m.courtName })}
                {m.done && ` · ${t('swapDone')}`}
              </p>
              {/* singles or doubles by hand: doubles opens an empty seat a side
                  to fill from the bench below; singles sends the second players there */}
              {onResize && !m.done && (
                <div className="w-40 shrink-0">
                  <Segmented
                    size="sm"
                    label={t('v4MatchSizeFor', { court: m.courtName })}
                    value={m.teamA.length === 1 ? 2 : 4}
                    onChange={(size) => {
                      setFirst(null)
                      setSecond(null)
                      onResize(m.id, size)
                    }}
                    options={[
                      { value: 2, label: t('singles') },
                      { value: 4, label: t('doubles') },
                    ]}
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['A', 'B'].flatMap((team) =>
                (team === 'A' ? m.teamA : m.teamB).map((id, idx) =>
                  chip(
                    { matchId: m.id, team, idx, locked: m.done },
                    (id && playersById.get(id)?.name) || `+ ${t('emptySlot')}`,
                    TEAM_TEXT[team]
                  )
                )
              )}
            </div>
          </div>
        ))}

        {round.benched.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('bench')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {round.benched
                .filter((id) => playersById.get(id))
                .map((id) => chip({ bench: true, playerId: id }, playersById.get(id).name))}
            </div>
          </div>
        )}

        {first && second && (
          <p
            className="rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800"
            role="status"
          >
            <b>{nameOf(first)}</b> ⇄ <b>{nameOf(second)}</b>
            <span className="block text-xs text-slate-600 dark:text-slate-400">
              {t('swapSummary', {
                a: nameOf(first),
                b: nameOf(second),
                toA: placeOf(second),
                toB: placeOf(first),
              })}
            </span>
          </p>
        )}
      </div>
    </Sheet>
  )
}
