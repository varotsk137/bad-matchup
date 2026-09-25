import { useMemo, useState } from 'react'
import {
  isAvailable,
  makeContext,
  rankPlayers,
  roundQuality,
  totalCapacity,
} from '../lib/matchmaker'
import MatchCard from './MatchCard'
import ScheduleTable from './ScheduleTable'
import { LevelBadge } from './PlayerBits'
import { Button, Card, Empty, cx } from './ui'

const MAX_AHEAD = 100

const MODES = [
  ['balanced', 'modeBalanced'],
  ['rotation', 'modeRotation'],
  ['random', 'modeRandom'],
  ['manual', 'modeManual'],
]

export default function PlayTab({
  state,
  playersById,
  t,
  actions,
  goTo,
  setToast,
  readOnly = false,
  onShare,
}) {
  const [sel, setSel] = useState(null)
  // before the first schedule exists you pick a session length; afterwards you
  // top it up a round or two at a time, so the two live in separate state
  const [preset, setPreset] = useState(5)
  const [customCount, setCustomCount] = useState(3)
  const [addCount, setAddCount] = useState(1)
  // the grid is the view people spend their time in; the cards are for
  // running the round that is happening right now
  const [view, setView] = useState('table')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [queueOpen, setQueueOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  // undefined = "follow the play" (open the first unfinished round); a string id
  // pins one open; null = everything shut
  const [openId, setOpenId] = useState(undefined)

  const mode = state.options.mode
  const capacity = totalCapacity(state.courts)
  const pool = state.players.filter(isAvailable)
  const hasRounds = state.rounds.length > 0
  const startCount = preset === 'custom' ? customCount : preset
  const ahead = hasRounds ? addCount : startCount

  const queue = useMemo(() => {
    if (!pool.length || mode === 'manual') return []
    const ctx = makeContext(state.players, state.rounds)
    return rankPlayers(pool, ctx, state.weights, state.options, 0).map((r) => ({
      player: r.p,
      games: r.s.games,
    }))
  }, [state.players, state.rounds, state.weights, state.options, mode, pool.length])

  const onSlotTap = (roundId) => (slot) => {
    if (!sel || sel.roundId !== roundId) {
      setSel({ roundId, slot })
      return
    }
    const a = sel.slot
    const b = slot
    const same =
      a.bench === b.bench &&
      (a.bench
        ? a.playerId === b.playerId
        : a.matchId === b.matchId && a.team === b.team && a.idx === b.idx)
    if (same) {
      setSel(null)
      return
    }
    actions.swapInRound(roundId, a, b)
    setSel(null)
  }

  const noCourts = !state.courts.some((c) => c.enabled !== false)
  const canGenerate = !noCourts && pool.length >= 2

  const run = async () => {
    if (!canGenerate) {
      setToast(t(noCourts ? 'errNoCourts' : 'errNotEnough'), 'error')
      return
    }
    setOpenId(undefined)
    if (mode === 'manual') {
      actions.newEmptyRound()
      return
    }
    await solve((onProgress) => actions.generate(ahead, onProgress), ahead)
  }

  /** Shared busy/progress wrapper for both generate and reshuffle. */
  const solve = async (work, total) => {
    setBusy(true)
    setProgress(total > 1 ? { done: 0, total } : null)
    try {
      await work((done, t2) => (t2 > 1 ? setProgress({ done, total: t2 }) : null))
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  /** Wipes the schedule and builds however many rounds the number box says. */
  const reshuffle = async () => {
    const n = addCount
    const old = state.rounds.length
    const hasResults = state.rounds.some((r) =>
      r.matches.some((m) => m.done || typeof m.scoreA === 'number')
    )
    // ask before throwing away recorded results, or before shortening the
    // schedule — reshuffling the same length in place needs no ceremony
    if ((hasResults || n !== old) && !confirm(t('regenerateConfirm', { old, n }))) return
    setOpenId(undefined)
    await solve((onProgress) => actions.regenerate(n, onProgress), n)
  }

  // A round with every match ticked off drops into the archive. It stays fully
  // editable down there — scores get corrected after the fact all the time.
  const indexed = state.rounds.map((round, i) => ({ round, number: i + 1 }))
  const active = indexed.filter((x) => !isArchived(x.round))
  const archived = indexed.filter((x) => isArchived(x.round))
  const firstActiveId = active[0]?.round.id
  const effectiveOpen = openId === undefined ? firstActiveId : openId

  /**
   * Finishing the last match of the round you were looking at hands the focus
   * to the next one, rather than leaving you staring at a completed card.
   */
  const onMatchDone = (round, matchId) => {
    const willFinish = round.matches.every((m) => (m.id === matchId ? !m.done : m.done))
    if (willFinish && openId === round.id) setOpenId(undefined)
    actions.toggleMatchDone(round.id, matchId)
  }

  // `key` is deliberately NOT in here — React 19 ignores a key that arrives via
  // a spread, so each call site passes it directly on the element instead.
  const roundProps = ({ round, number }) => ({
    round,
    number,
    open: effectiveOpen === round.id,
    onToggleOpen: () => setOpenId(effectiveOpen === round.id ? null : round.id),
    priorRounds: state.rounds.slice(0, number - 1),
    players: state.players,
    playersById,
    t,
    actions,
    onMatchDone,
    readOnly,
    sel: sel?.roundId === round.id ? sel.slot : null,
    onTap: onSlotTap(round.id),
  })

  const buttonLabel = busy
    ? progress
      ? `${t('generating')} ${progress.done}/${progress.total}`
      : t('generating')
    : mode === 'manual'
      ? t('newManualRound')
      : hasRounds
        ? addCount === 1
          ? t('addRounds')
          : t('addRoundsN', { n: addCount })
        : t('startRounds', { n: startCount })

  return (
    <div className="space-y-3">
      {/* ------------------------------------------------ controls */}
      {!readOnly && (
        <Card className="space-y-2.5 p-3">
          <div className="grid grid-cols-4 gap-1">
            {MODES.map(([value, key]) => (
              <button
                key={value}
                onClick={() => actions.setOption('mode', value)}
                className={cx(
                  'h-9 rounded-lg text-xs font-semibold transition active:scale-95',
                  mode === value
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                )}
              >
                {t(key)}
              </button>
            ))}
          </div>

          {mode !== 'manual' && !hasRounds && (
            <>
              <div className="grid grid-cols-4 gap-1">
                {[1, 5, 10, 'custom'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={cx(
                      'h-9 rounded-lg text-xs font-semibold tabular-nums transition active:scale-95',
                      preset === p
                        ? 'bg-accent-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    {p === 'custom' ? t('customCount') : `${p} ${t('roundsUnit')}`}
                  </button>
                ))}
              </div>
              {preset === 'custom' && (
                <Stepper
                  value={customCount}
                  onChange={setCustomCount}
                  max={MAX_AHEAD}
                  label={t('roundsLabel')}
                />
              )}
            </>
          )}

          <div className="flex gap-2">
            {mode !== 'manual' && hasRounds && (
              <Stepper
                value={addCount}
                onChange={setAddCount}
                max={MAX_AHEAD}
                label={t('roundsLabel')}
              />
            )}
            <Button variant="primary" className="h-11 flex-1" disabled={busy} onClick={run}>
              {buttonLabel}
            </Button>
            {busy ? (
              <Button className="h-11" onClick={actions.cancelGenerate}>
                {t('cancel')}
              </Button>
            ) : (
              mode !== 'manual' &&
              hasRounds && (
                <Button variant="accent" className="h-11" onClick={reshuffle}>
                  {t('regenerate')}
                </Button>
              )
            )}
          </div>

          {progress && (
            <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-brand-600 transition-[width] duration-150"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          )}
        </Card>
      )}

      {/* ------------------------------------------------ queue (folded away) */}
      {!readOnly && queue.length > capacity && capacity > 0 && (
        <button
          onClick={() => setQueueOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="shrink-0 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            {t('queueNext')}
          </span>
          {queueOpen ? (
            <span className="min-w-0 flex-1" />
          ) : (
            <span className="min-w-0 flex-1 truncate text-xs text-slate-600 dark:text-slate-300">
              {queue
                .slice(0, capacity)
                .map((q) => q.player.name)
                .join(' · ')}
            </span>
          )}
          <Chevron open={queueOpen} />
        </button>
      )}
      {!readOnly && queueOpen && queue.length > capacity && capacity > 0 && (
        <Card className="p-2.5">
          <div className="flex flex-wrap gap-1.5">
            {queue.map((q, i) => (
              <span
                key={q.player.id}
                className={cx(
                  'inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs',
                  i < capacity
                    ? 'bg-brand-50 font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                )}
              >
                <span className="text-[10px] tabular-nums opacity-60">{i + 1}</span>
                {q.player.name}
                <span className="text-[10px] tabular-nums opacity-60">{q.games}</span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* pinned so selecting a name never reflows the courts under the thumb */}
      {!readOnly && sel && (
        <div className="fixed inset-x-0 bottom-16 z-30 flex justify-center px-4 md:bottom-6">
          <div className="animate-pop flex items-center gap-3 rounded-xl bg-accent-600 py-2 pr-2 pl-4 text-sm font-medium text-white shadow-lg">
            {t('swapHint')}
            <button
              onClick={() => setSel(null)}
              className="rounded-lg bg-white/20 px-2.5 py-1 text-xs font-semibold"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ rounds */}
      {state.rounds.length === 0 ? (
        <Card>
          <Empty
            emoji="🏸"
            title={t('noRounds')}
            hint={state.players.length === 0 ? t('noPlayersHint') : t('noRoundsHint')}
            action={
              state.players.length === 0 ? (
                <Button variant="primary" onClick={() => goTo('players')}>
                  + {t('addPlayer')}
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800/80">
              {[
                ['table', 'viewTable'],
                ['cards', 'viewCards'],
              ].map(([v, key]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cx(
                    'h-10 flex-1 rounded-lg text-sm font-semibold transition active:scale-[0.98]',
                    view === v
                      ? 'bg-slate-50 text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            {!readOnly && (
              <>
                <button
                  onClick={onShare}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-slate-200/70 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300/70 active:scale-[0.98] dark:bg-slate-800 dark:text-slate-200"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M4 12v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3" strokeLinecap="round" />
                  </svg>
                  {t('share')}
                </button>
                <button
                  onClick={() => {
                    if (confirm(t('clearRoundsConfirm'))) actions.clearRounds()
                  }}
                  aria-label={t('clearRounds')}
                  title={t('clearRounds')}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-100 hover:text-rose-600 active:scale-95 dark:hover:bg-rose-950/50"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                  >
                    <path
                      d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L15 6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </>
            )}
          </div>

          {view === 'table' ? (
            <ScheduleTable
              rounds={state.rounds}
              courts={state.courts}
              playersById={playersById}
              t={t}
              setToast={setToast}
            />
          ) : (
            <>
              {active.map((x) => (
                <RoundCard key={x.round.id} {...roundProps(x)} />
              ))}

              {archived.length > 0 && (
                <>
                  <button
                    onClick={() => setArchiveOpen((v) => !v)}
                    className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left dark:border-slate-800 dark:bg-slate-900"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                      ✓
                    </span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {t('archived')} · {archived.length}
                    </span>
                    <span className="ml-auto">
                      <Chevron open={archiveOpen} />
                    </span>
                  </button>

                  {archiveOpen &&
                    archived.map((x) => (
                      <RoundCard key={x.round.id} {...roundProps(x)} archived />
                    ))}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------- sub-views */

function Chevron({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cx(
        'h-4 w-4 shrink-0 text-slate-400 transition-transform',
        open && 'rotate-180'
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** −/+ with a typable box, so 1 round is one tap and 37 rounds is possible. */
function Stepper({ value, onChange, max, label }) {
  const clamp = (n) => Math.min(max, Math.max(1, n))
  return (
    <div className="flex h-11 shrink-0 items-center rounded-xl border border-slate-300 dark:border-slate-700">
      <button
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        aria-label="-1"
        className="grid h-full w-9 place-items-center text-lg font-bold text-slate-500 disabled:opacity-30"
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        aria-label={label}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return
          onChange(clamp(Number(raw) || 1))
        }}
        onBlur={(e) => onChange(clamp(Number(e.target.value) || 1))}
        className="h-full w-10 border-0 bg-transparent text-center text-sm font-bold tabular-nums focus:outline-none"
      />
      <button
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="+1"
        className="grid h-full w-9 place-items-center text-lg font-bold text-slate-500 disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

const isArchived = (r) => r.matches.length > 0 && r.matches.every((m) => m.done)

function RoundCard({
  round,
  number,
  open,
  onToggleOpen,
  priorRounds,
  players,
  playersById,
  t,
  actions,
  onMatchDone,
  sel,
  onTap,
  archived = false,
  readOnly = false,
}) {
  const quality = useMemo(
    () => (open ? roundQuality(round, players, priorRounds) : null),
    [open, round, players, priorRounds]
  )
  const hasEmpty = round.matches.some((m) => [...m.teamA, ...m.teamB].some((x) => x == null))
  const doneCount = round.matches.filter((m) => m.done).length
  const allDone = round.matches.length > 0 && doneCount === round.matches.length

  return (
    <Card
      className={cx(
        'animate-pop overflow-hidden',
        open && 'ring-1 ring-brand-500/30',
        archived && !open && 'opacity-75'
      )}
    >
      <button
        onClick={onToggleOpen}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        {/* label before the number: Thai reads "รอบที่ 6", not "6 รอบที่" */}
        <span className="shrink-0 text-sm font-bold">
          {t('round')} {number}
        </span>
        {allDone && (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
            ✓
          </span>
        )}
        {!open && (
          <span className="min-w-0 flex-1 truncate text-xs text-slate-400 dark:text-slate-500">
            {round.matches
              .map((m) =>
                [...m.teamA, ...m.teamB].map((id) => playersById.get(id)?.name ?? '—').join(' ')
              )
              .join(' · ')}
          </span>
        )}
        <span className="ml-auto shrink-0 text-[11px] text-slate-400 tabular-nums dark:text-slate-500">
          {t('matchesDone', { a: doneCount, b: round.matches.length })}
        </span>
        <Chevron open={open} />
      </button>

      {open && (
        <div className="space-y-2.5 px-3 pb-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {round.matches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                playersById={playersById}
                t={t}
                selected={sel}
                onTap={onTap}
                onScore={(matchId, patch) => actions.updateMatch(round.id, matchId, patch)}
                onToggleDone={(matchId) => onMatchDone(round, matchId)}
                editable={!m.done && !readOnly}
                readOnly={readOnly}
              />
            ))}
          </div>

          {hasEmpty && !readOnly && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => actions.fillRound(round.id)}
            >
              {t('autoFill')}
            </Button>
          )}

          {round.benched.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                {t('bench')}
              </span>
              {round.benched.map((id) => {
                const p = playersById.get(id)
                if (!p) return null
                const isSel = sel?.bench && sel.playerId === id
                return readOnly ? (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium dark:border-slate-700"
                  >
                    {p.name}
                    <LevelBadge level={p.level} />
                  </span>
                ) : (
                  <button
                    key={id}
                    onClick={() => onTap({ bench: true, playerId: id })}
                    className={cx(
                      'inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium transition active:scale-95',
                      isSel
                        ? 'border-accent-500 ring-2 ring-accent-500'
                        : 'border-slate-200 dark:border-slate-700'
                    )}
                  >
                    {p.name}
                    <LevelBadge level={p.level} />
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            {quality?.matches > 0 && (
              <span>
                {t('qRepeatPartner')} {quality.repeatPartners} · {t('qRepeatOpp')}{' '}
                {quality.repeatOpponents} · {t('qGap')} {quality.maxGap}
              </span>
            )}
            {!readOnly && (
              <button
                onClick={() => {
                  if (confirm(t('deleteRoundConfirm'))) actions.deleteRound(round.id)
                }}
                className="ml-auto rounded px-1.5 py-0.5 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/50"
              >
                {t('deleteRound')}
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
