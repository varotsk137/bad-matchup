/**
 * Shared helpers for the matchmaker tests. Math.random is replaced by a seeded
 * generator so every run is repeatable.
 */
import { afterEach, expect, vi } from 'vitest'
import { generateRounds } from './matchmaker'

/* ---------------------------------------------------------------- helpers */

function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const seeded = (seed) => vi.spyOn(Math, 'random').mockImplementation(mulberry32(seed))
afterEach(() => vi.restoreAllMocks())

export const players = (n, level = 1) =>
  Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `P${i}`, level, gender: '-' }))
export const courts = (n, type = 'doubles') =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, name: `${i + 1}`, type }))

export const FAST = { fairestOfThree: false }

export function build(n, c, count, options = {}, seed = 1) {
  seeded(seed)
  const ps = players(n)
  const res = generateRounds({
    players: ps,
    courts: courts(c),
    rounds: [],
    weights: {},
    options: { ...FAST, ...options },
    count,
  })
  expect(res.error).toBeUndefined()
  return { ps, rounds: res.created }
}

const key = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/** Everything the assertions look at, in one pass. */
export function analyse(ps, rounds) {
  const ids = ps.map((p) => p.id)
  const partner = new Map()
  const games = Object.fromEntries(ids.map((id) => [id, 0]))
  const streak = {}
  const rest = {}
  let longestPlay = 0
  let longestRest = 0
  let backToBackSingles = 0
  let lastSingles = new Set()
  for (const r of rounds) {
    const on = new Set()
    const singles = new Set()
    for (const m of r.matches) {
      for (const id of [...m.teamA, ...m.teamB]) {
        on.add(id)
        games[id]++
        if (m.type === 'singles') singles.add(id)
      }
      for (const t of [m.teamA, m.teamB])
        if (t.length === 2) partner.set(key(...t), (partner.get(key(...t)) || 0) + 1)
    }
    for (const id of singles) if (lastSingles.has(id)) backToBackSingles++
    lastSingles = singles
    for (const id of ids) {
      streak[id] = on.has(id) ? (streak[id] || 0) + 1 : 0
      rest[id] = on.has(id) ? 0 : (rest[id] || 0) + 1
      longestPlay = Math.max(longestPlay, streak[id])
      longestRest = Math.max(longestRest, rest[id])
    }
  }
  let neverPartnered = 0
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++)
      if (!partner.get(key(ids[i], ids[j]))) neverPartnered++
  const g = Object.values(games)
  return {
    neverPartnered,
    gamesSpread: Math.max(...g) - Math.min(...g),
    longestPlay,
    longestRest,
    backToBackSingles,
  }
}

/** Shape checks every round must pass, whatever the mode. */
export function expectValidRound(round, ps, cs) {
  const pool = new Set(ps.map((p) => p.id))
  const seen = new Set()
  for (const m of round.matches) {
    const size = m.teamA.length + m.teamB.length
    expect(m.teamA.length).toBe(m.teamB.length)
    expect([2, 4]).toContain(size)
    expect(m.type).toBe(size === 2 ? 'singles' : 'doubles')
    expect(cs.some((c) => c.id === m.courtId)).toBe(true)
    for (const id of [...m.teamA, ...m.teamB]) {
      expect(pool.has(id)).toBe(true)
      expect(seen.has(id)).toBe(false) // nobody twice in one round
      seen.add(id)
    }
  }
  const courtIds = round.matches.map((m) => m.courtId)
  expect(new Set(courtIds).size).toBe(courtIds.length) // one match per court
  for (const id of round.benched) {
    expect(seen.has(id)).toBe(false)
    expect(pool.has(id)).toBe(true)
  }
  expect(seen.size + round.benched.length).toBe(pool.size) // everyone accounted for
}

export const SEEDS = [1, 2, 3]
