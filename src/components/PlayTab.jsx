import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  isAvailable,
  makeContext,
  playedRounds,
  rankPlayers,
  roundQuality,
  suggestRounds,
  totalCapacity,
} from '../lib/matchmaker'
import CostSplitSheet from './CostSplitSheet'
import MatchCard, { ScoreBox } from './MatchCard'
import CourtsideTV from './CourtsideTV'
import Solar from './Solar'
import ScheduleTable from './ScheduleTable'
import ImageSheet from './ImageSheet'
import { renderSchedulePng } from '../lib/exportImage'
import SwapSheet from './SwapSheet'
import { analyse } from './FairnessReport'
import HelpSheet from './HelpSheet'
import { rosterChange } from '../lib/roster'
import RoundAdvisor from './RoundAdvisor'
import Icon from './Icon'
import {
  Button,
  Card,
  Empty,
  ScreenTitle,
  Segmented,
  Sheet,
  StatTile,
  askConfirm,
  courtTone,
  cx,
} from './ui'

const MAX_AHEAD = 100
const SLOW_MS = 5000

export const DEFAULT_COUNTS = { preset: 5, customCount: 3, addCount: 1 }

const MODES = [
  ['balanced', 'modeBalanced'],
  ['random', 'modeRandom'],
  ['manual', 'modeManual'],
]

// a small round-ended tool on the ink scoreboard
const INK_CHIP =
  'press inline-flex h-11 items-center gap-1.5 rounded-full border border-slate-50/25 px-4 text-sm font-medium text-slate-50 hover:bg-slate-50/10 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none'

