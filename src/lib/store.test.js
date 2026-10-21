import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultState } from './storage'
import { createLocalStore } from './store'

function memoryStorage() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    data,
  }
}

describe('local store', () => {
  let storage
  beforeEach(() => {
    storage = memoryStorage()
    vi.stubGlobal('localStorage', storage)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('runs a named op and tells subscribers', () => {
    const store = createLocalStore(defaultState())
    const seen = vi.fn()
    store.subscribe(seen)
    store.dispatch('addPlayers', ['Ann'])
    expect(store.getState().players.map((p) => p.name)).toEqual(['Ann'])
    expect(seen).toHaveBeenCalledTimes(1)
  })

  it('stays quiet when an op changes nothing', () => {
    const store = createLocalStore(defaultState())
    const seen = vi.fn()
    store.subscribe(seen)
    store.dispatch('applyPreset', 'missing')
    expect(seen).not.toHaveBeenCalled()
  })

  it('stops calling a listener once it unsubscribes', () => {
    const store = createLocalStore(defaultState())
    const seen = vi.fn()
    const off = store.subscribe(seen)
    off()
    store.dispatch('addPlayers', ['Ann'])
    expect(seen).not.toHaveBeenCalled()
  })

  it('refuses an op that does not exist', () => {
    const store = createLocalStore(defaultState())
    expect(() => store.dispatch('nope')).toThrow(/Unknown op/)
  })

  it('saves once per burst of changes, and the save loads back', async () => {
    const store = createLocalStore(defaultState())
    const save = vi.spyOn(storage, 'setItem')
    store.dispatch('addPlayers', ['Ann'])
    store.dispatch('addPlayers', ['Bee'])
    expect(save).not.toHaveBeenCalled()
    await Promise.resolve()
    expect(save).toHaveBeenCalledTimes(1)

    const again = createLocalStore()
    expect(again.getState().players.map((p) => p.name)).toEqual(['Ann', 'Bee'])
  })
})
