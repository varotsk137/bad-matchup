import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import CourtsTab from './components/CourtsTab'
import PlayTab, { DEFAULT_COUNTS } from './components/PlayTab'
import PlayersTab from './components/PlayersTab'
import {
  InstallInvite,
  InstallSheet,
  TopBars,
  UpdateToast,
  useInstall,
} from './components/PwaBits'
import SettingsTab from './components/SettingsTab'
import LiveRoomSheet, { RoomStatus } from './components/LiveRoomSheet'
import RoomHistorySheet from './components/RoomHistorySheet'
import StatsTab from './components/StatsTab'
import LineIcon from './components/Icon'
import { Button, ConfirmHost, Toast, askConfirm, cx } from './components/ui'
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
import { applyUpdate, checkOnline, pwaStore, readFlag, setFlag } from './lib/pwa'
import {
  OWN_KEY,
  ROOM_IDLE_MS,
  createPublisher,
  isRoomClosed,
  loadOwnRoom,
  makeEditKey,
  readRoomHash,
  resultOf,
  saveOwnRoom,
} from './lib/room'
import { recordVisit, summarize } from './lib/roomHistory'
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
  onRoomClick,
  onHistory,
}) {
  const darkOnly = !!skinById(state.skin).darkOnly
  return (
    <header className="sticky top-0 z-40 border-b-(length:--line-w) border-chrome-edge bg-chrome/95 backdrop-blur-md dark:bg-chrome-dark/95">
      <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
        <span className="app-mascot text-brand-600 dark:text-brand-300">
          <LineIcon name="shuttle" className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          {/* the skin dresses the name: an ink pill in League, plain bold in Classic */}
          <h1 className="app-title truncate">{t('appName')}</h1>
          {!shared && (
            <p className="truncate text-xs leading-tight text-slate-600 dark:text-slate-400">
              {readyCount} {t('playersUnit')} · {roundCount} {t('roundsUnit')}
              {roomStatus && (
                <>
                  {' · '}
                  <button onClick={onRoomClick} className="underline-offset-2 hover:underline">
                    <RoomStatus status={roomStatus} t={t} />
                  </button>
                </>
              )}
            </p>
          )}
        </div>
        <button
          onClick={onHistory}
          className="grid h-11 w-11 place-items-center rounded-lg border border-chrome-edge bg-slate-50/60 text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
          aria-label={t('historyTitle')}
          title={t('historyTitle')}
        >
          {/* a clock with an arrow running back round it: rooms opened before */}
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6" strokeLinecap="round" />
            <path d="M3.5 3.5v2.4h2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 6.5V10l2.3 1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={() => actions.set({ lang: state.lang === 'th' ? 'en' : 'th' })}
          className="h-11 min-w-11 rounded-lg border border-chrome-edge bg-slate-50/60 px-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
          aria-label={t('language')}
        >
          {state.lang === 'th' ? 'TH' : 'EN'}
        </button>
        <button
          onClick={() => actions.set({ theme: state.theme === 'dark' ? 'light' : 'dark' })}
          disabled={darkOnly}
          className="grid h-11 w-11 place-items-center rounded-lg border border-chrome-edge bg-slate-50/60 text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-transparent dark:text-slate-300"
          aria-label={t('theme')}
          title={darkOnly ? t('themeLockedDark') : t(state.theme === 'dark' ? 'themeDark' : 'themeLight')}
        >
          <LineIcon name={darkOnly || state.theme === 'dark' ? 'moon' : 'sun'} className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}

/* -------------------------------------------------------------------- app */

export default function App() {
  // one store for the life of the page; see lib/store.js
  const [store] = useState(() => createLocalStore(undefined, window))
  const state = useSyncExternalStore(store.subscribe, store.getState)
  const [tab, setTab] = useState('play')
  const [toast, setToastState] = useState(null)
  const toastTimer = useRef(null)
  const [liveOpen, setLiveOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  // lives here, not in PlayTab, so the round count survives a tab switch
  const roundCounts = useState(DEFAULT_COUNTS)
  // a session that arrived through a link — held apart from the user's own data
  // so opening someone else's schedule can never clobber it
  const [shared, setShared] = useState(null)
  // the live room this device publishes to, and how that is going
  const [ownRoom, setOwnRoom] = useState(loadOwnRoom)
  const [roomStatus, setRoomStatus] = useState(null)
  // a live room being watched: { id, key, member, session?, offline?, updatedAt? }
  const [live, setLive] = useState(null)
  // set while this device runs a room: sends one match's result to it
  const resultSink = useRef(null)
  // set while watching a room: the Firestore helpers, for an edit link's ticks
  const liveRemote = useRef(null)

  const t = useMemo(() => makeT(state.lang), [state.lang])

  // Online or not is decided at launch (and by "try again"), never by itself
  // mid-session: with no internet the app opens for matchmaking only, without
  // live rooms. A signal that drops during play is the room queue's business.
  const [online, setOnline] = useState(() => navigator.onLine !== false)
  const [retrying, setRetrying] = useState(false)
  const pwa = useSyncExternalStore(pwaStore.subscribe, pwaStore.getState)
  const installer = useInstall()
  const [inviting, setInviting] = useState(false)

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
  // A room closed (or its edit key replaced) in another tab applies here too,
  // so no tab keeps writing to a room it no longer runs. A room *opened* in
  // another tab is left to that tab: this one only starts publishing after a
  // reload, when its copy of the schedule is certainly current.
  useEffect(() => {
    const sync = (e) => {
      if (e.key !== OWN_KEY) return
      const next = loadOwnRoom()
      setOwnRoom((cur) => (cur && next?.id === cur.id ? next : null))
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  // the room itself, not its edit key: handing out a new key changes nothing here
  const ownRoomId = ownRoom?.id
  useEffect(() => {
    if (!ownRoomId) {
      setRoomStatus(null)
      return
    }
    const id = ownRoomId
    let alive = true
    let stopPublishing = () => {}
    let stopWatching = () => {}
    let timer = null
    const stop = () => {
      alive = false
      clearInterval(timer)
      resultSink.current = null
      stopPublishing()
      stopWatching()
    }

    // No server runs on a timer, so the 12-hour close happens here (and in
    // firestore.rules, which refuses writes to an idle room either way).
    const autoClose = (remote) => {
      stop()
      remote.closeRoom(id).catch(() => {})
      saveOwnRoom(null)
      setOwnRoom(null)
      setToastState({ message: makeT(store.getState().lang)('roomAutoClosed'), tone: 'info' })
    }

    setRoomStatus('sending')
    loadRemote()
      .then(async (remote) => {
        if (!alive) return
        // the app may have been shut for days: look before writing anything
        let times
        try {
          times = await remote.roomTimes(id)
        } catch {
          times = undefined // offline with nothing cached — carry on, the timer still watches
        }
        if (!alive) return
        if (times === null) {
          // gone from the server altogether
          saveOwnRoom(null)
          setOwnRoom(null)
          return
        }
        if (times && isRoomClosed(times)) return autoClose(remote)

        let lastUpdate = times?.updatedAt ?? Date.now()
        timer = setInterval(() => {
          if (Date.now() - lastUpdate > ROOM_IDLE_MS) autoClose(remote)
        }, 60 * 1000)

        stopPublishing = createPublisher({
          store,
          write: async (json) => {
            await remote.publishRoom(id, json)
            lastUpdate = Date.now()
          },
          onStatus: (s) => alive && setRoomStatus(s),
        })
        // ticks and scores from edit links come back into this device's copy,
        // so stats, the image and the next round all see them
        stopWatching = remote.watchResults(id, (results) =>
          store.dispatch('applyResults', results)
        )
        // and this device's own ticks go out as results too, or an older
        // result from someone else would keep overriding them for viewers
        resultSink.current = (matchId) => {
          const match = store
            .getState()
            .rounds.flatMap((r) => r.matches)
            .find((m) => m.id === matchId)
          if (match)
            remote.writeResult(id, matchId, resultOf(match)).catch(() => {
              setRoomStatus('error')
            })
        }
      })
      .catch(() => alive && setRoomStatus('error'))
    return stop
  }, [store, ownRoomId])

  /* --------------------------------------------------- watching a room */
  useEffect(() => {
    const open = () => {
      const link = readRoomHash()
      if (link && link.id === loadOwnRoom()?.id) {
        // the organiser tapped their own link — their app already is the room
        clearShareHash()
        setLive(null)
        setToastState({ message: makeT(store.getState().lang)('roomIsYours'), tone: 'info' })
        return
      }
      setLive((cur) =>
        link
          ? cur?.id === link.id && cur.key === link.key
            ? cur
            : { id: link.id, key: link.key, member: false }
          : null
      )
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [store])

  const liveId = live?.id
  const liveKey = live?.key

  // a watched room can go idle with nothing arriving to say so — look again
  // every minute, so it shows as closed once 12 hours have passed
  const [, setClock] = useState(0)
  useEffect(() => {
    if (!liveId) return
    const timer = setInterval(() => setClock(Date.now()), 60 * 1000)
    return () => clearInterval(timer)
  }, [liveId])

  useEffect(() => {
    if (!liveId) return
    let alive = true
    let off = () => {}
    const say = (key, tone) =>
      setToastState({ message: makeT(store.getState().lang)(key), tone })
    const fail = (key) => {
      if (!alive) return
      clearShareHash()
      setLive(null)
      say(key, 'error')
    }
    loadRemote()
      .then((remote) => {
        if (!alive) return
        off = remote.watchRoom(liveId, {
          onChange: (data) => {
            setLive((cur) => (cur?.id === liveId ? { ...cur, ...data } : cur))
            if (data.session)
              recordVisit({
                id: liveId,
                key: liveKey,
                role: liveKey ? 'edit' : 'watch',
                updatedAt: data.updatedAt,
                closedAt: data.closedAt,
                ...summarize(data.session),
              })
          },
          onMissing: () => fail('roomGone'),
          onError: () => fail('roomFailed'),
        })
        liveRemote.current = remote
        // an edit link: join, and tick and score once the room says yes
        if (liveKey)
          remote
            .joinRoom(liveId, liveKey)
            .then(
              () =>
                alive && setLive((cur) => (cur?.id === liveId ? { ...cur, member: true } : cur))
            )
            .catch(() => alive && say('editLinkExpired', 'info'))
      })
      .catch(() => fail('roomFailed'))
    return () => {
      alive = false
      liveRemote.current = null
      off()
    }
  }, [store, liveId, liveKey])

  /* ------------------------------------------------------------ connection */
  useEffect(() => {
    let alive = true
    checkOnline().then((ok) => alive && setOnline(ok))
    return () => {
      alive = false
    }
  }, [])

  /* ----------------------------------------------------------- install invite */
  // once per device, on the app's own screens, where the browser can install
  const mainView = !live && !shared
  const canInvite = installer.kind === 'prompt' || installer.kind === 'ios'
  useEffect(() => {
    if (!online || !mainView || !canInvite || readFlag('invited')) return
    const timer = setTimeout(() => {
      setFlag('invited')
      setInviting(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [online, mainView, canInvite])
  const endInvite = useCallback(() => setInviting(false), [])

  /* ----------------------------------------------------------------- theme */
  // a dark-only skin (neon, chalkboard, champion) keeps the page dark whatever the theme
  const darkNow = skinById(state.skin).darkOnly || state.theme === 'dark'
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkNow)
  }, [darkNow])

  /* ------------------------------------------------------------------ skin */
  useEffect(() => {
    const skin = skinById(state.skin)
    document.documentElement.dataset.skin = skin.id
    loadSkinFont(skin)
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', skin.bar[darkNow ? 'dark' : 'light'])
  }, [state.skin, darkNow])

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

  /** "Try again" on the no-internet bar: back to the full app if the server answers. */
  const retryOnline = async () => {
    setRetrying(true)
    const ok = await checkOnline()
    setRetrying(false)
    if (ok) setOnline(true)
    setToast(t(ok ? 'netBack' : 'netStillOffline'), ok ? 'info' : 'error')
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
      // in a live room these also go out as results (see the room effect)
      updateMatch: (roundId, matchId, patch) => {
        store.dispatch('updateMatch', roundId, matchId, patch)
        resultSink.current?.(matchId)
      },
      toggleMatchDone: (roundId, matchId) => {
        store.dispatch('toggleMatchDone', roundId, matchId)
        resultSink.current?.(matchId)
      },
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
    recordVisit({ id, role: 'own', updatedAt: room.openedAt, ...summarize(store.getState()) })
  }

  /**
   * Lets edit links tick and score (with a fresh key, so it also replaces a
   * leaked link) or stops them; either way, links sent before stop working.
   */
  const setScoring = async (on) => {
    if (!ownRoom) return
    const key = on ? makeEditKey() : null
    await (await loadRemote()).setEditKey(ownRoom.id, key)
    const room = { ...ownRoom, key }
    saveOwnRoom(room)
    setOwnRoom(room)
  }

  /** Closes the room; it is kept as it ended, so the links still show the results. */
  const closeRoom = async () => {
    if (!ownRoom) return
    if (!(await askConfirm({ message: t('roomCloseConfirm'), confirmLabel: t('cfCloseRoom') })))
      return
    const { id } = ownRoom
    saveOwnRoom(null)
    setOwnRoom(null)
    recordVisit({ id, closedAt: Date.now(), ...summarize(store.getState()) })
    setLiveOpen(false)
    try {
      await (await loadRemote()).closeRoom(id)
    } catch {
      // offline: the room is idle from now on and closes itself within 12 hours
    }
  }

  const exitLive = () => {
    clearShareHash()
    setLive(null)
  }

  /** Copies a watched room's schedule onto this device. */
  const adoptLive = async () => {
    const hasOwn = state.players.length > 0 || state.rounds.length > 0
    if (hasOwn && !(await askConfirm({ message: t('adoptConfirm'), confirmLabel: t('cfAdopt') })))
      return
    store.dispatch('adoptSession', live.session)
    exitLive()
    setTab('play')
  }

  /** Copies a shared schedule onto this device, replacing whatever was here. */
  const adoptShared = async () => {
    const hasOwn = state.players.length > 0 || state.rounds.length > 0
    if (hasOwn && !(await askConfirm({ message: t('adoptConfirm'), confirmLabel: t('cfAdopt') })))
      return
    store.dispatch('adoptSession', shared.session)
    clearShareHash()
    setShared(null)
    setTab('play')
  }

  const exitShared = () => {
    clearShareHash()
    setShared(null)
  }

  const topBars = <TopBars t={t} offline={!online} retrying={retrying} onRetry={retryOnline} />
  // one message at a time: the update waits while another toast is up
  const updateToast = pwa.updateReady && !toast && <UpdateToast t={t} onReload={applyUpdate} />
  const historySheet = (
    <RoomHistorySheet
      open={historyOpen}
      onClose={() => setHistoryOpen(false)}
      t={t}
      lang={state.lang}
      onOwnRoom={() => online && setLiveOpen(true)}
    />
  )

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
    // closed by its owner, or idle past 12 hours: the final results, read-only
    const closed = session ? isRoomClosed(live) : false
    const canScore = live.member && !closed && online

    // an edit link's ticks and scores go to the room, never to this device's data
    const findMatch = (matchId) =>
      session?.rounds.flatMap((r) => r.matches).find((m) => m.id === matchId)
    const sendResult = (matchId, change) => {
      const match = findMatch(matchId)
      const remote = liveRemote.current
      if (!match || !remote) return
      remote
        .writeResult(live.id, matchId, { ...resultOf(match), ...change(match) })
        .catch(() => setToast(t('resultFailed'), 'error'))
    }
    const liveActions = canScore
      ? {
          ...actions,
          toggleMatchDone: (_roundId, matchId) =>
            sendResult(matchId, (m) => ({ done: !m.done })),
          updateMatch: (_roundId, matchId, patch) =>
            sendResult(matchId, () => {
              const out = {}
              if ('scoreA' in patch) out.scoreA = patch.scoreA ?? null
              if ('scoreB' in patch) out.scoreB = patch.scoreB ?? null
              return out
            }),
        }
      : actions

    return (
      <div className="min-h-dvh">
        <Header
          onHistory={() => setHistoryOpen(true)}
          t={t}
          state={state}
          actions={actions}
          readyCount={0}
          roundCount={0}
          shared
        />
        {topBars}

        <div className="mx-auto max-w-3xl px-3 pt-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent-300 bg-accent-50 p-3 dark:border-accent-800 dark:bg-accent-950/40">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-accent-900 dark:text-accent-100">
                <span
                  className={cx(
                    'inline-block h-2 w-2 rounded-full',
                    live.offline || closed ? 'bg-slate-400' : 'animate-pulse bg-rose-500'
                  )}
                  aria-hidden
                />
                {t(closed ? 'liveClosed' : 'liveView')}
              </p>
              <p className="text-xs text-accent-800/80 dark:text-accent-200/80">
                {!closed &&
                  t(live.offline ? 'liveOffline' : canScore ? 'liveMember' : 'liveUpdating')}
                {time ? `${closed ? '' : ' · '}${t('liveUpdated', { time })}` : ''}
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
              canScore={canScore}
              state={liveState}
              playersById={liveById}
              t={t}
              actions={liveActions}
              goTo={goTo}
              setToast={setToast}
            />
          ) : (
            <p className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('liveLoading')}
            </p>
          )}
        </main>

        <ConfirmHost t={t} />
        <Toast
          message={toast?.message}
          tone={toast?.tone}
          action={toast?.action}
          onAction={onToastAction}
        />
        {updateToast}
        {historySheet}
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
        <Header
          onHistory={() => setHistoryOpen(true)}
          t={t}
          state={state}
          actions={actions}
          readyCount={0}
          roundCount={0}
          shared
        />
        {topBars}

        <div className="mx-auto max-w-3xl px-3 pt-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-accent-300 bg-accent-50 p-3 dark:border-accent-800 dark:bg-accent-950/40">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-accent-900 dark:text-accent-100">
                <LineIcon name="link" />
                {t('sharedView')}
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

        <ConfirmHost t={t} />
        <Toast
          message={toast?.message}
          tone={toast?.tone}
          action={toast?.action}
          onAction={onToastAction}
        />
        {updateToast}
        {historySheet}
      </div>
    )
  }

  return (
    <div className="min-h-dvh">
      {/* ------------------------------------------------------- header */}
      <Header
        onHistory={() => setHistoryOpen(true)}
        t={t}
        state={state}
        actions={actions}
        readyCount={readyCount}
        roundCount={roundCount}
        roomStatus={ownRoom ? roomStatus : null}
        onRoomClick={() => online && setLiveOpen(true)}
      />
      {topBars}

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
            onLive={
              online
                ? () =>
                    ownRoom || state.rounds.length
                      ? setLiveOpen(true)
                      : setToast(t('shareEmpty'), 'error')
                : undefined
            }
            liveOn={Boolean(ownRoom)}
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

      <LiveRoomSheet
        open={liveOpen}
        onClose={() => setLiveOpen(false)}
        t={t}
        lang={state.lang}
        setToast={setToast}
        room={ownRoom}
        roomStatus={roomStatus}
        onOpenRoom={openRoom}
        onCloseRoom={closeRoom}
        onSetScoring={setScoring}
      />

      {inviting && <InstallInvite t={t} onInstall={installer.install} onDone={endInvite} />}
      <InstallSheet
        open={installer.sheet}
        onClose={installer.closeSheet}
        kind={installer.kind}
        t={t}
        state={state}
      />

      <ConfirmHost t={t} />
      <Toast
        message={toast?.message}
        tone={toast?.tone}
        action={toast?.action}
        onAction={onToastAction}
      />
      {updateToast}
      {historySheet}
    </div>
  )
}
