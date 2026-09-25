import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CourtsTab from './components/CourtsTab'
import PlayTab from './components/PlayTab'
import PlayersTab from './components/PlayersTab'
import SettingsTab from './components/SettingsTab'
import ShareSheet from './components/ShareSheet'
import StatsTab from './components/StatsTab'
import { Button, Toast, cx } from './components/ui'
import { makeT } from './lib/i18n'
import {
  DEFAULT_LEVEL,
  createEmptyRound,
  fillRound as fillRoundFn,
  generateRoundsAsync,
  makeContext,
  swapSlots,
  uid,
} from './lib/matchmaker'
import { clearShareHash, decodeShare, readShareHash } from './lib/share'
import { clearState, defaultState, loadState, saveState } from './lib/storage'

/* ------------------------------------------------------------------ icons */

const Icon = ({ d, className = '' }) => (
  <svg
    viewBox="0 0 24 24"
    className={cx('h-5 w-5', className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {d}
  </svg>
)

const ICONS = {
  play: (
    <Icon
      d={
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
          <circle cx="8" cy="7" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="10" cy="17" r="1.6" />
        </>
      }
    />
  ),
  players: (
    <Icon
      d={
        <>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 20a6 6 0 0 1 12 0" />
          <path d="M16.5 11.5a3 3 0 1 0-1.8-5.4" />
          <path d="M17 20a5.6 5.6 0 0 0-1.6-4" />
        </>
      }
    />
  ),
  courts: (
    <Icon
      d={
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M12 4v16M3 9h18M3 15h18" />
        </>
      }
    />
  ),
  stats: (
    <Icon
      d={
        <>
          <path d="M5 20V10M12 20V4M19 20v-6" />
        </>
      }
    />
  ),
  settings: (
    <Icon
      d={
        <>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4m0-12.8-1.4 1.4m-10 10-1.4 1.4" />
        </>
      }
    />
  ),
}

const TABS = [
  { key: 'play', labelKey: 'tabPlay' },
  { key: 'players', labelKey: 'tabPlayers' },
  { key: 'courts', labelKey: 'tabCourts' },
  { key: 'stats', labelKey: 'tabStats' },
  { key: 'settings', labelKey: 'tabSettings' },
]

/* ----------------------------------------------------------------- header */

function Header({ t, state, actions, readyCount, roundCount, shared = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-chrome-edge bg-chrome/90 backdrop-blur-md dark:border-slate-800 dark:bg-chrome-dark/90">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <span className="text-xl" aria-hidden>
          🏸
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base leading-tight font-bold">{t('appName')}</h1>
          {!shared && (
            <p className="truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">
              {readyCount} {t('playersUnit')} · {roundCount} {t('roundsUnit')}
            </p>
          )}
        </div>
        <button
          onClick={() => actions.set({ lang: state.lang === 'th' ? 'en' : 'th' })}
          className="h-8 rounded-lg border border-chrome-edge bg-slate-50/60 px-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
          aria-label={t('language')}
        >
          {state.lang === 'th' ? 'TH' : 'EN'}
        </button>
        <button
          onClick={() => actions.set({ theme: state.theme === 'dark' ? 'light' : 'dark' })}
          className="grid h-8 w-8 place-items-center rounded-lg border border-chrome-edge bg-slate-50/60 text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
          aria-label={t('theme')}
          title={t(state.theme === 'dark' ? 'themeDark' : 'themeLight')}
        >
          {state.theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------- app */

export default function App() {
  const [state, setState] = useState(loadState)
  const [tab, setTab] = useState('play')
  const [toast, setToastState] = useState(null)
  const toastTimer = useRef(null)
  const [shareOpen, setShareOpen] = useState(false)
  // a session that arrived through a link — held apart from the user's own data
  // so opening someone else's schedule can never clobber it
  const [shared, setShared] = useState(null)

  const t = useMemo(() => makeT(state.lang), [state.lang])

  // Round generation needs the freshest state *outside* a setState updater,
  // because it can fail and raise a toast — updaters have to stay pure.
  const stateRef = useRef(state)
  stateRef.current = state
  const cancelRef = useRef(false)

  /* ----------------------------------------------------------- persistence */
  useEffect(() => {
    saveState(state)
  }, [state])

  /* ------------------------------------------------------- incoming link */
  useEffect(() => {
    // Also on hashchange, not just on boot: pasting a share link into an app
    // that is already open changes nothing but the fragment, so the browser
    // never reloads and a mount-only listener would miss it entirely.
    const open = () => {
      const link = readShareHash()
      if (!link) return
      decodeShare(link.payload)
        .then((session) => setShared({ session, mode: link.mode }))
        .catch(() => {
          clearShareHash()
          // drop back to the user's own data rather than stranding them in
          // whatever shared session happened to be on screen before
          setShared(null)
          setToastState({
            message: makeT(stateRef.current.lang)('shareBroken'),
            tone: 'error',
          })
        })
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [])

  /* ----------------------------------------------------------------- theme */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  useEffect(() => {
    document.documentElement.lang = state.lang
  }, [state.lang])

  /* ----------------------------------------------------------------- toast */
  const setToast = useCallback((message, tone = 'info') => {
    clearTimeout(toastTimer.current)
    setToastState({ message, tone })
    toastTimer.current = setTimeout(() => setToastState(null), 2600)
  }, [])

  /* --------------------------------------------------------------- derived */
  const playersById = useMemo(
    () => new Map(state.players.map((p) => [p.id, p])),
    [state.players]
  )

  const stats = useMemo(
    () => makeContext(state.players, state.rounds).stats,
    [state.players, state.rounds]
  )

  /* --------------------------------------------------------------- actions */
  const actions = useMemo(() => {
    const patchRound = (roundId, fn) =>
      setState((s) => ({
        ...s,
        rounds: s.rounds.map((r) => (r.id === roundId ? fn(r) : r)),
      }))

    return {
      set: (patch) => setState((s) => ({ ...s, ...patch })),
      replaceState: (next) => setState(next),

      setOption: (key, value) =>
        setState((s) => ({ ...s, options: { ...s.options, [key]: value } })),
      setWeight: (key, value) =>
        setState((s) => ({ ...s, weights: { ...s.weights, [key]: value } })),

      /* ---- players ---- */
      addPlayers: (names) =>
        setState((s) => ({
          ...s,
          players: [
            ...s.players,
            ...names.map((name) => ({
              id: uid(),
              name,
              level: DEFAULT_LEVEL,
              gender: '-',
              active: true,
              resting: false,
            })),
          ],
        })),
      updatePlayer: (id, patch) =>
        setState((s) => ({
          ...s,
          players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),
      removePlayer: (id) =>
        setState((s) => {
          // keep the record (hidden) when past rounds still refer to them, so
          // the schedule never shows a blank name
          const used = s.rounds.some(
            (r) =>
              r.benched.includes(id) ||
              r.matches.some((m) => [...m.teamA, ...m.teamB].includes(id))
          )
          return {
            ...s,
            players: used
              ? s.players.map((p) =>
                  p.id === id ? { ...p, deleted: true, active: false, resting: false } : p
                )
              : s.players.filter((p) => p.id !== id),
          }
        }),
      /* ---- saved rosters ---- */
      saveRoster: (name) =>
        setState((s) => ({
          ...s,
          rosters: [
            {
              id: uid(),
              name,
              savedAt: Date.now(),
              // only the durable facts: who they are and how they play.
              // Attendance and rest flags belong to a single session.
              players: s.players
                .filter((p) => !p.deleted)
                .map((p) => ({ name: p.name, level: p.level, gender: p.gender })),
            },
            ...s.rosters,
          ],
        })),

      renameRoster: (id, name) =>
        setState((s) => ({
          ...s,
          rosters: s.rosters.map((r) => (r.id === id ? { ...r, name } : r)),
        })),

      deleteRoster: (id) =>
        setState((s) => ({ ...s, rosters: s.rosters.filter((r) => r.id !== id) })),

      /**
       * `replace` swaps the whole roster in (and drops the schedule, which
       * refers to players who are about to disappear); `append` just adds the
       * names that are not already here — the late arrivals from another group.
       */
      loadRoster: (id, mode = 'replace') =>
        setState((s) => {
          const roster = s.rosters.find((r) => r.id === id)
          if (!roster) return s
          const make = (p) => ({
            id: uid(),
            name: p.name,
            level: p.level ?? DEFAULT_LEVEL,
            gender: p.gender ?? '-',
            active: true,
            resting: false,
          })
          if (mode === 'append') {
            const here = new Set(s.players.filter((p) => !p.deleted).map((p) => p.name))
            const extra = roster.players.filter((p) => !here.has(p.name)).map(make)
            return { ...s, players: [...s.players, ...extra] }
          }
          return { ...s, players: roster.players.map(make), rounds: [] }
        }),

      /** Players and the schedule go together — a schedule without its players
       *  would render as a grid of blanks, so this clears both. */
      clearPlayers: () => setState((s) => ({ ...s, players: [], rounds: [] })),

      markAllPresent: () =>
        setState((s) => ({
          ...s,
          players: s.players.map((p) =>
            p.deleted ? p : { ...p, active: true, resting: false }
          ),
        })),

      /* ---- courts ---- */
      addCourt: () =>
        setState((s) => ({
          ...s,
          courts: [
            ...s.courts,
            {
              id: uid(),
              name: String(s.courts.length + 1),
              type: 'doubles',
              enabled: true,
            },
          ],
        })),
      updateCourt: (id, patch) =>
        setState((s) => ({
          ...s,
          courts: s.courts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      removeCourt: (id) =>
        setState((s) => ({
          ...s,
          courts: s.courts.filter((c) => c.id !== id),
        })),

      /* ---- rounds ---- */
      generate: async (count, onProgress) => {
        const s = stateRef.current
        cancelRef.current = false
        const res = await generateRoundsAsync({
          players: s.players,
          courts: s.courts,
          rounds: s.rounds,
          weights: s.weights,
          options: s.options,
          count,
          onProgress,
          shouldCancel: () => cancelRef.current,
        })
        if (res.error && !res.created.length) {
          setToast(t(res.error === 'no_courts' ? 'errNoCourts' : 'errNotEnough'), 'error')
          return
        }
        if (!res.created.length) return
        setState((prev) => ({
          ...prev,
          rounds: [...prev.rounds, ...res.created],
        }))
      },

      /** Throws the whole schedule away and builds a fresh one the same length. */
      regenerate: async (count, onProgress) => {
        const s = stateRef.current
        cancelRef.current = false
        const res = await generateRoundsAsync({
          players: s.players,
          courts: s.courts,
          rounds: [],
          weights: s.weights,
          options: s.options,
          count,
          onProgress,
          shouldCancel: () => cancelRef.current,
        })
        if (res.error && !res.created.length) {
          setToast(t(res.error === 'no_courts' ? 'errNoCourts' : 'errNotEnough'), 'error')
          return
        }
        // a cancel before the very first round produced nothing — keep what was there
        if (!res.created.length) return
        setState((prev) => ({ ...prev, rounds: res.created }))
      },

      cancelGenerate: () => {
        cancelRef.current = true
      },

      newEmptyRound: () => {
        const s = stateRef.current
        const res = createEmptyRound({ players: s.players, courts: s.courts })
        if (res.error) {
          setToast(t('errNoCourts'), 'error')
          return
        }
        setState((prev) => ({ ...prev, rounds: [...prev.rounds, res.round] }))
      },

      fillRound: (roundId) => {
        const s = stateRef.current
        const round = s.rounds.find((r) => r.id === roundId)
        if (!round) return
        const res = fillRoundFn({
          round,
          players: s.players,
          courts: s.courts,
          rounds: s.rounds,
          weights: s.weights,
          options: s.options,
        })
        setState((prev) => ({
          ...prev,
          rounds: prev.rounds.map((r) => (r.id === roundId ? res.round : r)),
        }))
      },

      swapInRound: (roundId, a, b) => patchRound(roundId, (r) => swapSlots(r, a, b)),

      updateMatch: (roundId, matchId, patch) =>
        patchRound(roundId, (r) => ({
          ...r,
          matches: r.matches.map((m) => (m.id === matchId ? { ...m, ...patch } : m)),
        })),

      toggleMatchDone: (roundId, matchId) =>
        patchRound(roundId, (r) => ({
          ...r,
          matches: r.matches.map((m) => (m.id === matchId ? { ...m, done: !m.done } : m)),
        })),

      deleteRound: (roundId) =>
        setState((s) => ({
          ...s,
          rounds: s.rounds.filter((r) => r.id !== roundId),
        })),

      clearRounds: () => setState((s) => ({ ...s, rounds: [] })),

      resetAll: () => {
        clearState()
        setState((s) => ({ ...defaultState(), lang: s.lang, theme: s.theme }))
      },
    }
  }, [setToast, t])

  const goTo = useCallback((key) => {
    setTab(key)
    window.scrollTo({ top: 0 })
  }, [])

  const roundCount = state.rounds.length
  const readyCount = state.players.filter((p) => p.active !== false && !p.resting).length

  /** Copies a shared schedule onto this device, replacing whatever was here. */
  const adoptShared = () => {
    const hasOwn = state.players.length > 0 || state.rounds.length > 0
    if (hasOwn && !confirm(t('adoptConfirm'))) return
    const { players, courts, rounds } = shared.session
    setState((s) => ({ ...s, players, courts, rounds }))
    clearShareHash()
    setShared(null)
    setTab('play')
  }

  const exitShared = () => {
    clearShareHash()
    setShared(null)
  }

  /* --------------------------------------------------- shared-link view */
  if (shared) {
    const sharedState = {
      ...state,
      players: shared.session.players,
      courts: shared.session.courts,
      rounds: shared.session.rounds,
    }
    const sharedById = new Map(shared.session.players.map((p) => [p.id, p]))

    return (
      <div className="min-h-dvh">
        <Header t={t} state={state} actions={actions} readyCount={0} roundCount={0} shared />

        <div className="mx-auto max-w-3xl px-3 pt-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent-300 bg-accent-50 p-3 dark:border-accent-800 dark:bg-accent-950/40">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-accent-900 dark:text-accent-100">
                🔗 {t('sharedView')}
              </p>
              <p className="text-xs text-accent-800/80 dark:text-accent-200/80">
                {t(shared.mode === 'edit' ? 'sharedEditHint' : 'sharedViewHint')}
                {shared.session.createdAt
                  ? ` · ${new Date(shared.session.createdAt).toLocaleDateString()}`
                  : ''}
              </p>
            </div>
            <Button
              variant={shared.mode === 'edit' ? 'primary' : 'outline'}
              size="sm"
              onClick={adoptShared}
            >
              {t(shared.mode === 'edit' ? 'adopt' : 'saveAsMine')}
            </Button>
            <Button size="sm" onClick={exitShared}>
              {t('exitShare')}
            </Button>
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-3 pt-3 pb-10">
          <PlayTab
            readOnly
            state={sharedState}
            playersById={sharedById}
            t={t}
            actions={actions}
            goTo={goTo}
            setToast={setToast}
          />
        </main>

        <Toast message={toast?.message} tone={toast?.tone} />
      </div>
    )
  }

  return (
    <div className="min-h-dvh">
      {/* ------------------------------------------------------- header */}
      <Header
        t={t}
        state={state}
        actions={actions}
        readyCount={readyCount}
        roundCount={roundCount}
      />

      {/* --------------------------------------------------------- tabs */}
      <nav
        className={cx(
          'safe-b fixed inset-x-0 bottom-0 z-40 border-t border-chrome-edge bg-chrome/95 backdrop-blur-md',
          'md:sticky md:top-14 md:bottom-auto md:border-t-0 md:border-b',
          'dark:border-slate-800 dark:bg-chrome-dark/95'
        )}
      >
        <div className="mx-auto flex max-w-3xl">
          {TABS.map((tb) => {
            const active = tab === tb.key
            return (
              <button
                key={tb.key}
                onClick={() => goTo(tb.key)}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition md:flex-row md:justify-center md:gap-2 md:py-3 md:text-sm',
                  active
                    ? 'text-brand-700 dark:text-brand-300'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {ICONS[tb.key]}
                <span>{t(tb.labelKey)}</span>
                {active && (
                  <span className="absolute inset-x-4 -top-px hidden h-0.5 rounded-full bg-brand-600 md:block" />
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* --------------------------------------------------------- body */}
      <main className="mx-auto max-w-3xl px-3 pt-4 pb-28 md:pb-10">
        {tab === 'play' && (
          <PlayTab
            state={state}
            playersById={playersById}
            t={t}
            actions={actions}
            goTo={goTo}
            setToast={setToast}
            onShare={() =>
              state.rounds.length ? setShareOpen(true) : setToast(t('shareEmpty'), 'error')
            }
          />
        )}
        {tab === 'players' && (
          <PlayersTab
            state={state}
            stats={stats}
            t={t}
            lang={state.lang}
            actions={actions}
            setToast={setToast}
          />
        )}
        {tab === 'courts' && <CourtsTab state={state} t={t} actions={actions} />}
        {tab === 'stats' && (
          <StatsTab
            state={state}
            stats={stats}
            playersById={playersById}
            t={t}
            lang={state.lang}
          />
        )}
        {tab === 'settings' && (
          <SettingsTab state={state} t={t} actions={actions} setToast={setToast} />
        )}
      </main>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        state={state}
        t={t}
        setToast={setToast}
      />

      <Toast message={toast?.message} tone={toast?.tone} />
    </div>
  )
}
