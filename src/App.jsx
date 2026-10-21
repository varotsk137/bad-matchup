import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import CourtsTab from './components/CourtsTab'
import PlayTab, { DEFAULT_COUNTS } from './components/PlayTab'
import PlayersTab from './components/PlayersTab'
import SettingsTab from './components/SettingsTab'
import ShareSheet, { RoomStatus } from './components/ShareSheet'
import StatsTab from './components/StatsTab'
import { Button, Toast, cx } from './components/ui'
import { makeT } from './lib/i18n'
import {
  createEmptyRound,
  fillRound as fillRoundFn,
  generateRoundsAsync,
  playedRounds,
  suggestRounds,
  makeContext,
} from './lib/matchmaker'
import { PLAN_MAX, PLAN_MIN, planKey } from './lib/plan'
import { OWN_KEY, createPublisher, loadOwnRoom, readRoomHash, saveOwnRoom } from './lib/room'
import { clearShareHash, decodeShare, readShareHash } from './lib/share'
import { loadSkinFont, skinById } from './lib/skins'
import { clearState, defaultState } from './lib/storage'
import { createLocalStore } from './lib/store'

/** Firebase is only downloaded once someone opens or watches a room. */
const loadRemote = () => import('./lib/roomRemote')

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

function Header({
  t,
  state,
  actions,
  readyCount,
  roundCount,
  shared = false,
  roomStatus = null,
}) {
  return (
    <header className="sticky top-0 z-40 border-b-(length:--line-w) border-chrome-edge bg-chrome/95 backdrop-blur-md dark:bg-chrome-dark/95">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <span className="app-mascot text-xl" aria-hidden>
          🏸
        </span>
        <div className="min-w-0 flex-1">
          {/* the skin dresses the name: an ink pill in League, plain bold in Classic */}
          <h1 className="app-title truncate">{t('appName')}</h1>
          {!shared && (
            <p className="truncate text-[11px] leading-tight text-slate-500 dark:text-slate-400">
              {readyCount} {t('playersUnit')} · {roundCount} {t('roundsUnit')}
              {roomStatus && (
                <>
                  {' · '}
                  <RoomStatus status={roomStatus} t={t} />
                </>
              )}
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
  // one store for the life of the page; see lib/store.js
  const [store] = useState(() => createLocalStore())
  const state = useSyncExternalStore(store.subscribe, store.getState)
  const [tab, setTab] = useState('play')
  const [toast, setToastState] = useState(null)
  const toastTimer = useRef(null)
  const [shareOpen, setShareOpen] = useState(false)
  // lives here, not in PlayTab, so the round count survives a tab switch
  const roundCounts = useState(DEFAULT_COUNTS)
  // a session that arrived through a link — held apart from the user's own data
  // so opening someone else's schedule can never clobber it
  const [shared, setShared] = useState(null)
  // the live room this device publishes to, and how that is going
  const [ownRoom, setOwnRoom] = useState(loadOwnRoom)
  const [roomStatus, setRoomStatus] = useState(null)
  // a live room being watched: { id, session?, offline?, updatedAt? }
  const [live, setLive] = useState(null)

  const t = useMemo(() => makeT(state.lang), [state.lang])

  const cancelRef = useRef(false)
  // the rest of the session, planned in one go and revealed a round at a time
  // (see lib/plan.js); in memory only — after a reload it is simply rebuilt
  const planRef = useRef(null)

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
            message: makeT(store.getState().lang)('shareBroken'),
            tone: 'error',
          })
        })
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [store])

  /* ------------------------------------------------------- own live room */
  // a room opened or closed in another tab of this browser applies here too,
  // so two tabs never keep writing to a room only one of them still runs
  useEffect(() => {
    const sync = (e) => e.key === OWN_KEY && setOwnRoom(loadOwnRoom())
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  useEffect(() => {
    if (!ownRoom) {
      setRoomStatus(null)
      return
    }
    let alive = true
    let stop = () => {}
    setRoomStatus('sending')
    loadRemote()
      .then((remote) => {
        if (!alive) return
        stop = createPublisher({
          store,
          write: (json) => remote.publishRoom(ownRoom.id, json),
          onStatus: setRoomStatus,
        })
      })
      .catch(() => alive && setRoomStatus('error'))
    return () => {
      alive = false
      stop()
    }
  }, [store, ownRoom])

  /* --------------------------------------------------- watching a room */
  useEffect(() => {
    const open = () => {
      const id = readRoomHash()
      if (id && id === loadOwnRoom()?.id) {
        // the organiser tapped their own link — their app already is the room
        clearShareHash()
        setLive(null)
        setToastState({ message: makeT(store.getState().lang)('roomIsYours'), tone: 'info' })
        return
      }
      setLive((cur) => (id ? (cur?.id === id ? cur : { id }) : null))
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [store])

  const liveId = live?.id
  useEffect(() => {
    if (!liveId) return
    let alive = true
    let off = () => {}
    const fail = (key) => {
      if (!alive) return
      clearShareHash()
      setLive(null)
      setToastState({ message: makeT(store.getState().lang)(key), tone: 'error' })
    }
    loadRemote()
      .then((remote) => {
        if (!alive) return
        off = remote.watchRoom(liveId, {
          onChange: (data) =>
            setLive((cur) => (cur?.id === liveId ? { ...cur, ...data } : cur)),
          onMissing: () => fail('roomGone'),
          onError: () => fail('roomFailed'),
        })
      })
      .catch(() => fail('roomFailed'))
    return () => {
      alive = false
      off()
    }
  }, [store, liveId])

  /* ----------------------------------------------------------------- theme */
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.theme === 'dark')
  }, [state.theme])

  /* ------------------------------------------------------------------ skin */
  useEffect(() => {
    const skin = skinById(state.skin)
    document.documentElement.dataset.skin = skin.id
    loadSkinFont(skin)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', skin.bar[state.theme === 'dark' ? 'dark' : 'light'])
  }, [state.skin, state.theme])

  useEffect(() => {
    document.documentElement.lang = state.lang
  }, [state.lang])

  /* ----------------------------------------------------------------- toast */
  // `action` ({ label, run }) adds a button, e.g. Undo — and a little longer
  // on screen, so there is time to reach for it
  const setToast = useCallback((message, tone = 'info', action = null) => {
    clearTimeout(toastTimer.current)
    setToastState({ message, tone, action })
    toastTimer.current = setTimeout(() => setToastState(null), action ? 5000 : 2600)
  }, [])

  const onToastAction = () => {
    clearTimeout(toastTimer.current)
    toast?.action?.run()
    setToastState(null)
  }

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
  // The screens call these by the same names as always; each one is a named
  // change in lib/ops.js run through the store. Only round building lives
  // here, because it is slow, can fail and can be cancelled.
  const actions = useMemo(() => {
    const run =
      (name) =>
      (...args) =>
        store.dispatch(name, ...args)

    // true when the matchmaker produced nothing at all (and says why)
    const failed = (res) => {
      if (!res.error || res.created.length) return false
      setToast(t(res.error === 'no_courts' ? 'errNoCourts' : 'errNotEnough'), 'error')
      return true
    }

    return {
      set: run('set'),
      replaceState: run('replace'),
      setOption: run('setOption'),
      setWeight: run('setWeight'),

      /* ---- players ---- */
      addPlayers: run('addPlayers'),
      updatePlayer: run('updatePlayer'),
      removePlayer: run('removePlayer'),
      clearPlayers: run('clearPlayers'),
      markAllPresent: run('markAllPresent'),

      /* ---- saved settings and rosters ---- */
      savePreset: run('savePreset'),
      applyPreset: run('applyPreset'),
      deletePreset: run('deletePreset'),
      saveRoster: run('saveRoster'),
      renameRoster: run('renameRoster'),
      deleteRoster: run('deleteRoster'),
      loadRoster: run('loadRoster'),

      /* ---- courts ---- */
      addCourt: run('addCourt'),
      updateCourt: run('updateCourt'),
      removeCourt: run('removeCourt'),

      /* ---- rounds ---- */
      /**
       * Adds `count` rounds. A few at a time (the usual "one more round" tap)
       * comes out of a plan for the rest of the session, built once with the
       * whole-schedule polish — a round built on its own can only look back.
       * The plan survives ticks and scores, and is rebuilt as soon as anything
       * it depended on changes.
       */
      generate: async (count, onProgress) => {
        const s = store.getState()
        const situation = {
          players: s.players,
          courts: s.courts,
          options: s.options,
          weights: s.weights,
        }
        const balanced = (s.options.mode ?? 'balanced') === 'balanced'
        const plan = planRef.current
        if (
          balanced &&
          plan &&
          plan.rounds.length >= count &&
          plan.key === planKey({ ...situation, rounds: s.rounds })
        ) {
          const taken = plan.rounds.slice(0, count)
          const rest = plan.rounds.slice(count)
          const rounds = [...s.rounds, ...taken]
          planRef.current = rest.length
            ? { key: planKey({ ...situation, rounds }), rounds: rest }
            : null
          store.dispatch('appendRounds', taken)
          return
        }

        const cover = balanced ? (suggestRounds(s)?.coverAll ?? 0) : 0
        const ahead = balanced
          ? Math.min(PLAN_MAX, Math.max(PLAN_MIN, cover - s.rounds.length))
          : 0
        const build = Math.max(count, ahead)
        cancelRef.current = false
        const res = await generateRoundsAsync({
          ...situation,
          rounds: s.rounds,
          count: build,
          // building more than was asked for is planning ahead — say so
          onProgress: (done, total, phase, ...rest) =>
            onProgress?.(done, total, phase ?? (build > count ? 'plan' : undefined), ...rest),
          shouldCancel: () => cancelRef.current,
        })
        if (failed(res) || !res.created.length) return
        const taken = res.created.slice(0, count)
        const rest = res.cancelled ? [] : res.created.slice(count)
        planRef.current = rest.length
          ? { key: planKey({ ...situation, rounds: [...s.rounds, ...taken] }), rounds: rest }
          : null
        store.dispatch('appendRounds', taken)
      },

      /** Throws the whole schedule away and builds a fresh one the same length. */
      regenerate: async (count, onProgress) => {
        const s = store.getState()
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
        // a cancel before the very first round produced nothing — keep what was there
        if (failed(res) || !res.created.length) return
        store.dispatch('setRounds', res.created)
      },

      /**
       * Keeps every round up to the last one with a played match and rebuilds
       * the rest with today's player list — someone left, someone arrived.
       */
      regenerateRemaining: async (onProgress, wanted) => {
        const s = store.getState()
        const kept = playedRounds(s.rounds)
        // how many rounds to have after the played ones (default: as many as now)
        const count = wanted ?? s.rounds.length - kept
        if (count <= 0) return
        cancelRef.current = false
        const res = await generateRoundsAsync({
          players: s.players,
          courts: s.courts,
          rounds: s.rounds.slice(0, kept),
          weights: s.weights,
          options: s.options,
          count,
          onProgress,
          shouldCancel: () => cancelRef.current,
        })
        if (failed(res) || !res.created.length) return
        store.dispatch('replaceRoundsFrom', kept, res.created)
      },

      cancelGenerate: () => {
        cancelRef.current = true
      },

      newEmptyRound: () => {
        const s = store.getState()
        const res = createEmptyRound({ players: s.players, courts: s.courts })
        if (res.error) {
          setToast(t('errNoCourts'), 'error')
          return
        }
        store.dispatch('appendRounds', [res.round])
      },

      fillRound: (roundId) => {
        const s = store.getState()
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
        store.dispatch('replaceRound', roundId, res.round)
      },

      swapInRound: run('swapInRound'),
      restoreLineup: run('restoreLineup'),
      updateMatch: run('updateMatch'),
      toggleMatchDone: run('toggleMatchDone'),
      deleteRound: run('deleteRound'),
      clearRounds: run('clearRounds'),

      resetAll: () => {
        clearState()
        store.dispatch('reset', defaultState())
      },
    }
  }, [store, setToast, t])

  const goTo = useCallback((key) => {
    setTab(key)
    window.scrollTo({ top: 0 })
  }, [])

  const roundCount = state.rounds.length
  const readyCount = state.players.filter((p) => p.active !== false && !p.resting).length

  /* ------------------------------------------------------------- rooms */
  const openRoom = async () => {
    const remote = await loadRemote()
    const id = await remote.createRoom(store.getState())
    const room = { id, openedAt: Date.now() }
    saveOwnRoom(room)
    setOwnRoom(room)
  }

  const closeRoom = async () => {
    if (!ownRoom || !confirm(t('roomCloseConfirm'))) return
    const { id } = ownRoom
    saveOwnRoom(null)
    setOwnRoom(null)
    try {
      await (await loadRemote()).deleteRoom(id)
    } catch {
      // the room just stops updating; nobody can write to it but this device
    }
  }

  const exitLive = () => {
    clearShareHash()
    setLive(null)
  }

  /** Copies a watched room's schedule onto this device. */
  const adoptLive = () => {
    const hasOwn = state.players.length > 0 || state.rounds.length > 0
    if (hasOwn && !confirm(t('adoptConfirm'))) return
    store.dispatch('adoptSession', live.session)
    exitLive()
    setTab('play')
  }

  /** Copies a shared schedule onto this device, replacing whatever was here. */
  const adoptShared = () => {
    const hasOwn = state.players.length > 0 || state.rounds.length > 0
    if (hasOwn && !confirm(t('adoptConfirm'))) return
    store.dispatch('adoptSession', shared.session)
    clearShareHash()
    setShared(null)
    setTab('play')
  }

  const exitShared = () => {
    clearShareHash()
    setShared(null)
  }

  /* ------------------------------------------------------ live room view */
  if (live) {
    const session = live.session
    const liveState = session ? { ...state, ...session } : null
    const liveById = new Map((session?.players ?? []).map((p) => [p.id, p]))
    const time = live.updatedAt
      ? new Date(live.updatedAt).toLocaleTimeString(state.lang === 'th' ? 'th-TH' : 'en-GB', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null

    return (
      <div className="min-h-dvh">
        <Header t={t} state={state} actions={actions} readyCount={0} roundCount={0} shared />

        <div className="mx-auto max-w-3xl px-3 pt-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent-300 bg-accent-50 p-3 dark:border-accent-800 dark:bg-accent-950/40">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-accent-900 dark:text-accent-100">
                <span
                  className={cx(
                    'inline-block h-2 w-2 rounded-full',
                    live.offline ? 'bg-slate-400' : 'animate-pulse bg-rose-500'
                  )}
                  aria-hidden
                />
                {t('liveView')}
              </p>
              <p className="text-xs text-accent-800/80 dark:text-accent-200/80">
                {t(live.offline ? 'liveOffline' : 'liveUpdating')}
                {time ? ` · ${t('liveUpdated', { time })}` : ''}
              </p>
            </div>
            {session && (
              <Button variant="outline" size="sm" onClick={adoptLive}>
                {t('saveAsMine')}
              </Button>
            )}
            <Button size="sm" onClick={exitLive}>
              {t('exitShare')}
            </Button>
          </div>
        </div>

        <main className="mx-auto max-w-3xl px-3 pt-3 pb-10">
          {liveState ? (
            <PlayTab
              readOnly
              state={liveState}
              playersById={liveById}
              t={t}
              actions={actions}
              goTo={goTo}
              setToast={setToast}
            />
          ) : (
            <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('liveLoading')}
            </p>
          )}
        </main>

        <Toast
          message={toast?.message}
          tone={toast?.tone}
          action={toast?.action}
          onAction={onToastAction}
        />
      </div>
    )
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

        <Toast
          message={toast?.message}
          tone={toast?.tone}
          action={toast?.action}
          onAction={onToastAction}
        />
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
        roomStatus={ownRoom ? roomStatus : null}
      />

      {/* --------------------------------------------------------- tabs */}
      <nav
        className={cx(
          'safe-b fixed inset-x-0 bottom-0 z-40 border-t border-chrome-edge bg-chrome/95 backdrop-blur-md',
          'md:sticky md:top-14 md:bottom-auto md:border-t-0 md:border-b',
          'dark:bg-chrome-dark/95'
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
            counts={roundCounts}
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
            goTo={goTo}
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
        room={ownRoom}
        roomStatus={roomStatus}
        onOpenRoom={openRoom}
        onCloseRoom={closeRoom}
      />

      <Toast
        message={toast?.message}
        tone={toast?.tone}
        action={toast?.action}
        onAction={onToastAction}
      />
    </div>
  )
}
