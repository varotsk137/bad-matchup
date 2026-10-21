/**
 * Whatever was saved — by this version, an older one, a hand-edited backup or
 * plain garbage — must come back as a complete state the app can run on.
 */
import { describe, expect, it } from 'vitest'
import { DEVICE_KEYS, SCHEMA_VERSION, SESSION_KEYS, defaultState, hydrate } from './storage'

describe('hydrate', () => {
  it('gives the defaults for nothing or garbage', () => {
    for (const raw of [null, undefined, 42, 'text']) {
      const s = hydrate(raw)
      expect(s.players).toEqual([])
      expect(s.courts).toHaveLength(2)
      expect(s.version).toBe(SCHEMA_VERSION)
    }
  })

  it('fills in whatever an old or partial save is missing', () => {
    const s = hydrate({ version: 1, lang: 'en', players: [{ id: 'a', name: 'Ann' }] })
    expect(s.lang).toBe('en')
    expect(s.players).toHaveLength(1)
    expect(s.rounds).toEqual([])
    expect(s.rosters).toEqual([])
    expect(s.presets).toEqual([])
    expect(s.options).toEqual(defaultState().options)
  })

  it('replaces parts that are the wrong shape', () => {
    const s = hydrate({
      players: 'oops',
      courts: [],
      rounds: {},
      skin: 'nope',
      theme: 'system',
    })
    expect(s.players).toEqual([])
    expect(s.courts).toHaveLength(2)
    expect(s.rounds).toEqual([])
    expect(s.skin).toBe(defaultState().skin)
    expect(['light', 'dark']).toContain(s.theme)
  })

  it('maps settings that no longer exist onto their stand-ins', () => {
    expect(hydrate({ options: { mode: 'rotation' } }).options.mode).toBe('balanced')
  })

  it('keeps settings it does not know about, for a newer version to find', () => {
    const s = hydrate({ version: SCHEMA_VERSION + 1, futureThing: 1 })
    expect(s.futureThing).toBe(1)
    expect(s.version).toBe(SCHEMA_VERSION + 1)
  })

  it('splits every saved key into session or device, with no overlap', () => {
    const keys = Object.keys(defaultState()).filter((k) => k !== 'version')
    expect([...SESSION_KEYS, ...DEVICE_KEYS].sort()).toEqual(keys.sort())
  })
})
