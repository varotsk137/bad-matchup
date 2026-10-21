/**
 * firestore.rules against the real emulator. Needs Java, so it is not part of
 * `npm test`; run it with `npm run test:rules`, which starts the emulator,
 * runs these and stops it again.
 */

import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

let env

const room = (uid, extra = {}) => ({
  ownerUid: uid,
  session: '{"players":[],"courts":[],"rounds":[]}',
  v: 1,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...extra,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-bad-matchup',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(() => env?.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
})

const as = (uid) =>
  (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore()

const HOUR = 3600 * 1000

/** A room owned by `owner`, written past the rules; last updated `ago` ms back. */
async function seed(id, owner, { ago = 0, closed = false } = {}) {
  await env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), 'rooms', id), {
      ...room(owner),
      createdAt: new Date(Date.now() - ago - HOUR),
      updatedAt: new Date(Date.now() - ago),
      ...(closed ? { closedAt: new Date() } : {}),
    })
  )
}

describe('rooms', () => {
  it('lets anyone open a room by its id', async () => {
    await seed('r1', 'alice')
    await assertSucceeds(getDoc(doc(as(null), 'rooms', 'r1')))
  })

  it('never lets anyone list the rooms', async () => {
    await seed('r1', 'alice')
    await assertFails(getDocs(collection(as('bob'), 'rooms')))
  })

  it('lets a signed-in device open a room it owns', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'rooms', 'r1'), room('alice')))
  })

  it('refuses a room opened without signing in, or in someone else’s name', async () => {
    await assertFails(setDoc(doc(as(null), 'rooms', 'r1'), room('alice')))
    await assertFails(setDoc(doc(as('bob'), 'rooms', 'r1'), room('alice')))
  })

  it('refuses unknown fields and oversized schedules', async () => {
    await assertFails(setDoc(doc(as('alice'), 'rooms', 'r1'), room('alice', { admin: true })))
    await assertFails(
      setDoc(doc(as('alice'), 'rooms', 'r1'), room('alice', { session: 'x'.repeat(600001) }))
    )
  })

  it('lets only the owner update the schedule', async () => {
    await seed('r1', 'alice')
    const change = { session: '{}', updatedAt: serverTimestamp() }
    await assertSucceeds(updateDoc(doc(as('alice'), 'rooms', 'r1'), change))
    await assertFails(updateDoc(doc(as('bob'), 'rooms', 'r1'), change))
  })

  it('never lets the owner hand the room over or rewrite when it began', async () => {
    await seed('r1', 'alice')
    await assertFails(
      updateDoc(doc(as('alice'), 'rooms', 'r1'), {
        ownerUid: 'bob',
        updatedAt: serverTimestamp(),
      })
    )
    await assertFails(
      updateDoc(doc(as('alice'), 'rooms', 'r1'), {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  })

  it('lets only the owner close the room', async () => {
    await seed('r1', 'alice')
    await assertFails(deleteDoc(doc(as('bob'), 'rooms', 'r1')))
    await assertSucceeds(deleteDoc(doc(as('alice'), 'rooms', 'r1')))
  })
})

/* ------------------------------------------------- edit links and results */

const KEY = 'k'.repeat(22)

/** Gives room `id` an edit key, written past the rules. */
async function seedKey(id, key = KEY) {
  await env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), 'roomKeys', id), { key, at: new Date(0) })
  )
}

const join = (uid, key = KEY) =>
  setDoc(doc(as(uid), 'rooms', 'r1', 'members', uid), { key, joinedAt: serverTimestamp() })

const result = (uid, extra = {}) => ({
  done: true,
  scoreA: 21,
  scoreB: 17,
  by: uid,
  at: serverTimestamp(),
  ...extra,
})

const writeResult = (uid, data = result(uid), matchId = 'm1') =>
  setDoc(doc(as(uid), 'rooms', 'r1', 'results', matchId), data)

describe('edit keys', () => {
  it('lets only the owner set or read the key', async () => {
    await seed('r1', 'alice')
    const key = { key: KEY, at: serverTimestamp() }
    await assertFails(setDoc(doc(as('bob'), 'roomKeys', 'r1'), key))
    await assertSucceeds(setDoc(doc(as('alice'), 'roomKeys', 'r1'), key))
    await assertSucceeds(getDoc(doc(as('alice'), 'roomKeys', 'r1')))
    await assertFails(getDoc(doc(as('bob'), 'roomKeys', 'r1')))
    await assertFails(getDoc(doc(as(null), 'roomKeys', 'r1')))
  })

  it('refuses a key too short to be a secret', async () => {
    await seed('r1', 'alice')
    await assertFails(
      setDoc(doc(as('alice'), 'roomKeys', 'r1'), { key: 'abc', at: serverTimestamp() })
    )
  })
})

