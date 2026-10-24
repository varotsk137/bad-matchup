/**
 * Rooms this device has opened or watched, newest first, so a schedule seen
 * last week is one tap away again without digging the link out of LINE.
 *
 * It lives in localStorage only: nothing here ever reaches the server, and a
 * fresh browser starts with an empty list. An edit link's key is kept with
 * its room, so reopening it can still tick and score while the key is valid.
 */

import { isRoomClosed } from './room'

export const HISTORY_KEY = 'bad-matchup:room-history'
export const HISTORY_MAX = 30

/** How many names the summary line shows before "+N". */
const NAME_PREVIEW = 3

/**
 * @typedef {object} RoomVisit
 * @property {string} id
 * @property {string|null} key      an edit link's key, if it came with one
 * @property {'own'|'watch'|'edit'} role
 * @property {number} lastAt        when this device last had it open (ms)
 * @property {number|null} updatedAt the room's own last change, as last seen
 * @property {number|null} closedAt
 * @property {string[]} names       the first few player names
 * @property {number} players
 * @property {number} rounds
 */

export function loadHistory() {
  try {
    const list = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    return Array.isArray(list) ? list.filter((v) => v && typeof v.id === 'string') : []
  } catch {
    return []
  }
}

function saveHistory(list) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    /* private mode or storage full — history is a convenience, carry on */
  }
}

/**
 * The summary fields of a visit, from a room's session as it arrived.
 * @param {{players?: {name: string, deleted?: boolean}[], rounds?: unknown[]}} session
 */
export function summarize(session) {
  const players = (session?.players ?? []).filter((p) => !p.deleted)
  return {
    names: players.slice(0, NAME_PREVIEW).map((p) => p.name),
    players: players.length,
    rounds: session?.rounds?.length ?? 0,
  }
}

/**
 * Adds a visit, or refreshes it if the room is already listed, and moves it
 * to the top. A later visit without a key keeps the key from an earlier one,
 * and the organiser's own room stays marked as theirs.
 *
 * @param {Partial<RoomVisit> & {id: string}} visit
 * @returns {RoomVisit[]} the new list
 */
export function recordVisit(visit, now = Date.now()) {
  const list = loadHistory()
  const before = list.find((v) => v.id === visit.id)
  const merged = {
    key: null,
    role: 'watch',
    updatedAt: null,
    closedAt: null,
    names: [],
    players: 0,
    rounds: 0,
    ...before,
    ...visit,
    lastAt: now,
  }
  if (!visit.key && before?.key) merged.key = before.key
  if (before?.role === 'own') merged.role = 'own'
  else if (merged.key && merged.role === 'watch') merged.role = 'edit'
  const next = [merged, ...list.filter((v) => v.id !== visit.id)].slice(0, HISTORY_MAX)
  saveHistory(next)
  return next
}

export function forgetVisit(id) {
  const next = loadHistory().filter((v) => v.id !== id)
  saveHistory(next)
  return next
}

export function clearHistory() {
  saveHistory([])
  return []
}

/** Open or closed, judged the same way the room itself is. */
export function visitClosed(visit, now = Date.now()) {
  return isRoomClosed({ closedAt: visit.closedAt, updatedAt: visit.updatedAt }, now)
}
