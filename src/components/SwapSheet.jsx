import { useState } from 'react'
import { swapSlots } from '../lib/matchmaker'
import { ops } from '../lib/ops'
import { TEAM_TEXT } from './MatchCard'
import { Button, Segmented, Sheet, askConfirm, cx } from './ui'

const sameSlot = (a, b) =>
  a &&
  b &&
  a.bench === b.bench &&
  (a.bench
    ? a.playerId === b.playerId
    : a.matchId === b.matchId && a.team === b.team && a.idx === b.idx)

// who plays where, and nothing else: what Save would change
const lineup = (r) =>
  JSON.stringify([r.matches.map((m) => [m.teamA, m.teamB]), [...r.benched].sort()])

/**
 * "ปรับคนลง": everyone in one round on one sheet, grouped by court and bench.
 * Pick who comes out, then who goes in, and swap; switch a court between
 * singles and doubles. All of it happens on a draft: nothing reaches the
 * schedule until Save, and closing with changes asks before throwing them
 * away. Tapping two names on the card still swaps at once; this is the
 * careful way.
 */
export default function SwapSheet({ round, number, playersById, t, onSave, onClose }) {
  const [draft, setDraft] = useState(round)
  const [first, setFirst] = useState(null)
  const [second, setSecond] = useState(null)
  if (!round || !draft) return null
  const dirty = lineup(draft) !== lineup(round)

  const idAt = (r, slot) =>
    slot.bench
      ? slot.playerId
      : r.matches.find((m) => m.id === slot.matchId)?.[slot.team === 'A' ? 'teamA' : 'teamB'][
          slot.idx
        ]
  const nameOf = (slot) => {
    const id = idAt(draft, slot)
    return (id && playersById.get(id)?.name) || t('emptySlot')
  }
  const placeOf = (slot) =>
    slot.bench
      ? t('bench')
      : t('swapCourt', { court: draft.matches.find((m) => m.id === slot.matchId)?.courtName })

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

  const clearPicks = () => {
    setFirst(null)
    setSecond(null)
  }
  const swap = () => {
    setDraft((d) => swapSlots(d, first, second))
    clearPicks()
  }
  const resize = (matchId, size) => {
    clearPicks()
    setDraft((d) => ops.setMatchSize({ rounds: [d] }, d.id, matchId, size).rounds[0])
  }

  // a seat whose person differs from the saved schedule gets a mark
  const changed = (slot) => {
    const before = slot.bench
      ? round.benched.includes(slot.playerId)
        ? slot.playerId
        : null
      : idAt(round, slot)
    return idAt(draft, slot) !== before
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
          'inline-flex h-11 max-w-full items-center gap-1.5 truncate rounded-xl border px-3.5 text-sm font-semibold transition active:scale-95 disabled:opacity-40',
          'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
          tone ?? 'text-slate-700 dark:text-slate-200',
          isFirst
            ? 'border-accent-500 bg-accent-100 ring-2 ring-accent-500 dark:bg-accent-900/40'
            : isSecond
              ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-500 dark:bg-brand-900/40'
              : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900'
        )}
      >
        {changed(place) && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent-500" aria-hidden />
        )}
        {label}
      </button>
    )
  }

  const close = async () => {
    if (dirty) {
      const ok = await askConfirm({
        message: t('swapDiscardConfirm'),
        confirmLabel: t('swapDiscard'),
      })
      if (!ok) return
    }
    onClose()
  }

  return (
    <Sheet
      open
      onClose={close}
      title={t('swapTitle', { n: number })}
      footer={
        // the footer never moves the list: two picked, it offers the swap;
        // otherwise it is cancel and save
        first && second ? (
          <div className="space-y-2" role="status">
            <p className="px-1 text-sm">
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
            <div className="flex items-center gap-2">
              <Button size="lg" className="flex-1" onClick={clearPicks}>
                {t('cancel')}
              </Button>
              <Button variant="primary" size="lg" className="flex-[2]" onClick={swap}>
                {t('swapDo')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button size="lg" className="flex-1" onClick={close}>
              {t('cancel')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              className="flex-[2]"
              disabled={!dirty}
              onClick={() => {
                onSave(draft)
                onClose()
              }}
            >
              {t('save')}
            </Button>
          </div>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
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
          {dirty && (
            <span
              className="ml-auto font-semibold text-amber-800 dark:text-amber-300"
              role="status"
            >
              {t('swapUnsaved')}
            </span>
          )}
        </div>

        {draft.matches.map((m) => (
          <div key={m.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <p className="min-w-0 text-xs font-semibold whitespace-nowrap text-slate-600 dark:text-slate-400">
                {t('swapCourt', { court: m.courtName })}
                {m.done && ` · ${t('swapDone')}`}
              </p>
              {/* singles or doubles by hand: doubles opens an empty seat a side
                  to fill from the bench below; singles sends the second players there */}
              {!m.done && (
                <div className="w-40 shrink-0">
                  <Segmented
                    size="sm"
                    label={t('v4MatchSizeFor', { court: m.courtName })}
                    value={m.teamA.length === 1 ? 2 : 4}
                    onChange={(size) => resize(m.id, size)}
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

        {draft.benched.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              {t('bench')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {draft.benched
                .filter((id) => playersById.get(id))
                .map((id) => chip({ bench: true, playerId: id }, playersById.get(id).name))}
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}