describe('joining', () => {
  beforeEach(async () => {
    await seed('r1', 'alice')
    await seedKey('r1')
  })

  it('lets a device join with the right key, as itself', async () => {
    await assertSucceeds(join('bob'))
    await assertFails(
      setDoc(doc(as('bob'), 'rooms', 'r1', 'members', 'carol'), {
        key: KEY,
        joinedAt: serverTimestamp(),
      })
    )
  })

  it('refuses a wrong key, and a room with no edit link at all', async () => {
    await assertFails(join('bob', 'x'.repeat(22)))
    await seed('r2', 'alice')
    await assertFails(
      setDoc(doc(as('bob'), 'rooms', 'r2', 'members', 'bob'), {
        key: KEY,
        joinedAt: serverTimestamp(),
      })
    )
  })

  it('shows members only to themselves and the owner', async () => {
    await join('bob')
    await assertSucceeds(getDoc(doc(as('bob'), 'rooms', 'r1', 'members', 'bob')))
    await assertFails(getDoc(doc(as('carol'), 'rooms', 'r1', 'members', 'bob')))
    await assertSucceeds(getDocs(collection(as('alice'), 'rooms', 'r1', 'members')))
    await assertFails(getDocs(collection(as('bob'), 'rooms', 'r1', 'members')))
  })
})

describe('results', () => {
  beforeEach(async () => {
    await seed('r1', 'alice')
    await seedKey('r1')
  })

  it('can be read by anyone watching', async () => {
    await assertSucceeds(getDocs(collection(as(null), 'rooms', 'r1', 'results')))
  })

  it('can be written by the owner and by members, not by viewers', async () => {
    await assertSucceeds(writeResult('alice'))
    await join('bob')
    await assertSucceeds(writeResult('bob'))
    await assertFails(writeResult('carol'))
  })

  it('stop being writable for a member once the key is replaced', async () => {
    await join('bob')
    await assertSucceeds(writeResult('bob'))
    await seedKey('r1', 'n'.repeat(22))
    await assertFails(writeResult('bob', result('bob', { done: false })))
  })

  it('must be a tick and two sane scores, signed by the writer', async () => {
    await join('bob')
    await assertSucceeds(writeResult('bob', result('bob', { scoreA: null, scoreB: null })))
    await assertFails(writeResult('bob', result('bob', { scoreA: 100 })))
    await assertFails(writeResult('bob', result('bob', { scoreA: -1 })))
    await assertFails(writeResult('bob', result('bob', { done: 'yes' })))
    await assertFails(writeResult('bob', result('bob', { by: 'alice' })))
    await assertFails(writeResult('bob', result('bob', { teamA: ['x'] })))
  })

  it('can be cleared only by the owner, together with the whole room', async () => {
    await join('bob')
    await writeResult('bob')
    await assertFails(deleteDoc(doc(as('bob'), 'rooms', 'r1', 'results', 'm1')))
    const db = as('alice')
    const batch = writeBatch(db)
    batch.delete(doc(db, 'rooms', 'r1', 'results', 'm1'))
    batch.delete(doc(db, 'rooms', 'r1', 'members', 'bob'))
    batch.delete(doc(db, 'roomKeys', 'r1'))
    batch.delete(doc(db, 'rooms', 'r1'))
    await assertSucceeds(batch.commit())
  })
})

/* ------------------------------------------------------- closing a room */

describe('closing', () => {
  const close = (uid) => updateDoc(doc(as(uid), 'rooms', 'r1'), { closedAt: serverTimestamp() })

  it('lets the owner close a room, and nobody else', async () => {
    await seed('r1', 'alice')
    await assertFails(close('bob'))
    await assertSucceeds(close('alice'))
  })

  it('keeps a closed room readable but never writable again', async () => {
    await seed('r1', 'alice', { closed: true })
    await seedKey('r1')
    await assertSucceeds(getDoc(doc(as(null), 'rooms', 'r1')))
    await assertFails(
      updateDoc(doc(as('alice'), 'rooms', 'r1'), {
        session: '{}',
        updatedAt: serverTimestamp(),
      })
    )
    await assertFails(close('alice'))
    await assertFails(writeResult('alice'))
    await assertFails(join('bob'))
  })

  it('treats a room idle for 12 hours as closed, though its owner may still close it', async () => {
    await seed('r1', 'alice', { ago: 13 * HOUR })
    await seedKey('r1')
    await assertFails(
      updateDoc(doc(as('alice'), 'rooms', 'r1'), {
        session: '{}',
        updatedAt: serverTimestamp(),
      })
    )
    await assertFails(writeResult('alice'))
    await assertFails(join('bob'))
    await assertSucceeds(close('alice'))
  })

  it('keeps a room open while it is still under 12 hours idle', async () => {
    await seed('r1', 'alice', { ago: 11 * HOUR })
    await assertSucceeds(
      updateDoc(doc(as('alice'), 'rooms', 'r1'), {
        session: '{}',
        updatedAt: serverTimestamp(),
      })
    )
  })
})
