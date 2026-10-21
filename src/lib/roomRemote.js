/**
 * The Firestore side of live rooms (see room.js for the idea).
 *
 * One document per room, `rooms/{id}`:
 *   ownerUid   the anonymous account of the device that opened it
 *   session    the schedule as a JSON string (packRoom)
 *   v          shape version, for whenever it changes
 *   createdAt, updatedAt
 *
 * Anyone with the id may read it; only the owner may change or delete it.
 * The id is Firestore's random 20 characters, and rooms cannot be listed,
 * so the link is the key.
 */

import { signInAnonymously } from 'firebase/auth'
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { auth, db } from './firebase'
import { packRoom, unpackRoom } from './room'

const ROOM_VERSION = 1

/** The device's anonymous account; Firebase keeps it across visits. */
async function ownerUid() {
  await auth.authStateReady()
  if (auth.currentUser) return auth.currentUser.uid
  const { user } = await signInAnonymously(auth)
  return user.uid
}

/** Opens a room holding `state`'s schedule. @returns {Promise<string>} its id */
export async function createRoom(state) {
  const uid = await ownerUid()
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
  await ownerUid()
  await updateDoc(doc(db, 'rooms', id), { session: json, updatedAt: serverTimestamp() })
}

export async function deleteRoom(id) {
  await ownerUid()
  await deleteDoc(doc(db, 'rooms', id))
}

/**
 * Follows a room. `onChange` gets `{ session, updatedAt, offline }` on every
 * change — `offline` is true while what is shown came from this device's
 * cache rather than the server. `onMissing` fires when the room does not
 * exist (closed, or a mistyped link); `onError` for anything else.
 *
 * @returns {() => void} stops following
 */
export function watchRoom(id, { onChange, onMissing, onError }) {
  // metadata changes (cache → server) arrive as snapshots too; only pass on
  // what would actually look different
  let last = null
  return onSnapshot(
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
      if (last && last.session === data.session && last.offline === offline) return
      last = { session: data.session, offline }
      try {
        onChange({
          session: unpackRoom(data.session),
          updatedAt: data.updatedAt?.toMillis?.() ?? null,
          offline,
        })
      } catch (e) {
        onError(e)
      }
    },
    onError
  )
}
