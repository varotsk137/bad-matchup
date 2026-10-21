import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPublisher, packRoom, readRoomHash, unpackRoom } from './room'
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
    expect(readRoomHash()).toBe('AbCdEf0123456789XyZw')
    vi.stubGlobal('location', { hash: '#room=../../etc' })
    expect(readRoomHash()).toBeNull()
    vi.stubGlobal('location', { hash: '#s=1abc&m=v' })
    expect(readRoomHash()).toBeNull()
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
