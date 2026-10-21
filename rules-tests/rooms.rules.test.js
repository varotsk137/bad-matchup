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

/** A room owned by `owner`, written past the rules. */
async function seed(id, owner) {
  await env.withSecurityRulesDisabled((ctx) =>
    setDoc(doc(ctx.firestore(), 'rooms', id), {
      ...room(owner),
      createdAt: new Date(0),
      updatedAt: new Date(0),
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
