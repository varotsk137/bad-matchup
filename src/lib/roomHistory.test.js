import { beforeEach, describe, expect, it } from 'vitest'
import {
  HISTORY_MAX,
  clearHistory,
  forgetVisit,
  loadHistory,
  recordVisit,
  summarize,
  visitClosed,
} from './roomHistory'
import { ROOM_IDLE_MS } from './room'

// vitest runs in node: a tiny stand-in for the browser's localStorage
beforeEach(() => {
  const data = new Map()
  globalThis.localStorage = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  }
})

describe('room history', () => {
  it('starts empty and survives garbage in storage', () => {
    expect(loadHistory()).toEqual([])
    localStorage.setItem('bad-matchup:room-history', '{not json')
    expect(loadHistory()).toEqual([])
  })

  it('puts the latest visit first and never lists a room twice', () => {
    recordVisit({ id: 'a' }, 1)
    recordVisit({ id: 'b' }, 2)
    recordVisit({ id: 'a', rounds: 5 }, 3)
    const list = loadHistory()
    expect(list.map((v) => v.id)).toEqual(['a', 'b'])
    expect(list[0]).toMatchObject({ rounds: 5, lastAt: 3 })
  })

  it('keeps an edit key once seen, and marks the visit as an edit link', () => {
    recordVisit({ id: 'a', key: 'secret-key-0123456' }, 1)
    recordVisit({ id: 'a' }, 2)
    expect(loadHistory()[0]).toMatchObject({ key: 'secret-key-0123456', role: 'edit' })
  })

  it("keeps the organiser's own room marked as theirs", () => {
    recordVisit({ id: 'a', role: 'own' }, 1)
    recordVisit({ id: 'a', role: 'watch' }, 2)
    expect(loadHistory()[0].role).toBe('own')
  })

  it(`holds at most ${HISTORY_MAX} rooms, dropping the oldest`, () => {
    for (let i = 0; i < HISTORY_MAX + 5; i++) recordVisit({ id: `r${i}` }, i)
    const list = loadHistory()
    expect(list).toHaveLength(HISTORY_MAX)
    expect(list.at(-1).id).toBe('r5')
  })

  it('forgets one room or all of them', () => {
    recordVisit({ id: 'a' }, 1)
    recordVisit({ id: 'b' }, 2)
    expect(forgetVisit('a').map((v) => v.id)).toEqual(['b'])
    expect(clearHistory()).toEqual([])
    expect(loadHistory()).toEqual([])
  })

  it('summarises a session without deleted players', () => {
    const session = {
      players: [
        { name: 'ต้น' },
        { name: 'ฝน', deleted: true },
        { name: 'โอ๊ค' },
        { name: 'เจ' },
        { name: 'นัท' },
      ],
      rounds: [{}, {}],
    }
    expect(summarize(session)).toEqual({ names: ['ต้น', 'โอ๊ค', 'เจ'], players: 4, rounds: 2 })
  })

  it('judges closed the same way rooms do', () => {
    expect(visitClosed({ closedAt: 5, updatedAt: 1 }, 10)).toBe(true)
    expect(visitClosed({ closedAt: null, updatedAt: 0 }, ROOM_IDLE_MS + 1)).toBe(true)
    expect(visitClosed({ closedAt: null, updatedAt: 0 }, 1000)).toBe(false)
  })
})
