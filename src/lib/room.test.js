import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ops } from './ops'
import {
  ROOM_IDLE_MS,
  buildRoomUrl,
  createPublisher,
  isRoomClosed,
  makeEditKey,
  mergeResults,
  packRoom,
  readRoomHash,
  resultOf,
  unpackRoom,
} from './room'
import { defaultState } from './storage'
import { createLocalStore } from './store'

function memoryStorage() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  }
}

describe('room payload', () => {
  it('carries the schedule and nothing that belongs to the device', () => {
    const state = { ...defaultState(), lang: 'en', rosters: [{ id: 'x' }] }
    const back = JSON.parse(packRoom(state))
    expect(Object.keys(back).sort()).toEqual(['courts', 'players', 'rounds'])
  })

  it('unpacks what it packs', () => {
    const state = defaultState()
    expect(unpackRoom(packRoom(state))).toEqual({
      players: state.players,
      courts: state.courts,
      rounds: state.rounds,
    })
  })

  it('rejects something that is not a room', () => {
    expect(() => unpackRoom('{"players":[]}')).toThrow()
  })
})

describe('room links', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reads a room id and ignores anything that is not one', () => {
    vi.stubGlobal('location', { hash: '#room=AbCdEf0123456789XyZw' })
    expect(readRoomHash()).toEqual({ id: 'AbCdEf0123456789XyZw', key: null })
    vi.stubGlobal('location', { hash: '#room=../../etc' })
    expect(readRoomHash()).toBeNull()
    vi.stubGlobal('location', { hash: '#s=1abc&m=v' })
    expect(readRoomHash()).toBeNull()
  })

  it('round-trips an edit link, and drops a key that is not one', () => {
    const key = makeEditKey()
    vi.stubGlobal('location', { href: 'https://x.test/', hash: '' })
    const url = buildRoomUrl('AbCdEf0123456789XyZw', key)
    vi.stubGlobal('location', { hash: url.slice(url.indexOf('#')) })
    expect(readRoomHash()).toEqual({ id: 'AbCdEf0123456789XyZw', key })
    vi.stubGlobal('location', { hash: '#room=AbCdEf0123456789XyZw&key=<script>' })
    expect(readRoomHash().key).toBeNull()
  })

  it('makes keys that are long, URL-safe and different every time', () => {
    const a = makeEditKey()
    expect(a).toMatch(/^[A-Za-z0-9_-]{22}$/)
    expect(makeEditKey()).not.toBe(a)
  })
})

describe('results', () => {
  const rounds = () => [
    {
      id: 'r1',
      benched: [],
      matches: [
        { id: 'm1', teamA: ['a'], teamB: ['b'] },
        { id: 'm2', teamA: ['c'], teamB: ['d'], done: true, scoreA: 21, scoreB: 10 },
      ],
    },
    { id: 'r2', benched: [], matches: [{ id: 'm3', teamA: ['a'], teamB: ['c'] }] },
  ]

  it('lays ticks and scores over the matches they belong to', () => {
    const before = rounds()
    const after = mergeResults(before, { m1: { done: true, scoreA: 21, scoreB: 19 } })
    expect(after[0].matches[0]).toMatchObject({ done: true, scoreA: 21, scoreB: 19 })
    // the untouched round is the very same object
    expect(after[1]).toBe(before[1])
    expect(after[0].matches[1]).toBe(before[0].matches[1])
  })

  it('can take a tick back', () => {
    const after = mergeResults(rounds(), { m2: { done: false, scoreA: null, scoreB: null } })
    expect(after[0].matches[1]).toMatchObject({ done: false, scoreA: null, scoreB: null })
  })

  it('hands back the same rounds when nothing differs or the match is gone', () => {
    const before = rounds()
    expect(mergeResults(before, { m2: resultOf(before[0].matches[1]) })).toBe(before)
    expect(mergeResults(before, { gone: { done: true, scoreA: 1, scoreB: 2 } })).toBe(before)
    expect(mergeResults(before, null)).toBe(before)
  })

  it('folds into the organiser’s copy only when something changed', () => {
    const s = { ...defaultState(), rounds: rounds() }
    expect(ops.applyResults(s, { m2: resultOf(s.rounds[0].matches[1]) })).toBe(s)
    const next = ops.applyResults(s, { m3: { done: true, scoreA: 15, scoreB: 21 } })
    expect(next.rounds[1].matches[0]).toMatchObject({ done: true, scoreA: 15, scoreB: 21 })
  })
})

