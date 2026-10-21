/**
 * The Firestore side of live rooms (see room.js for the idea).
 *
 *   rooms/{id}                  the schedule, written by the organiser only
 *     ownerUid   the anonymous account of the device that opened it
 *     session    the schedule as a JSON string (packRoom)
 *     v          shape version, for whenever it changes
 *     createdAt, updatedAt
 *   rooms/{id}/results/{matchId}   one match's tick and score
 *     done, scoreA, scoreB, by (who wrote it), at
 *   rooms/{id}/members/{uid}       a device that joined with the edit key
 *     key, joinedAt
 *   roomKeys/{id}                  the current edit key, readable by the owner only
 *     key, at
 *
 * Anyone with the id may read the room and its results; rooms cannot be
 * listed, so the link is what lets you in. Results may be written by the
 * owner and by members whose key is still the current one — issuing a new
 * key shuts every earlier edit link out at once.
 */

import { signInAnonymously } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { mergeResults, packRoom, unpackRoom } from './room'

const ROOM_VERSION = 1

/** The device's anonymous account; Firebase keeps it across visits. */
async function signIn() {
  await auth.authStateReady()
  if (auth.currentUser) return auth.currentUser.uid
  const { user } = await signInAnonymously(auth)
  return user.uid
}

/* ------------------------------------------------------------ organiser */

/** Opens a room holding `state`'s schedule. @returns {Promise<string>} its id */
export async function createRoom(state) {
  const uid = await signIn()
  const ref = doc(collection(db, 'rooms'))
  await setDoc(ref, {
    ownerUid: uid,
    session: packRoom(state),
    v: ROOM_VERSION,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return ref.id
}

export async function publishRoom(id, json) {
  await signIn()
  await updateDoc(doc(db, 'rooms', id), { session: json, updatedAt: serverTimestamp() })
}

/**
 * Makes `key` the room's edit key; any older edit link stops working. `null`
 * turns edit links off altogether.
 */
export async function setEditKey(id, key) {
  await signIn()
  if (key) await setDoc(doc(db, 'roomKeys', id), { key, at: serverTimestamp() })
  else await deleteDoc(doc(db, 'roomKeys', id))
}

/**
 * When the room was last updated and whether it was closed, in ms (null when
 * it does not exist). Prefers the server, falls back to this device's cache.
 */
export async function roomTimes(id) {
  await signIn()
  const ref = doc(db, 'rooms', id)
  const snap = await getDocFromServer(ref).catch(() => getDoc(ref))
  if (!snap.exists()) return null
  const d = snap.data()
  return {
    updatedAt: d.updatedAt?.toMillis() ?? null,
    closedAt: d.closedAt?.toMillis() ?? null,
  }
}

/**
 * Closes the room for good. It is kept as it ended: anyone holding the link
 * still sees the final schedule and results, and nobody can change it again.
 */
export async function closeRoom(id) {
  await signIn()
  await updateDoc(doc(db, 'rooms', id), { closedAt: serverTimestamp() })
}

/** Removes the room and everything that belonged to it (not used by the app yet). */
export async function deleteRoom(id) {
  await signIn()
  const [results, members] = await Promise.all([
    getDocs(collection(db, 'rooms', id, 'results')),
    getDocs(collection(db, 'rooms', id, 'members')),
  ])
  // a batch holds 500 writes; a session never has anywhere near that many
  // matches, but stay safe and clear the extras first
  const refs = [...results.docs, ...members.docs].map((d) => d.ref)
  while (refs.length > 450) {
    const batch = writeBatch(db)
    refs.splice(0, 450).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
  const batch = writeBatch(db)
  refs.forEach((ref) => batch.delete(ref))
  batch.delete(doc(db, 'roomKeys', id))
  batch.delete(doc(db, 'rooms', id))
  await batch.commit()
}

/**
 * The results others have entered, as { [matchId]: {done, scoreA, scoreB} },
 * every time one changes. @returns {() => void} stops following
 */
export function watchResults(id, onResults, onError = () => {}) {
  return onSnapshot(
    collection(db, 'rooms', id, 'results'),
    (snap) => onResults(resultsFrom(snap)),
    onError
  )
}

/* -------------------------------------------------------- edit-link holders */

/** Joins with an edit key. Rejects when the key is wrong or has been replaced. */
export async function joinRoom(id, key) {
  const uid = await signIn()
  await setDoc(doc(db, 'rooms', id, 'members', uid), { key, joinedAt: serverTimestamp() })
}

/* ------------------------------------------------------------- everyone */

/** Writes one match's tick and score. Owner or member only (see firestore.rules). */
export async function writeResult(id, matchId, result) {
  const uid = await signIn()
  await setDoc(doc(db, 'rooms', id, 'results', matchId), {
    done: result.done,
    scoreA: result.scoreA,
    scoreB: result.scoreB,
    by: uid,
    at: serverTimestamp(),
  })
}

function resultsFrom(snap) {
  const out = {}
  for (const d of snap.docs) {
    const { done, scoreA, scoreB } = d.data()
    out[d.id] = { done, scoreA, scoreB }
  }
  return out
}

/**
 * Follows a room: the schedule with everyone's results laid over it.
 * `onChange` gets `{ session, updatedAt, closedAt, offline }` on every change —
 * `offline` is true while what is shown came from this device's cache rather
 * than the server. `onMissing` fires when the room does not exist (closed, or
 * a mistyped link); `onError` for anything else.
 *
 * @returns {() => void} stops following
 */
export function watchRoom(id, { onChange, onMissing, onError }) {
  let room = null // { json, session, updatedAt, offline }
  let results = null

  const emit = () => {
    if (!room) return
    onChange({
      session: { ...room.session, rounds: mergeResults(room.session.rounds, results) },
      updatedAt: room.updatedAt,
      closedAt: room.closedAt,
      offline: room.offline,
    })
  }

  const offRoom = onSnapshot(
    doc(db, 'rooms', id),
    { includeMetadataChanges: true },
    (snap) => {
      if (!snap.exists()) {
        // a cache miss before the server has answered is not "missing" yet
        if (!snap.metadata.fromCache) onMissing()
        return
      }
      const data = snap.data({ serverTimestamps: 'estimate' })
      const offline = snap.metadata.fromCache
      // metadata changes (cache → server) arrive as snapshots too; only pass
      // on what would actually look different
      const closedAt = data.closedAt?.toMillis?.() ?? null
      const updatedAt = data.updatedAt?.toMillis?.() ?? null
      if (
        room &&
        room.json === data.session &&
        room.offline === offline &&
        room.closedAt === closedAt &&
        room.updatedAt === updatedAt
      )
        return
      try {
        room = {
          json: data.session,
          session: room?.json === data.session ? room.session : unpackRoom(data.session),
          updatedAt: data.updatedAt?.toMillis?.() ?? null,
          closedAt,
          offline,
        }
      } catch (e) {
        onError(e)
        return
      }
      emit()
    },
    onError
  )

  const offResults = onSnapshot(
    collection(db, 'rooms', id, 'results'),
    (snap) => {
      results = resultsFrom(snap)
      emit()
    },
    onError
  )

  return () => {
    offRoom()
    offResults()
  }
}
