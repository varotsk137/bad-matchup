/**
 * Live rooms: the organiser's schedule mirrored online, so everyone holding
 * the link watches it change instead of waiting for a fresh image in LINE.
 *
 * The organiser's device stays the source of truth. It keeps working from
 * localStorage exactly as before (offline included) and simply forwards the
 * session to the room after each change; viewers only ever read. That keeps
 * the whole app usable with no network, and means a room never has two
 * writers to reconcile.
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

/* ---------------------------------------------------------------- links */

export function buildRoomUrl(id) {
  return `${location.href.split('#')[0]}#room=${id}`
}

/** @returns {string | null} the room id in the address bar, if any */
export function readRoomHash() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''))
  const id = params.get('room')
  // Firestore auto ids are 20 letters and digits; anything else is a typo
  return id && /^[A-Za-z0-9]{10,40}$/.test(id) ? id : null
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
