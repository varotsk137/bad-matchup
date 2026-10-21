/**
 * Live rooms: the organiser's schedule mirrored online, so everyone holding
 * the link watches it change instead of waiting for a fresh image in LINE.
 *
 * The organiser's device stays the source of truth for the schedule. It keeps
 * working from localStorage exactly as before (offline included) and simply
 * forwards the session to the room after each change.
 *
 * Results — a match ticked done and its score — are the one thing others may
 * change, through an edit link. Each match's result is its own small record
 * next to the schedule, so two people ticking different matches never touch
 * the same data, and whoever writes a result last wins it. Everyone draws the
 * schedule with those records laid over it (mergeResults); the organiser's
 * device also folds them into its own copy, so its stats and image agree.
 *
 * Nothing in this file talks to Firebase — that lives in roomRemote.js, which
 * is loaded on demand so people who never open a room never download it.
 */

import { SESSION_KEYS } from './storage'

/** Only the parts a viewer needs to draw the schedule. */
const ROOM_KEYS = SESSION_KEYS.filter(
  (k) => k === 'players' || k === 'courts' || k === 'rounds'
)

/**
 * The session travels as one JSON string. Firestore cannot hold `undefined`
 * or arrays nested straight inside arrays, and a string sidesteps both
 * without the app having to care. 24 players and 100 rounds come to roughly
 * 60 KB, far under Firestore's 1 MiB per document.
 */
export function packRoom(state) {
  const session = {}
  for (const key of ROOM_KEYS) session[key] = state[key]
  return JSON.stringify(session)
}

export function unpackRoom(json) {
  const s = JSON.parse(json)
  if (!s || !Array.isArray(s.players) || !Array.isArray(s.courts) || !Array.isArray(s.rounds))
    throw new Error('bad room')
  return { players: s.players, courts: s.courts, rounds: s.rounds }
}

/* ---------------------------------------------------------- open / closed */

/**
 * A room nobody has updated for this long counts as closed, and is kept as it
 * ended (firestore.rules enforces the same 12 hours on every write).
 */
export const ROOM_IDLE_MS = 12 * 60 * 60 * 1000

/** @param {{closedAt?: number|null, updatedAt?: number|null}} room times in ms */
export function isRoomClosed(room, now = Date.now()) {
  if (room.closedAt) return true
  return typeof room.updatedAt === 'number' && now - room.updatedAt > ROOM_IDLE_MS
}

/* -------------------------------------------------------------- results */

/** The part of a match that an edit link may change. */
export function resultOf(match) {
  return {
    done: Boolean(match.done),
    scoreA: typeof match.scoreA === 'number' ? match.scoreA : null,
    scoreB: typeof match.scoreB === 'number' ? match.scoreB : null,
  }
}

const sameResult = (a, b) => a.done === b.done && a.scoreA === b.scoreA && a.scoreB === b.scoreB

/**
 * Lays `results` ({ [matchId]: {done, scoreA, scoreB} }) over the rounds.
 * Untouched rounds and matches keep their identity, and when nothing differs
 * the very same array comes back — so callers can tell "no change" cheaply.
 * Results for matches that no longer exist (a reshuffled schedule) are ignored.
 */
export function mergeResults(rounds, results) {
  if (!results) return rounds
  let changed = false
  const next = rounds.map((round) => {
    let roundChanged = false
    const matches = round.matches.map((m) => {
      const r = results[m.id]
      if (!r || sameResult(resultOf(m), r)) return m
      roundChanged = true
      return { ...m, done: r.done, scoreA: r.scoreA, scoreB: r.scoreB }
    })
    if (!roundChanged) return round
    changed = true
    return { ...round, matches }
  })
  return changed ? next : rounds
}

/** A fresh secret for an edit link: 128 random bits, URL-safe. */
export function makeEditKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/* ---------------------------------------------------------------- links */

/** `key` makes it an edit link: whoever holds it may tick matches and enter scores. */
export function buildRoomUrl(id, key = null) {
  return `${location.href.split('#')[0]}#room=${id}${key ? `&key=${key}` : ''}`
}

/** @returns {{id: string, key: string | null} | null} the room in the address bar, if any */
export function readRoomHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''))
  const id = params.get('room')
  // Firestore auto ids are 20 letters and digits; anything else is a typo
  if (!id || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null
  const key = params.get('key')
  return { id, key: key && /^[A-Za-z0-9_-]{16,64}$/.test(key) ? key : null }
}

/* ----------------------------------------------- this device's own room */

export const OWN_KEY = 'bad-matchup:room'

/** The room this device runs, kept apart from the schedule so a reset never orphans it. */
export function loadOwnRoom() {
  try {
    const raw = localStorage.getItem(OWN_KEY)
    const room = raw ? JSON.parse(raw) : null
    return room && typeof room.id === 'string' ? room : null
  } catch {
    return null
  }
}

export function saveOwnRoom(room) {
  try {
    if (room) localStorage.setItem(OWN_KEY, JSON.stringify(room))
    else localStorage.removeItem(OWN_KEY)
  } catch {
    /* private mode — the room still works until the tab closes */
  }
}

/* ------------------------------------------------------------ publisher */

/**
 * Forwards the store's session to a room whenever it changes.
 *
 * Changes arriving close together (a swap and its follow-up, a burst of
 * ticks) go out as one write after `delay` ms. Only one write is in flight at
 * a time; whatever changed meanwhile follows as soon as it lands, so the room
 * always ends on the latest state. While offline, Firestore queues the write
 * and the status says so until it goes through.
 *
 * @param {object} opts
 * @param {{getState: Function, subscribe: Function}} opts.store
 * @param {(json: string) => Promise<void>} opts.write
 * @param {(status: 'sending'|'synced'|'error') => void} [opts.onStatus]
 * @param {number} [opts.delay]
 * @returns {() => void} stops publishing
 */
export function createPublisher({ store, write, onStatus = () => {}, delay = 400 }) {
  let sent = null // the last JSON the room accepted
  let timer = null
  let inFlight = false
  let stopped = false

  const flush = async () => {
    timer = null
    if (stopped || inFlight) return
    const json = packRoom(store.getState())
    if (json === sent) {
      onStatus('synced')
      return
    }
    inFlight = true
    onStatus('sending')
    try {
      await write(json)
      sent = json
      inFlight = false
      if (stopped) return
      // something changed while that write was out — send it too
      if (packRoom(store.getState()) !== sent) schedule()
      else onStatus('synced')
    } catch {
      inFlight = false
      if (!stopped) onStatus('error')
    }
  }

  const schedule = () => {
    if (stopped) return
    clearTimeout(timer)
    timer = setTimeout(flush, delay)
  }

  let last = store.getState()
  const off = store.subscribe(() => {
    const now = store.getState()
    // looks and saved lists change the state too, but not the room
    if (ROOM_KEYS.every((k) => now[k] === last[k])) return
    last = now
    schedule()
  })

  // catch up on anything changed while the app was closed
  schedule()

  return () => {
    stopped = true
    clearTimeout(timer)
    off()
  }
}