describe('publisher', () => {
  let store
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('localStorage', memoryStorage())
    store = createLocalStore(defaultState())
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('sends once on start, then once per burst of changes', async () => {
    const write = vi.fn(async () => {})
    const stop = createPublisher({ store, write, delay: 100 })
    await vi.advanceTimersByTimeAsync(100)
    expect(write).toHaveBeenCalledTimes(1)

    store.dispatch('addPlayers', ['Ann'])
    store.dispatch('addPlayers', ['Bee'])
    await vi.advanceTimersByTimeAsync(100)
    expect(write).toHaveBeenCalledTimes(2)
    expect(unpackRoom(write.mock.calls[1][0]).players.map((p) => p.name)).toEqual([
      'Ann',
      'Bee',
    ])
    stop()
  })

  it('ignores changes that are not part of the room', async () => {
    const write = vi.fn(async () => {})
    const stop = createPublisher({ store, write, delay: 100 })
    await vi.advanceTimersByTimeAsync(100)
    store.dispatch('set', { theme: 'dark' })
    await vi.advanceTimersByTimeAsync(500)
    expect(write).toHaveBeenCalledTimes(1)
    stop()
  })

  it('follows a slow write with whatever changed meanwhile', async () => {
    let release
    const write = vi.fn(() => new Promise((r) => (release = r)))
    const status = []
    const stop = createPublisher({ store, write, delay: 100, onStatus: (s) => status.push(s) })
    await vi.advanceTimersByTimeAsync(100)
    expect(write).toHaveBeenCalledTimes(1)

    store.dispatch('addPlayers', ['Ann'])
    await vi.advanceTimersByTimeAsync(500)
    // still waiting on the first one — never two at once
    expect(write).toHaveBeenCalledTimes(1)

    release()
    await vi.advanceTimersByTimeAsync(100)
    expect(write).toHaveBeenCalledTimes(2)
    expect(unpackRoom(write.mock.calls[1][0]).players.map((p) => p.name)).toEqual(['Ann'])
    release()
    await vi.advanceTimersByTimeAsync(0)
    expect(status.at(-1)).toBe('synced')
    stop()
  })

  it('reports a failed write', async () => {
    const write = vi.fn(async () => {
      throw new Error('permission-denied')
    })
    const status = []
    const stop = createPublisher({ store, write, delay: 100, onStatus: (s) => status.push(s) })
    await vi.advanceTimersByTimeAsync(100)
    expect(status).toEqual(['sending', 'error'])
    stop()
  })

  it('sends nothing after it is stopped', async () => {
    const write = vi.fn(async () => {})
    const stop = createPublisher({ store, write, delay: 100 })
    stop()
    store.dispatch('addPlayers', ['Ann'])
    await vi.advanceTimersByTimeAsync(500)
    expect(write).not.toHaveBeenCalled()
  })
})

describe('closing by itself', () => {
  const now = Date.UTC(2026, 9, 22, 12)
  const h = 3600 * 1000

  it('counts a room closed once its owner closed it', () => {
    expect(isRoomClosed({ updatedAt: now, closedAt: now }, now)).toBe(true)
  })

  it('counts a room closed after 12 hours without an update, not before', () => {
    expect(isRoomClosed({ updatedAt: now - 11 * h, closedAt: null }, now)).toBe(false)
    expect(isRoomClosed({ updatedAt: now - 13 * h, closedAt: null }, now)).toBe(true)
    expect(ROOM_IDLE_MS).toBe(12 * h)
  })

  it('does not guess when it has no time to go on', () => {
    expect(isRoomClosed({ updatedAt: null, closedAt: null }, now)).toBe(false)
  })
})
