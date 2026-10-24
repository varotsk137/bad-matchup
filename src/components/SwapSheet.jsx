import { useState } from 'react'
import { TEAM_TEXT } from './MatchCard'
import { Button, Sheet, cx } from './ui'

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
export default function SwapSheet({ round, number, playersById, t, onSwap, onClose }) {
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
        className={cx(
          'h-9 max-w-full truncate rounded-lg border px-3 text-sm font-semibold transition active:scale-95 disabled:opacity-40',
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
        <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
          <span
            className={cx(
              'rounded-full px-2 py-0.5',
              first
                ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
                : 'bg-accent-500 text-white'
            )}
          >
            {first ? `1 ${nameOf(first)} ✓` : t('swapStep1')}
          </span>
          <span
            className={cx(
              'rounded-full px-2 py-0.5',
              second
                ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
                : first
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
            )}
          >
            {second ? `2 ${nameOf(second)} ✓` : t('swapStep2')}
          </span>
        </div>

        {round.matches.map((m) => (
          <div key={m.id}>
            <p className="mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('swapCourt', { court: m.courtName })}
              {m.done && ` · ${t('swapDone')}`}
            </p>
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
            <p className="mb-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
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
            <span className="block text-xs text-slate-500 dark:text-slate-400">
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