// a quiet bordered button for the ink cards, beside the lime one
const INK_BUTTON =
  'press inline-flex min-w-0 items-center justify-center rounded-xl border border-slate-50/30 px-4 text-sm font-medium whitespace-nowrap text-slate-50 hover:bg-slate-50/10 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none'

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
  // the scoreboard's score boxes, shown on demand: most nights only "done" is ticked
  const [scoring, setScoring] = useState(false)
  const [tvOpen, setTvOpen] = useState(false)
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
            playersUnit: t('playersUnit'),
            courtsUnit: t('courtsUnit'),
            roundsUnit: t('roundsUnit'),
          },
        })
      )
    } catch {
      setToast?.(t('exportFailed'), 'error')
    } finally {
      setExporting(false)
    }
  }
  // which rounds are open in the card view; undefined means the default: the
  // round being played and the one after it
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
  const courtsInPlay = state.courts.filter((c) => c.enabled !== false).length

  // the setup card's numbers: only worked out while there is no schedule yet
  const suggestion = useMemo(
    () =>
      hasRounds || readOnly
        ? null
        : suggestRounds({
            players: state.players,
            courts: state.courts,
            options: state.options,
            weights: state.weights,
          }),
    [hasRounds, readOnly, state.players, state.courts, state.options, state.weights]
  )

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
    const ok = await askConfirm({
      message: t('startOverConfirm', { n }),
      confirmLabel: t('cfStartOver', { n }),
    })
    if (!ok) return
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

  // the scoreboard: the round on court now, out of how many
  const total = state.rounds.length
  const nowRound = active[0]?.round
  const nowNumber = active[0]?.number ?? total
  const nowDone = nowRound ? nowRound.matches.filter((m) => m.done).length : 0
  const nextUp = active[1]
  // the ranking only matters once the planned rounds run out
  const showQueue = !readOnly && !nextUp && queue.length > capacity && capacity > 0
  const canTick = !readOnly || canScore
  const names = (ids, sep = ' · ') =>
    ids.map((id) => (id && playersById.get(id)?.name) || '—').join(sep)

  // the progress runs inside the button's place, so its label stays readable
  const busyBar = (
    <div className="flex gap-2">
      <div
        role="status"
        className="relative flex h-14 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-slate-50/10 px-3"
      >
        <div
          className={cx(
            'absolute inset-y-0 left-0 bg-slate-50/20 transition-[width] duration-150',
            progress?.phase === 'polish' && 'motion-safe:animate-pulse'
          )}
          style={{ width: progress ? `${(progress.done / progress.total) * 100}%` : '0%' }}
        />
        <span className="relative truncate text-sm font-semibold text-slate-50">
          {buttonLabel}
        </span>
      </div>
      <button type="button" className={cx(INK_BUTTON, 'h-14')} onClick={actions.cancelGenerate}>
        {t('cancel')}
      </button>
    </div>
  )

  const slowHint = busy && slow && (
    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-300">
      {t('slowHint')}
      <button
        type="button"
        onClick={() => goTo('settings')}
        className="min-h-11 font-semibold text-accent-300 underline-offset-2 hover:underline"
      >
        {t('slowHintLink')} →
      </button>
    </p>
  )

  // fair is the mode nearly every night; random and manual stay one tap away,
  // as plain text, so they do not compete with it. On ink before a schedule
  // exists; once there is one it is rare, so it moves down to the quiet end.
  const modePicker = (ink) => (
    <div className="grid grid-cols-[2fr_1fr_1fr] gap-1.5" role="group" aria-label={t('mode')}>
      {MODES.map(([value, key]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mode === value}
          onClick={() => actions.setOption('mode', value)}
          className={cx(
            'h-11 rounded-[var(--radius-pill)] text-sm transition active:scale-95',
            'focus-visible:ring-2 focus-visible:outline-none',
            ink ? 'focus-visible:ring-accent-400' : 'focus-visible:ring-brand-500',
            mode === value
              ? ink
                ? 'bg-slate-50 font-semibold text-slate-900'
                : 'bg-slate-900 font-semibold text-slate-50 dark:bg-slate-100 dark:text-slate-900'
              : value === 'balanced'
                ? ink
                  ? 'bg-slate-50/10 text-slate-50 hover:bg-slate-50/15'
                  : 'bg-slate-200/70 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                : ink
                  ? 'text-slate-300 hover:text-slate-50'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
          )}
        >
          {t(key)}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-4">
      <ScreenTitle
        title={t('tabPlay')}
        action={
          !readOnly && (
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label={t('help')}
              title={t('help')}
              className="font-display press grid h-11 w-11 place-items-center rounded-full border-(length:--line-w) border-edge-strong bg-slate-50 text-base text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              ?
            </button>
          )
        }
      />

      {/* ------------------------------------------------ setup: no schedule yet */}
      {!readOnly && !hasRounds && state.players.length > 0 && (
        <Card tone="ink" className="space-y-5 p-5">
          <div className="grid grid-cols-3 gap-3">
            <StatTile ink value={pool.length} label={t('v4StatReady')} />
            <StatTile ink value={courtsInPlay} label={t('v4StatCourts')} />
            <StatTile ink value={suggestion?.coverAll ?? '—'} label={t('v4StatCover')} />
          </div>

          {modePicker(true)}

          {mode !== 'manual' && (
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-slate-300">{t('howManyRounds')}</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 5, 10, 'custom'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={preset === p}
                    onClick={() => setPreset(p)}
                    className={cx(
                      'h-11 rounded-[var(--radius-pill)] text-sm tabular-nums transition active:scale-95',
                      'focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none',
                      preset === p
                        ? 'bg-preset font-semibold text-preset-ink shadow-[var(--shadow-pick)]'
                        : 'bg-slate-50/10 text-slate-100 hover:bg-slate-50/15'
                    )}
                  >
                    {p === 'custom' ? t('customCount') : `${p} ${t('roundsUnit')}`}
                  </button>
                ))}
              </div>
              {preset === 'custom' && (
                <Stepper
                  ink
                  value={customCount}
                  onChange={setCustomCount}
                  max={MAX_AHEAD}
                  label={t('roundsLabel')}
                />
              )}
            </div>
          )}

          {mode !== 'manual' && (
            <RoundAdvisor
              s={suggestion}
              state={state}
              t={t}
              actions={actions}
              onUse={(n) => {
                setPreset('custom')
                setCustomCount(n)
              }}
            />
          )}

          {busy ? (
            busyBar
          ) : (
            <Button variant="accent" size="lg" className="key w-full text-base" onClick={run}>
              {buttonLabel}
            </Button>
          )}
          {slowHint}
        </Card>
      )}

      {/* ------------------------------------------------ the scoreboard */}
      {hasRounds && (
        <Card tone="ink" className="overflow-hidden p-5">
          <CourtLines />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300">{t('round')}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <RollNumber value={nowNumber} className="text-[4.5rem] text-slate-50" />
                <span className="num text-2xl text-slate-300">/ {total}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 pt-1">
              {nowRound ? (
                <span className="live-badge text-xs font-bold">
                  <span className="live-dot" aria-hidden />
                  {t('roundNow')}
                </span>
              ) : (
                <span className="rounded-full bg-slate-50/10 px-2.5 py-1 text-xs font-bold text-slate-50">
                  <span aria-hidden>✓ </span>
                  {t('v4AllDone')}
                </span>
              )}
              {nowRound && (
                <span className="text-xs text-slate-300 tabular-nums">
                  {t('matchesDone', { a: nowDone, b: nowRound.matches.length })}
                </span>
              )}
            </div>
          </div>

          {/* finished rounds out of the session */}
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-50/15" aria-hidden>
            <div
              className="ease-snap h-full origin-left rounded-full bg-accent-400 transition-transform duration-300"
              style={{ transform: `scaleX(${total ? archived.length / total : 0})` }}
            />
          </div>

          {/* the round on court: run it from here, no scrolling to the table */}
          {nowRound && (
            <div className="mt-4 space-y-3">
              <CourtSide
                round={nowRound}
                number={nowNumber}
                playersById={playersById}
                t={t}
                courtOrder={courtOrder}
                scoring={scoring}
                canTick={canTick}
                onDone={(matchId) => {
                  // the last tick moves the scoreboard on, so offer the way back
                  const last = nowRound.matches.every((m) =>
                    m.id === matchId ? !m.done : m.done
                  )
                  onMatchDone(nowRound, matchId)
                  // a tap you can feel on Android; a longer double pulse closes the round
                  navigator.vibrate?.(last ? [12, 50, 18] : 8)
                  if (last)
                    setToast(t('v4RoundDoneN', { n: nowNumber }), 'info', {
                      label: t('undo'),
                      run: () => actions.toggleMatchDone(nowRound.id, matchId),
                    })
                }}
                onScore={(matchId, patch) => actions.updateMatch(nowRound.id, matchId, patch)}
              />

              {canTick && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setScoring((v) => !v)}
                    aria-pressed={scoring}
                    className={cx(
                      INK_CHIP,
                      scoring && 'bg-slate-50 text-slate-900 hover:bg-slate-50'
                    )}
                  >
                    {t('v4Scores')}
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => setSwapRoundId(nowRound.id)}
                      className={INK_CHIP}
                    >
                      <span aria-hidden>⇄</span>
                      {t('swapButton')}
                    </button>
                  )}
                  {/* opened straight from the tap: fullscreen needs the gesture */}
                  <button
                    type="button"
                    onClick={() => setTvOpen(true)}
                    aria-label={t('v4TvMode')}
                    title={t('v4TvMode')}
                    className={cx(INK_CHIP, 'ml-auto w-11 justify-center px-0')}
                  >
                    <Solar name="screen" className="h-5 w-5" />
                  </button>
                </div>
              )}

              {nowRound.benched.length > 0 && (
                <p className="text-xs text-slate-300">
                  <span className="font-semibold">{t('bench')}</span>{' '}
                  {nowRound.benched
                    .map((id) => playersById.get(id)?.name)
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}

              {/* the next round in the same columns as the one on court, so a
                  glance down a column reads "court 1 now, court 1 next";
                  dashed, since nobody is on it yet */}
              {nextUp && (
                <div className="border-t border-slate-50/10 pt-3">
                  <p className="flex items-baseline gap-2 px-1">
                    <span className="text-xs font-semibold text-slate-300">
                      {t('v4UpNext')}
                    </span>
                    <span className="num text-xl text-slate-50">{nextUp.number}</span>
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {nextUp.round.matches.map((m) => (
                      <li
                        key={m.id}
                        className="flex min-h-10 items-center gap-2 rounded-xl border border-dashed border-slate-50/20 py-1 pr-1.5 pl-2 text-sm"
                      >
                        <span
                          className={cx(
                            'font-display grid h-6 max-w-12 min-w-6 shrink-0 place-items-center truncate rounded-[var(--radius-pill)] px-1 text-xs',
                            courtTone(courtOrder.get(m.courtId) ?? 0)
                          )}
                          aria-hidden
                        >
                          {m.courtName}
                        </span>
                        <span className="sr-only">
                          {t('v4MatchCtx', { n: nextUp.number, court: m.courtName })}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium text-sky-200">
                          {names(m.teamA)}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">{t('vs')}</span>
                        <span className="min-w-0 flex-1 truncate text-right font-medium text-rose-200">
                          {names(m.teamB)}
                        </span>
                        {/* keeps the vs column under the one above, past the finish buttons */}
                        {canTick && <span className="w-11 shrink-0" aria-hidden />}
                      </li>
                    ))}
                  </ul>
                  {nextUp.round.benched.length > 0 && (
                    <p className="mt-2 px-1 text-xs text-slate-300">
                      <span className="font-semibold">{t('v4BenchNext')}</span>{' '}
                      {names(nextUp.round.benched, ', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {showQueue && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setQueueOpen((v) => !v)}
                aria-expanded={queueOpen}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
              >
                <span className="shrink-0 text-xs font-semibold text-slate-300">
                  {t('queueNext')}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-50">
                  {queue
                    .slice(0, capacity)
                    .map((q) => q.player.name)
                    .join(' · ')}
                </span>
                <Chevron open={queueOpen} ink />
              </button>
              {queueOpen && (
                <ol className="animate-pop mt-1 flex flex-wrap gap-1.5">
                  {queue.map((q, i) => (
                    <li
                      key={q.player.id}
                      className={cx(
                        'inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm',
                        i < capacity
                          ? 'bg-slate-50/15 font-semibold text-slate-50'
                          : 'text-slate-300'
                      )}
                    >
                      <span className="text-xs font-normal text-slate-300 tabular-nums">
                        {i + 1}
                      </span>
                      {q.player.name}
                      <span className="text-xs font-normal text-slate-300 tabular-nums">
                        {q.games}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}

          {!readOnly && (
            <div className="mt-5 space-y-3 border-t border-slate-50/10 pt-4">
              {busy ? (
                busyBar
              ) : mode === 'manual' ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="accent" className="key h-12 min-w-0" onClick={run}>
                    {buttonLabel}
                  </Button>
                  <button type="button" className={cx(INK_BUTTON, 'h-12')} onClick={reshuffle}>
                    {t('regenerate')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-slate-300">
                      {t('v4AddHowMany')}
                    </span>
                    <Stepper
                      ink
                      value={addCount}
                      onChange={setAddCount}
                      max={MAX_AHEAD}
                      label={t('roundsLabel')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="accent" className="key h-12 min-w-0" onClick={run}>
                      {buttonLabel}
                    </Button>
                    <button
                      type="button"
                      className={cx(INK_BUTTON, 'h-12')}
                      onClick={reshuffle}
                    >
                      {t(played > 0 ? 'redoRemainingShort' : 'redoAllShort')}
                    </button>
                  </div>
                </>
              )}
              {slowHint}
            </div>
          )}
        </Card>
      )}

      {/* ------------------------------------------------ the group changed */}
      {change && !busy && (
        <Card className="flex flex-wrap items-center gap-x-3 gap-y-3 p-4">
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-semibold text-slate-900 dark:text-slate-50">
              {t('rosterChangedTitle')}
            </span>
            <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
              {[
                change.gone.length && t('rosterGone', { names: namesOf(change.gone) }),
                change.arrived.length && t('rosterArrived', { names: namesOf(change.arrived) }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
          </span>
          <Button
            variant="primary"
            className="shrink-0"
            onClick={() => reshuffleRemaining(Math.max(1, change.upcoming))}
          >
            {t('redoRemainingN', { n: change.upcoming })}
          </Button>
        </Card>
      )}

      {/* pinned so selecting a name never reflows the courts under the thumb */}
      {!readOnly && sel && (
        <div className="fixed inset-x-0 bottom-16 z-30 flex justify-center px-4 md:bottom-6">
          <div className="animate-pop flex max-w-sm items-center gap-3 rounded-2xl bg-slate-900 py-1.5 pr-1.5 pl-4 text-sm font-medium text-slate-50 shadow-lg dark:bg-slate-700">
            <span className="min-w-0 flex-1">
              {selName ? t('swapHintNamed', { name: selName }) : t('swapHint')}
            </span>
            <button
              type="button"
              onClick={() => setSel(null)}
              className="h-11 shrink-0 rounded-xl bg-slate-50/15 px-3 text-sm font-semibold text-accent-300 transition active:scale-95"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------ rounds */}
      {!hasRounds ? (
        (readOnly || state.players.length === 0) && (
          <Card>
            <Empty
              icon="shuttle"
              title={t('noRounds')}
              hint={state.players.length === 0 ? t('noPlayersHint') : t('noRoundsHint')}
              action={
                !readOnly && state.players.length === 0 ? (
                  <Button variant="primary" onClick={() => goTo('players')}>
                    + {t('addPlayer')}
                  </Button>
                ) : null
              }
            />
          </Card>
        )
      ) : (
        <div className="space-y-4">
          {/* what the organiser does once the plan is made: send it out. The
              image is what goes to LINE, so it leads */}
          <div className="flex gap-2">
            <ShareTile
              primary
              onClick={onExport}
              disabled={exporting}
              icon={<Solar name="download" />}
              label={exporting ? t('exporting') : t('exportImageShort')}
            />
            {!readOnly && onLive && (
              <ShareTile
                live={liveOn}
                onClick={onLive}
                icon={
                  liveOn ? (
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500 motion-safe:animate-pulse"
                      aria-hidden
                    />
                  ) : (
                    <Solar name="share" />
                  )
                }
                label={t(liveOn ? 'liveButtonOn' : 'liveButton')}
              />
            )}
            {!readOnly && (
              <ShareTile
                onClick={() => setSplitOpen(true)}
                icon={<Solar name="wallet" />}
                label={t('splitButton')}
              />
            )}
          </div>

          {!readOnly && !busy && covered && (
            <button
              type="button"
              onClick={() => goTo('stats')}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-2xl px-4 py-2 text-left text-sm hover:bg-slate-200/60 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none dark:hover:bg-slate-800/60"
            >
              <span
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs text-white"
                aria-hidden
              >
                ✓
              </span>
              <span className="min-w-0 flex-1 text-slate-700 dark:text-slate-300">
                {t('coveredHint')}
              </span>
              <span className="shrink-0 font-semibold text-brand-700 dark:text-brand-300">
                {t('coveredLink')} →
              </span>
            </button>
          )}

          {/* how to look at it: the view, and in the table the two checking aids */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Segmented
              className="min-w-[12rem] flex-1"
              options={[
                { value: 'table', label: t('viewTable') },
                { value: 'cards', label: t('viewCards') },
              ]}
              value={view}
              onChange={setView}
            />
            {view === 'table' &&
              [
                [showLevels, setShowLevels, 'showLevels'],
                [showStamina, setShowStamina, 'showStamina'],
              ].map(([on, set, key]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set((v) => !v)}
                  aria-pressed={on}
                  className={cx(
                    'h-11 shrink-0 rounded-[var(--radius-pill)] border-(length:--line-w) px-2.5 text-xs font-medium whitespace-nowrap transition',
                    'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
                    on
                      ? 'border-btn-edge bg-chip text-chip-ink'
                      : 'border-edge-strong bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
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
              staminaLimit={state.options.maxConsecutive}
              showLevels={showLevels}
              showStamina={showStamina}
              onToggleDone={readOnly && !canScore ? undefined : onMatchDone}
            />
          ) : (
            <div className="space-y-3">
              {active.map((x) => (
                <RoundCard key={x.round.id} {...roundProps(x)} />
              ))}

              {archived.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setArchiveOpen((v) => !v)}
                    aria-expanded={archiveOpen}
                    className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-4 text-left hover:bg-slate-200/60 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none dark:hover:bg-slate-800/60"
                  >
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs text-white"
                      aria-hidden
                    >
                      ✓
                    </span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {t('archived')} · {archived.length}
                    </span>
                    <span className="ml-auto">
                      <Chevron open={archiveOpen} />
                    </span>
                  </button>

                  {/* folds open from its header; out of the tab order while shut */}
                  <div
                    inert={!archiveOpen}
                    className={cx(
                      'ease-snap grid transition-[grid-template-rows] duration-300 motion-reduce:transition-none',
                      archiveOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    )}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="space-y-3 pt-2">
                        {archived.map((x) => (
                          <RoundCard key={x.round.id} {...roundProps(x)} archived />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* the rare thing sits at the end, away from the buttons used every night */}
          {!readOnly && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={async () => {
                  const ok = await askConfirm({
                    message: t('clearRoundsConfirm'),
                    confirmLabel: t('cfClearRounds'),
                  })
                  if (ok) actions.clearRounds()
                }}
                className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm text-rose-800 transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none dark:text-rose-300 dark:hover:bg-rose-950/40"
              >
                <Icon name="trash" />
                {t('clearRounds')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------ sheets */}
      {!readOnly && <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} t={t} />}
      {!readOnly && swapRoundId && (
        <SwapSheet
          round={state.rounds.find((r) => r.id === swapRoundId)}
          number={state.rounds.findIndex((r) => r.id === swapRoundId) + 1}
          playersById={playersById}
          t={t}
          onSwap={(a, b) => doSwap(swapRoundId, a, b)}
          onClose={() => setSwapRoundId(null)}
        />
      )}
      {!readOnly && (
        <Sheet
          open={reshuffleOpen}
          onClose={() => setReshuffleOpen(false)}
          title={t('regenerate')}
        >
          <div className="space-y-3">
            {/* the mode lives with re-planning: it only changes rounds still to be made */}
            <div className="space-y-2 border-b border-edge pb-4">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                {t('mode')}
              </p>
              {modePicker(false)}
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t(
                  mode === 'random'
                    ? 'modeRandomDesc'
                    : mode === 'manual'
                      ? 'modeManualDesc'
                      : 'modeBalancedDesc'
                )}
              </p>
            </div>
            {mode === 'manual' ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('v4ManualReplan')}
              </p>
            ) : (
              <>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {played > 0 ? t('reshuffleIntro', { played }) : t('reshuffleIntroFresh')}
                </p>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800/60">
                  <span className="text-sm">
                    {played > 0
                      ? t('reshuffleHowMany', { played })
                      : t('reshuffleHowManyFresh')}
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
                  <span className="text-xs font-normal whitespace-normal opacity-90">
                    {played > 0 ? t('reshuffleRemainingHint') : t('reshuffleAllHint')}
                  </span>
                </Button>
                {played > 0 && (
                  <>
                    <div
                      className="flex items-center gap-3 py-1 text-xs text-slate-600 dark:text-slate-400"
                      aria-hidden
                    >
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
                      <span className="text-xs font-normal whitespace-normal opacity-90">
                        {t('startOverHint')}
                      </span>
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </Sheet>
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
      {tvOpen && (
        <CourtsideTV
          state={state}
          playersById={playersById}
          t={t}
          onClose={() => setTvOpen(false)}
          onMatchDone={canTick ? onMatchDone : undefined}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------- sub-views */

/** A badminton court seen from the stands, drawn faint behind the scoreboard. */
const CourtLines = () => (
  <svg
    viewBox="0 0 400 220"
    className="court-lines"
    fill="none"
    stroke="currentColor"
    aria-hidden
  >
    {/* to scale: doubles and singles sidelines, net, short and long service lines, centre line */}
    <path d="M70 210 L130 30 H330 L390 210 Z" strokeWidth="3" />
    <path d="M94 210 L145 30 M366 210 L315 30" strokeWidth="2" />
    <path d="M100 120 H360" strokeWidth="4" />
    <path d="M91 147 H369 M109 93 H351" strokeWidth="2" />
    <path d="M73 200 H387 M127 40 H333" strokeWidth="1.5" />
    <path d="M230 210 V147 M230 93 V30" strokeWidth="2" />
  </svg>
)

/**
 * The scoreboard's round number: a new round rolls up into its slot like a
 * flip-board digit, an undo rolls back down. WAAPI, so it is a one-off on the
 * compositor and needs no keyframes; nothing moves under reduced motion.
 */
function RollNumber({ value, className }) {
  const ref = useRef(null)
  const prev = useRef(value)
  useLayoutEffect(() => {
    const from = prev.current
    prev.current = value
    if (from === value || !ref.current?.animate) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const dir = value > from ? 1 : -1
    ref.current.animate(
      [
        { transform: `translateY(${dir * 70}%)`, opacity: 0 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }
    )
  }, [value])
  return (
    <span className="inline-block overflow-hidden pr-1">
      <span ref={ref} className={cx('num inline-block', className)}>
        {value}
      </span>
    </span>
  )
}

/**
 * The round on court, one row per court, drawn on the ink scoreboard: who
 * plays whom, its finish button and, when asked for, the score boxes. Each
 * finish button names its court ("Finish court 1"), so it never reads as the
 * table's plain "Finish". Rows rise in one after another when a new round
 * takes the courts; the round number pops above them.
 */
function CourtSide({
  round,
  number,
  playersById,
  t,
  courtOrder,
  scoring,
  canTick,
  onDone,
  onScore,
}) {
  // a finished court dims its names only, so its tick stays bright; the rows'
  // stagger fills backwards only, since a held end state would pin opacity
  const side = (ids, team, done) => (
    <span
      className={cx(
        'min-w-0 flex-1 text-sm leading-tight font-semibold transition-opacity duration-200',
        done && 'opacity-60',
        team === 'A' ? 'text-sky-200' : 'text-right text-rose-200'
      )}
    >
      {ids.map((id, i) => (
        <span key={i} className="block truncate">
          {(id && playersById.get(id)?.name) || '—'}
        </span>
      ))}
    </span>
  )
  return (
    <ul className="space-y-2">
      {round.matches.map((m, i) => (
        <li
          key={m.id}
          className={cx(
            'animate-pop flex min-h-14 items-center gap-2 rounded-2xl bg-slate-50/[0.07] py-1.5 pr-1.5 pl-2'
          )}
          style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' }}
        >
          <span
            className={cx(
              'font-display grid h-7 max-w-12 min-w-7 shrink-0 place-items-center truncate rounded-[var(--radius-pill)] px-1.5 text-xs',
              courtTone(courtOrder.get(m.courtId) ?? 0)
            )}
            aria-hidden
          >
            {m.courtName}
          </span>
          <span className="sr-only">{t('v4MatchCtx', { n: number, court: m.courtName })}</span>
          {side(m.teamA, 'A', m.done)}
          {scoring ? (
            <span className="flex shrink-0 items-center gap-1">
              <ScoreBox
                ink
                side="A"
                t={t}
                value={m.scoreA}
                disabled={!canTick}
                onChange={(v) => onScore(m.id, { scoreA: v })}
              />
              <ScoreBox
                ink
                side="B"
                t={t}
                value={m.scoreB}
                disabled={!canTick}
                onChange={(v) => onScore(m.id, { scoreB: v })}
              />
            </span>
          ) : (
            <span className="shrink-0 text-xs text-slate-400">{t('vs')}</span>
          )}
          {side(m.teamB, 'B', m.done)}
          {canTick && (
            <button
              type="button"
              onClick={() => onDone(m.id)}
              aria-pressed={m.done}
              aria-label={t(m.done ? 'v4ReopenCourt' : 'v4FinishCourt', { court: m.courtName })}
              className={cx(
                'key grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold',
                'focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none',
                m.done
                  ? 'bg-accent-500 text-on-accent'
                  : 'border-2 border-accent-400 text-accent-300 hover:bg-accent-400/15'
              )}
            >
              {m.done ? (
                <svg
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  aria-hidden
                >
                  <path d="m5 10.5 3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                t('finishShort')
              )}
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}

function Chevron({ open, ink = false }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cx(
        'ease-snap h-5 w-5 shrink-0 transition-transform duration-200',
        ink ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400',
        open && 'rotate-180'
      )}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** An icon over a label; the name is the label alone, so tests and readers see "Share". */
function ShareTile({ icon, label, onClick, disabled, primary = false, live = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'press flex h-[4.5rem] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl border-(length:--line-w) px-2 text-sm font-medium',
        'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none dark:focus-visible:ring-offset-slate-950',
        'disabled:opacity-60',
        primary
          ? 'flex-[1.6] border-btn-edge bg-brand-600 text-white hover:bg-brand-700'
          : live
            ? 'flex-1 border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100'
            : 'flex-1 border-edge-strong bg-slate-50 text-slate-900 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
      )}
    >
      <span className="grid h-6 place-items-center">{icon}</span>
      <span className="max-w-full truncate">{label}</span>
    </button>
  )
}

/**
 * −/+ with a typable box, so 1 round is one tap and 37 rounds is possible.
 *
 * The box keeps its own draft text: clamping on every keystroke made it
 * impossible to clear (backspace snapped back to 1) and impossible to type
 * 20 (1 → 12 → 100). The parent only hears about whole, in-range numbers, and
 * whatever is left in the box gets tidied up on blur. `ink` draws it for the
 * dark scoreboard cards.
 */
function Stepper({ value, onChange, max, label, ink = false }) {
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
  const btn = cx(
    'grid h-full w-11 place-items-center rounded-xl text-lg font-bold disabled:opacity-30',
    'focus-visible:ring-2 focus-visible:outline-none',
    ink
      ? 'text-slate-50 focus-visible:ring-accent-400'
      : 'text-slate-600 focus-visible:ring-brand-500 dark:text-slate-300'
  )
  return (
    <div
      className={cx(
        // the typed box shows its focus on the whole stepper
        'flex h-11 shrink-0 items-center rounded-xl border has-[input:focus]:ring-2',
        ink
          ? 'border-slate-50/25 text-slate-50 has-[input:focus]:ring-accent-400'
          : 'border-slate-300 has-[input:focus]:ring-brand-500 dark:border-slate-700'
      )}
    >
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= 1}
        aria-label="-1"
        className={btn}
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
        className="num h-full w-12 border-0 bg-transparent text-center text-lg focus:outline-none"
      />
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="+1"
        className={btn}
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
  // the round on court wears an ink header with the live badge
  const now = tag === 'now' && !allDone
  const headId = `round-${round.id}`

  return (
    <Card className="animate-pop overflow-hidden">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={open}
        className={cx(
          'flex min-h-14 w-full items-center gap-3 px-4 text-left',
          'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none focus-visible:ring-inset',
          now && 'bg-slate-900 text-slate-50 dark:bg-slate-800'
        )}
      >
        {/* label before the number: Thai reads "รอบที่ 6", not "6 รอบที่" */}
        <span id={headId} className="flex shrink-0 items-baseline gap-1.5">
          <span
            className={cx(
              'text-xs font-medium',
              now ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
            )}
          >
            {t('round')}
          </span>
          <span className="num text-2xl">{number}</span>
        </span>
        {allDone && (
          <span
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs text-white"
            role="img"
            aria-label={t('v4MatchFinished')}
          >
            <span aria-hidden>✓</span>
          </span>
        )}
        {tag && !allDone && (
          <span
            className={cx(
              'shrink-0 text-xs font-bold',
              tag === 'now'
                ? 'live-badge'
                : 'rounded-full bg-accent-100 px-2 py-0.5 text-accent-800 dark:bg-accent-900/50 dark:text-accent-200'
            )}
          >
            {tag === 'now' && <span className="live-dot" aria-hidden />}
            {t(tag === 'now' ? 'roundNow' : 'roundNext')}
          </span>
        )}
        {!open && (
          <span
            className={cx(
              'min-w-0 flex-1 truncate text-xs',
              now ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
            )}
          >
            {round.matches
              .map((m) =>
                [...m.teamA, ...m.teamB].map((id) => playersById.get(id)?.name ?? '—').join(' ')
              )
              .join(' · ')}
          </span>
        )}
        <span
          className={cx(
            'ml-auto shrink-0 text-xs tabular-nums',
            now ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
          )}
        >
          {t('matchesDone', { a: doneCount, b: round.matches.length })}
        </span>
        <Chevron open={open} ink={now} />
      </button>

      {open && (
        <div className="space-y-3 p-3">
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
                context={t('v4MatchCtx', { n: number, court: m.courtName })}
              />
            ))}
          </div>

          {hasEmpty && !readOnly && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => actions.fillRound(round.id)}
            >
              {t('autoFill')}
            </Button>
          )}

          {round.benched.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-1 px-1">
              <span className="mr-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {t('bench')}
              </span>
              {round.benched.map((id) => {
                const p = playersById.get(id)
                if (!p) return null
                const isSel = !!sel?.bench && sel.playerId === id
                // plain names, like the seats above: no boxes to read past
                const chip =
                  'inline-flex h-11 items-center rounded-lg px-2 text-sm font-medium text-slate-700 dark:text-slate-300'
                return readOnly ? (
                  <span key={id} className={chip}>
                    {p.name}
                  </span>
                ) : (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onTap({ bench: true, playerId: id })}
                    aria-pressed={isSel}
                    className={cx(
                      chip,
                      'transition active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
                      isSel && 'bg-accent-100 ring-2 ring-accent-500 dark:bg-accent-900/40'
                    )}
                  >
                    {p.name}
                  </button>
                )
              })}
            </div>
          )}

          {quality?.matches > 0 && (
            <p className="px-1 text-xs text-slate-600 dark:text-slate-400">
              {t('qRepeatPartner')} {quality.repeatPartners} · {t('qRepeatOpp')}{' '}
              {quality.repeatOpponents} · {t('qGap')} {quality.maxGap}
            </p>
          )}

          {!readOnly && (
            <div className="flex items-center gap-2">
              {onSwap && !allDone && (
                <Button variant="outline" onClick={onSwap}>
                  <span aria-hidden>⇄</span>
                  {t('swapButton')}
                </Button>
              )}
              <button
                type="button"
                onClick={async () => {
                  const ok = await askConfirm({
                    message: t('deleteRoundConfirm'),
                    confirmLabel: t('cfDeleteRound'),
                  })
                  if (ok) actions.deleteRound(round.id)
                }}
                aria-describedby={headId}
                className="ml-auto inline-flex h-11 items-center rounded-xl px-3 text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-rose-950/50 dark:hover:text-rose-300"
              >
                {t('deleteRound')}
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
