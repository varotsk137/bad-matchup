import { useEffect, useMemo, useState } from 'react'
import {
  isAvailable,
  makeContext,
  playedRounds,
  rankPlayers,
  roundQuality,
  totalCapacity,
} from '../lib/matchmaker'
import CostSplitSheet from './CostSplitSheet'
import MatchCard from './MatchCard'
import ScheduleTable from './ScheduleTable'
import ImageSheet from './ImageSheet'
import { renderSchedulePng } from '../lib/exportImage'
import SwapSheet from './SwapSheet'
import { analyse } from './FairnessReport'
import HelpSheet from './HelpSheet'
import { rosterChange } from '../lib/roster'
import RoundAdvisor from './RoundAdvisor'
import { Button, Card, Empty, Sheet, cx } from './ui'

const MAX_AHEAD = 100
const SLOW_MS = 5000

export const DEFAULT_COUNTS = { preset: 5, customCount: 3, addCount: 1 }

const MODES = [
  ['balanced', 'modeBalanced'],
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
  // with readOnly: still lets this person tick matches done and enter scores
  // (an edit link to a live room) while the schedule itself stays locked
  canScore = false,
  // the live room: open its sheet, and whether one is running
  onLive,
  liveOn = false,
  counts: liftedCounts,
}) {
  const [sel, setSel] = useState(null)
  // before the first schedule exists you pick a session length; afterwards you
  // top it up a round or two at a time, so the two live in separate state.
  // The parent owns it when it can, so switching tabs keeps the numbers.
  const localCounts = useState(DEFAULT_COUNTS)
  const [counts, setCounts] = liftedCounts || localCounts
  const { preset, customCount, addCount } = counts
  const setPreset = (v) => setCounts((c) => ({ ...c, preset: v }))
  const setCustomCount = (v) => setCounts((c) => ({ ...c, customCount: v }))
  const setAddCount = (v) => setCounts((c) => ({ ...c, addCount: v }))
  const [helpOpen, setHelpOpen] = useState(false)
  const [reshuffleOpen, setReshuffleOpen] = useState(false)
  const [redoCount, setRedoCount] = useState(1)
  const [startOverCount, setStartOverCount] = useState(1)
  // a build that runs past a few seconds earns a pointer to the knobs that
  // make it faster
  const [slow, setSlow] = useState(false)
  // the grid is the view people spend their time in; the cards are for
  // running the round that is happening right now
  const [view, setView] = useState('table')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [queueOpen, setQueueOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [splitOpen, setSplitOpen] = useState(false)
  // the table's checking aids, kept here so they sit in the view row
  const [showLevels, setShowLevels] = useState(false)
  const [showStamina, setShowStamina] = useState(false)
  // the schedule image works from either view, it is what the club receives
  const [exporting, setExporting] = useState(false)
  const [png, setPng] = useState(null)
  const onExport = async () => {
    setExporting(true)
    try {
      setPng(
        await renderSchedulePng({
          rounds: state.rounds,
          courts: state.courts,
          playersById,
          title: t('imageTitle'),
          subtitle: `${state.rounds.length} ${t('roundsUnit')} · ${new Date().toLocaleDateString()}`,
          labels: {
            round: t('round'),
            court: t('courtLabel'),
            bench: t('bench'),
            vs: t('vs'),
            footer: t('appName'),
          },
        })
      )
    } catch {
      setToast?.(t('exportFailed'), 'error')
    } finally {
      setExporting(false)
    }
  }
  // undefined = "follow the play" (open the first unfinished round); a string id
  // pins one open; null = everything shut
  // which rounds are open; undefined means the default: the round being
  // played and the one after it
  const [openIds, setOpenId] = useState(undefined)
  const [swapRoundId, setSwapRoundId] = useState(null)

  const mode = state.options.mode

  useEffect(() => {
    if (!busy) {
      setSlow(false)
      return
    }
    const timer = setTimeout(() => setSlow(true), SLOW_MS)
    return () => clearTimeout(timer)
  }, [busy])

  // once every pair has teamed up, say so and point at the full fairness
  // check — quietly, it is a nice-to-know
  const covered = useMemo(() => {
    if (state.rounds.length < 2) return false
    const r = analyse(state)
    return r.ids.length >= 4 && r.neverPartnered === 0
  }, [state])
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
    // swapping two people on the bench changes nothing — treat the second tap
    // as "I meant this one" and move the selection over
    if (a.bench && b.bench) {
      setSel({ roundId, slot })
      return
    }
    setSel(null)
    doSwap(roundId, a, b)
  }

  /** Swaps two places in a round, with an undo in the toast. */
  const doSwap = (roundId, a, b) => {
    const before = state.rounds.find((r) => r.id === roundId)
    actions.swapInRound(roundId, a, b)
    if (before)
      setToast(t('swapped', { a: slotName(before, a), b: slotName(before, b) }), 'info', {
        label: t('undo'),
        run: () => actions.restoreLineup(roundId, before),
      })
  }

  const slotName = (round, slot) => {
    const id = slot.bench
      ? slot.playerId
      : round.matches.find((m) => m.id === slot.matchId)?.[
          slot.team === 'A' ? 'teamA' : 'teamB'
        ][slot.idx]
    return (id && playersById.get(id)?.name) || t('emptySlot')
  }

  // what the hint bar says while someone is picked and waiting for a partner
  const selRound = sel && state.rounds.find((r) => r.id === sel.roundId)
  const selName = selRound ? slotName(selRound, sel.slot) : null

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
      await work((done, t2, phase, attempt, attempts) =>
        t2 > 1 ? setProgress({ done, total: t2, phase, attempt, attempts }) : null
      )
    } finally {
      setBusy(false)
      setProgress(null)
    }
  }

  const played = playedRounds(state.rounds)
  const remaining = state.rounds.length - played

  /**
   * Reshuffling has its own count, never the add-rounds one: it starts at every
   * round not yet played. Once a match has been played there is also the
   * start-over choice; before that the two are the same thing.
   */
  const reshuffle = () => {
    setRedoCount(Math.max(1, remaining))
    setStartOverCount(Math.max(1, state.rounds.length))
    setReshuffleOpen(true)
  }

  const reshuffleRemaining = async (count) => {
    // only ever a number of rounds — never a click event passed straight through
    const n = Number.isInteger(count) && count > 0 ? count : redoCount
    setReshuffleOpen(false)
    setOpenId(undefined)
    await solve((onProgress) => actions.regenerateRemaining(onProgress, n), n)
  }

  // someone left or arrived after the rest of the schedule was built
  const change = useMemo(
    () => (readOnly || mode === 'manual' ? null : rosterChange(state)),
    [state, readOnly, mode]
  )
  const namesOf = (ids) => {
    const names = ids.map((id) => playersById.get(id)?.name).filter(Boolean)
    return names.length > 3
      ? `${names.slice(0, 3).join(', ')} +${names.length - 3}`
      : names.join(', ')
  }

  const startOver = async () => {
    const n = startOverCount
    setReshuffleOpen(false)
    if (!confirm(t('startOverConfirm', { n }))) return
    setOpenId(undefined)
    await solve((onProgress) => actions.regenerate(n, onProgress), n)
  }

  // A round with every match ticked off drops into the archive. It stays fully
  // editable down there — scores get corrected after the fact all the time.
  const indexed = state.rounds.map((round, i) => ({ round, number: i + 1 }))
  const active = indexed.filter((x) => !isArchived(x.round))
  const archived = indexed.filter((x) => isArchived(x.round))
  const nowId = active[0]?.round.id
  const nextId = active[1]?.round.id
  const openSet = new Set(openIds ?? [nowId, nextId].filter(Boolean))
  const toggleOpen = (id) => {
    const next = new Set(openSet)
    next.has(id) ? next.delete(id) : next.add(id)
    setOpenId([...next])
  }

  /**
   * Finishing the last match of the round you were looking at hands the focus
   * to the next one, rather than leaving you staring at a completed card.
   */
  const onMatchDone = (round, matchId) => {
    const willFinish = round.matches.every((m) => (m.id === matchId ? !m.done : m.done))
    if (willFinish && round.id === nowId) setOpenId(undefined)
    actions.toggleMatchDone(round.id, matchId)
  }

  // `key` is deliberately NOT in here — React 19 ignores a key that arrives via
  // a spread, so each call site passes it directly on the element instead.
  // court colour follows the court's place in the courts list, round to round
  const courtOrder = new Map(state.courts.map((c, i) => [c.id, i]))
  const roundProps = ({ round, number }) => ({
    round,
    number,
    open: openSet.has(round.id),
    onToggleOpen: () => toggleOpen(round.id),
    tag: round.id === nowId ? 'now' : round.id === nextId ? 'next' : null,
    onSwap: readOnly ? null : () => setSwapRoundId(round.id),
    priorRounds: state.rounds.slice(0, number - 1),
    players: state.players,
    playersById,
    t,
    actions,
    onMatchDone,
    readOnly,
    canScore,
    sel: sel?.roundId === round.id ? sel.slot : null,
    onTap: onSlotTap(round.id),
    courtOrder,
  })

  const buttonLabel = busy
    ? (progress?.phase === 'polish'
        ? t('polishing')
        : progress?.phase === 'plan'
          ? `${t('planningAhead')} ${progress.done}/${progress.total}`
          : progress
            ? `${t('generating')} ${progress.done}/${progress.total}`
            : t('generating')) +
      (progress?.attempts > 1
        ? ` · ${t('attemptN', { n: progress.attempt, of: progress.attempts })}`
        : '')
    : mode === 'manual'
      ? t('newManualRound')
      : hasRounds
        ? t('addRoundsN', { n: addCount })
        : t('startRounds', { n: startCount })

  return (
    <div className="space-y-3">
      {/* ------------------------------------------------ controls */}
      {!readOnly && (
        <Card className="space-y-2.5 p-3">
          <div className="flex gap-1">
            {/* fair is the mode nearly every night; random and manual stay one tap
                away, as plain text, so they do not compete with it */}
            <div className="grid flex-1 grid-cols-[2fr_1fr_1fr] gap-1">
              {MODES.map(([value, key]) => (
                <button
                  key={value}
                  onClick={() => actions.setOption('mode', value)}
                  className={cx(
                    'h-11 rounded-[var(--radius-pill)] border-(length:--line-w) text-sm transition active:scale-95',
                    mode === value
                      ? 'border-btn-edge bg-brand-600 text-white shadow-[var(--shadow-pick)]'
                      : value === 'balanced'
                        ? 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        : 'border-transparent bg-transparent text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  )}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setHelpOpen(true)}
              aria-label={t('help')}
              title={t('help')}
              className="h-11 w-11 shrink-0 rounded-lg bg-slate-100 text-sm font-bold text-slate-600 transition active:scale-95 dark:bg-slate-800 dark:text-slate-300"
            >
              ?
            </button>
          </div>
          <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} t={t} />
          {swapRoundId && (
            <SwapSheet
              round={state.rounds.find((r) => r.id === swapRoundId)}
              number={state.rounds.findIndex((r) => r.id === swapRoundId) + 1}
              playersById={playersById}
              t={t}
              onSwap={(a, b) => doSwap(swapRoundId, a, b)}
              onClose={() => setSwapRoundId(null)}
            />
          )}
          <Sheet
            open={reshuffleOpen}
            onClose={() => setReshuffleOpen(false)}
            title={t('regenerate')}
          >
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {played > 0 ? t('reshuffleIntro', { played }) : t('reshuffleIntroFresh')}
              </p>
              <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800/60">
                <span className="text-sm">
                  {played > 0 ? t('reshuffleHowMany', { played }) : t('reshuffleHowManyFresh')}
                </span>
                <Stepper
                  value={redoCount}
                  onChange={setRedoCount}
                  max={MAX_AHEAD}
                  label={t('roundsLabel')}
                />
              </div>
              <Button
                variant="primary"
                className="h-auto w-full flex-col items-start gap-0.5 py-3 text-left"
                onClick={() => reshuffleRemaining(redoCount)}
              >
                <span className="text-sm font-semibold">
                  {played > 0
                    ? t('reshuffleRemaining', { n: redoCount })
                    : t('reshuffleAllN', { n: redoCount })}
                </span>
                <span className="text-xs font-normal opacity-80">
                  {played > 0 ? t('reshuffleRemainingHint') : t('reshuffleAllHint')}
                </span>
              </Button>
              {played > 0 && (
                <>
                  <div className="flex items-center gap-3 py-1 text-xs text-slate-400" aria-hidden>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    {t('or')}
                    <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800/60">
                    <span className="text-sm">{t('startOverHowMany')}</span>
                    <Stepper
                      value={startOverCount}
                      onChange={setStartOverCount}
                      max={MAX_AHEAD}
                      label={t('roundsLabel')}
                    />
                  </div>
                  <Button
                    variant="accent"
                    className="h-auto w-full flex-col items-start gap-0.5 py-3 text-left"
                    onClick={startOver}
                  >
                    <span className="text-sm font-semibold">
                      {t('startOver', { n: startOverCount })}
                    </span>
                    <span className="text-xs font-normal opacity-90">{t('startOverHint')}</span>
                  </Button>
                </>
              )}
            </div>
          </Sheet>

          {mode !== 'manual' && !hasRounds && (
            <>
              <div className="grid grid-cols-4 gap-1">
                {[1, 5, 10, 'custom'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPreset(p)}
                    className={cx(
                      'h-11 rounded-[var(--radius-pill)] border-(length:--line-w) text-sm tabular-nums transition active:scale-95',
                      preset === p
                        ? 'border-btn-edge bg-preset text-preset-ink shadow-[var(--shadow-pick)]'
                        : 'border-transparent bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
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
              <RoundAdvisor
                state={state}
                t={t}
                actions={actions}
                onUse={(n) => {
                  setPreset('custom')
                  setCustomCount(n)
                }}
              />
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
            {busy ? (
              // the progress runs inside the button, so its label stays readable
              <div
                role="status"
                className="relative flex h-11 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-xl border-(length:--line-w) border-edge bg-brand-50 px-3 dark:bg-brand-950"
              >
                <div
                  className={cx(
                    'absolute inset-y-0 left-0 bg-brand-200 transition-[width] duration-150 dark:bg-brand-800',
                    progress?.phase === 'polish' && 'animate-pulse'
                  )}
                  style={{ width: progress ? `${(progress.done / progress.total) * 100}%` : '0%' }}
                />
                <span className="relative truncate text-sm font-semibold text-brand-900 dark:text-brand-50">
                  {buttonLabel}
                </span>
              </div>
            ) : (
              <Button variant="primary" className="h-11 min-w-0 flex-1" onClick={run}>
                {buttonLabel}
              </Button>
            )}
            {busy ? (
              <Button className="h-11" onClick={actions.cancelGenerate}>
                {t('cancel')}
              </Button>
            ) : (
              mode !== 'manual' &&
              hasRounds && (
                <Button variant="outline" className="h-11 min-w-0 flex-1" onClick={reshuffle}>
                  {t(played > 0 ? 'redoRemainingShort' : 'redoAllShort')}
                </Button>
              )
            )}
          </div>

          {busy && slow && (
            <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 dark:text-slate-400">
              {t('slowHint')}
              <button
                onClick={() => goTo('settings')}
                className="font-semibold text-brand-700 underline-offset-2 hover:underline dark:text-brand-300"
              >
                {t('slowHintLink')} →
              </button>
            </p>
          )}
        </Card>
      )}

      {/* ------------------------------------------------ the group changed */}
      {change && !busy && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border-2 border-accent-500 bg-accent-50 px-3 py-2.5 dark:bg-accent-950/50">
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-semibold text-accent-800 dark:text-accent-200">
              {t('rosterChangedTitle')}
            </span>
            <span className="block text-xs text-slate-600 dark:text-slate-300">
              {[
                change.gone.length && t('rosterGone', { names: namesOf(change.gone) }),
                change.arrived.length && t('rosterArrived', { names: namesOf(change.arrived) }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
          <Button
            variant="accent"
            className="h-10 shrink-0"
            onClick={() => reshuffleRemaining(Math.max(1, change.upcoming))}
          >
            {t('redoRemainingN', { n: change.upcoming })}
          </Button>
        </div>
      )}

      {/* ------------------------------------------------ everyone has met */}
      {!readOnly && !busy && covered && (
        <button
          onClick={() => goTo('stats')}
          className="flex w-full items-center gap-2 rounded-xl border border-brand-600/30 bg-brand-50/60 px-3 py-2 text-left text-xs dark:border-brand-500/20 dark:bg-brand-950/30"
        >
          <span className="text-brand-700 dark:text-brand-300" aria-hidden>
            ✓
          </span>
          <span className="min-w-0 flex-1 text-slate-600 dark:text-slate-300">
            {t('coveredHint')}
          </span>
          <span className="shrink-0 font-semibold text-brand-700 dark:text-brand-300">
            {t('coveredLink')} →
          </span>
        </button>
      )}

      {/* ------------------------------------------------ queue (folded away) */}
      {!readOnly && queue.length > capacity && capacity > 0 && (
        <button
          onClick={() => setQueueOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 min-h-11 px-3 py-2 text-left dark:border-slate-800 dark:bg-slate-900"
        >
          <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-400">
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
          <div className="animate-pop flex max-w-sm items-center gap-3 rounded-xl bg-accent-600 py-1.5 pr-1.5 pl-4 text-sm font-medium text-white shadow-lg">
            <span className="min-w-0 flex-1">
              {selName ? t('swapHintNamed', { name: selName }) : t('swapHint')}
            </span>
            <button
              onClick={() => setSel(null)}
              className="h-9 shrink-0 rounded-lg bg-white/20 px-3 text-sm font-semibold transition active:scale-95"
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
          {/* what the organiser does once the plan is made: send it out */}
          <div className="flex flex-wrap items-center gap-2">
            {!readOnly && onLive && (
              <button
                onClick={onLive}
                className={cx(
                  'press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border-(length:--line-w) px-3 text-sm',
                  liveOn
                    ? 'border-rose-400 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100 dark:hover:bg-rose-950/70'
                    : 'border-edge-strong bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700'
                )}
              >
                {liveOn ? (
                  <span
                    className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500"
                    aria-hidden
                  />
                ) : (
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden
                  >
                    <path
                      d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M4 12v3a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
                {t(liveOn ? 'liveButtonOn' : 'liveButton')}
              </button>
            )}
            <button
              onClick={onExport}
              disabled={exporting}
              className="press inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border-(length:--line-w) border-btn-edge bg-brand-600 px-3 text-sm text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path
                  d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.5 13.5V15a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1.5"
                  strokeLinecap="round"
                />
              </svg>
              {exporting ? t('exporting') : t('exportImageShort')}
            </button>
            {!readOnly && (
              <button
                onClick={() => setSplitOpen(true)}
                className="press inline-flex h-11 shrink-0 items-center rounded-xl border-(length:--line-w) border-btn-edge bg-accent-500 px-3 text-sm text-on-accent hover:bg-accent-600"
              >
                {t('splitButton')}
              </button>
            )}
            {splitOpen && (
              <CostSplitSheet
                state={state}
                t={t}
                setToast={setToast}
                goTo={goTo}
                onClose={() => setSplitOpen(false)}
              />
            )}
            <ImageSheet png={png} onClose={() => setPng(null)} t={t} setToast={setToast} />
          </div>

          {/* how to look at it: the view, and in the table the two checking aids */}
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 gap-1 rounded-xl border-(length:--line-w) border-edge bg-track p-0.5">
              {[
                ['table', 'viewTable'],
                ['cards', 'viewCards'],
              ].map(([v, key]) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cx(
                    'h-11 flex-1 rounded-lg text-sm transition active:scale-[0.98]',
                    view === v
                      ? 'bg-pick text-pick-ink shadow-[var(--shadow-pick)]'
                      : 'text-slate-600 dark:text-slate-300'
                  )}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            {view === 'table' &&
              [
                [showLevels, setShowLevels, 'showLevels'],
                [showStamina, setShowStamina, 'showStamina'],
              ].map(([on, set, key]) => (
                <button
                  key={key}
                  onClick={() => set((v) => !v)}
                  aria-pressed={on}
                  className={cx(
                    'h-12 shrink-0 rounded-[var(--radius-pill)] border-(length:--line-w) px-3 text-sm whitespace-nowrap transition',
                    on
                      ? 'border-btn-edge bg-chip text-chip-ink'
                      : 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {t(key)}
                </button>
              ))}
          </div>

          {view === 'table' ? (
            <ScheduleTable
              rounds={state.rounds}
              courts={state.courts}
              playersById={playersById}
              t={t}
              setToast={setToast}
              staminaLimit={state.options.maxConsecutive}
              showLevels={showLevels}
              showStamina={showStamina}
              onToggleDone={readOnly && !canScore ? undefined : onMatchDone}
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

          {/* clearing everything sits at the end, away from the buttons used every night */}
          {!readOnly && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  if (confirm(t('clearRoundsConfirm'))) actions.clearRounds()
                }}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                <svg
                  viewBox="0 0 20 20"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  aria-hidden
                >
                  <path
                    d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L15 6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t('clearRounds')}
              </button>
            </div>
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

/**
 * −/+ with a typable box, so 1 round is one tap and 37 rounds is possible.
 *
 * The box keeps its own draft text: clamping on every keystroke made it
 * impossible to clear (backspace snapped back to 1) and impossible to type
 * 20 (1 → 12 → 100). The parent only hears about whole, in-range numbers, and
 * whatever is left in the box gets tidied up on blur.
 */
function Stepper({ value, onChange, max, label }) {
  const [draft, setDraft] = useState(null)
  const clamp = (n) => Math.min(max, Math.max(1, n))
  const step = (d) => {
    setDraft(null)
    onChange(clamp(value + d))
  }
  const commit = () => {
    const n = parseInt(draft, 10)
    if (draft != null && Number.isFinite(n)) onChange(clamp(n))
    setDraft(null)
  }
  return (
    <div className="flex h-11 shrink-0 items-center rounded-xl border border-slate-300 dark:border-slate-700">
      <button
        onClick={() => step(-1)}
        disabled={value <= 1}
        aria-label="-1"
        className="grid h-full w-11 place-items-center text-lg font-bold text-slate-600 disabled:opacity-30 dark:text-slate-300"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={String(max).length}
        value={draft ?? String(value)}
        aria-label={label}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '')
          setDraft(raw)
          const n = parseInt(raw, 10)
          if (n >= 1 && n <= max) onChange(n)
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="h-full w-11 border-0 bg-transparent text-center text-sm font-bold tabular-nums focus:outline-none"
      />
      <button
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="+1"
        className="grid h-full w-11 place-items-center text-lg font-bold text-slate-600 disabled:opacity-30 dark:text-slate-300"
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
  canScore = false,
  courtOrder = new Map(),
  tag = null,
  onSwap = null,
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
        tag === 'now' ? 'ring-2 ring-brand-500/70' : open && 'ring-1 ring-brand-500/30',
        archived && !open && 'opacity-75'
      )}
    >
      <div className="flex items-center">
        <button
          onClick={onToggleOpen}
          className="flex min-w-0 flex-1 items-center gap-2 py-2.5 pl-3 text-left"
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
          {tag && !allDone && (
            <span
              className={cx(
                'shrink-0 rounded-full px-2 py-px text-[10.5px] font-bold',
                tag === 'now'
                  ? 'bg-brand-600 text-white'
                  : 'bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-200'
              )}
            >
              {t(tag === 'now' ? 'roundNow' : 'roundNext')}
            </span>
          )}
          {!open && (
            <span className="min-w-0 flex-1 truncate text-xs text-slate-400 dark:text-slate-500">
              {round.matches
                .map((m) =>
                  [...m.teamA, ...m.teamB]
                    .map((id) => playersById.get(id)?.name ?? '—')
                    .join(' ')
                )
                .join(' · ')}
            </span>
          )}
          <span className="ml-auto shrink-0 text-[11px] text-slate-400 tabular-nums dark:text-slate-500">
            {t('matchesDone', { a: doneCount, b: round.matches.length })}
          </span>
          <Chevron open={open} />
        </button>
        {open && onSwap && !allDone && (
          <button
            onClick={onSwap}
            className="press mr-2 ml-1 inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border-(length:--line-w) border-edge-strong bg-slate-50 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span aria-hidden>⇄</span>
            {t('swapButton')}
          </button>
        )}
      </div>

      {open && (
        <div className="space-y-2.5 px-3 pb-3">
          <div className="grid gap-2 md:grid-cols-2">
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
                readOnly={readOnly && !canScore}
                courtIndex={courtOrder.get(m.courtId) ?? 0}
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
                // plain names, like the seats above: no boxes to read past
                const chip =
                  'inline-flex h-8 items-center rounded-md px-1.5 text-sm font-medium text-slate-600 dark:text-slate-300'
                return readOnly ? (
                  <span key={id} className={chip}>
                    {p.name}
                  </span>
                ) : (
                  <button
                    key={id}
                    onClick={() => onTap({ bench: true, playerId: id })}
                    className={cx(
                      chip,
                      'transition active:scale-95',
                      isSel && 'bg-accent-100 ring-2 ring-accent-500 dark:bg-accent-900/40'
                    )}
                  >
                    {p.name}
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
