/**
 * Rules every schedule must follow, whatever the seed or search effort:
 * well-formed rounds, the stamina limits of each rest mode, court use, and
 * the editing tools. Most run at effort 'fast' — a rule that only holds when
 * the search is thorough is not a rule.
 */
import { describe, expect, it } from 'vitest'
import {
  createEmptyRound,
  fillRound,
  generateRound,
  generateRounds,
  generateRoundsAsync,
  playedRounds,
  roundsForTime,
  suggestRounds,
  swapSlots,
} from './matchmaker'
import {
  analyse,
  build,
  courts,
  expectValidRound,
  FAST,
  players,
  SEEDS,
  seeded,
} from './testkit'

const QUICK = { effort: 'fast' }

/* ------------------------------------------------------------ the rules */

describe('every round is well formed', () => {
  for (const mode of ['balanced', 'random']) {
    it(`${mode}: 9 players, 2 courts`, () => {
      const cs = courts(2)
      const { ps, rounds } = build(9, 2, 12, { mode })
      expect(rounds).toHaveLength(12)
      for (const r of rounds) expectValidRound(r, ps, cs)
    })
  }

  it('a saved "rotation" setting from v1 falls back to balanced', () => {
    seeded(13)
    const { round } = generateRound({
      players: players(9),
      courts: courts(1),
      rounds: [],
      options: { ...FAST, mode: 'rotation' },
    })
    expect(round.mode).toBe('balanced')
  })

  it('reports errors instead of building nonsense', () => {
    expect(generateRound({ players: players(9), courts: [], rounds: [] }).error).toBe(
      'no_courts'
    )
    expect(generateRound({ players: players(1), courts: courts(1), rounds: [] }).error).toBe(
      'not_enough_players'
    )
  })

  it('skips players marked resting or inactive', () => {
    seeded(4)
    const ps = players(8)
    ps[0].resting = true
    ps[1].active = false
    const { round } = generateRound({
      players: ps,
      courts: courts(1),
      rounds: [],
      options: FAST,
    })
    const ids = [...round.matches.flatMap((m) => [...m.teamA, ...m.teamB]), ...round.benched]
    expect(ids).not.toContain('p0')
    expect(ids).not.toContain('p1')
  })
})

describe('stamina', () => {
  const cases = [
    [5, 1],
    [6, 2],
    [7, 2],
    [9, 2],
    [11, 2],
    [13, 3],
  ]

  for (const [n, c] of cases) {
    it(`rest on time never goes past the limit: ${n} players, ${c} courts`, () => {
      for (const seed of SEEDS) {
        const { ps, rounds } = build(n, c, 20, { ...QUICK, restMode: 'strict' }, seed)
        expect(analyse(ps, rounds).longestPlay).toBeLessThanOrEqual(2)
      }
    })

    it(`flexible goes at most one round over: ${n} players, ${c} courts`, () => {
      for (const seed of SEEDS) {
        const { ps, rounds } = build(n, c, 20, { ...QUICK, restMode: 'flex' }, seed)
        expect(analyse(ps, rounds).longestPlay).toBeLessThanOrEqual(3)
      }
    })
  }

  it('respects a different limit', () => {
    const { ps, rounds } = build(9, 2, 20, { restMode: 'strict', maxConsecutive: 1 })
    expect(analyse(ps, rounds).longestPlay).toBeLessThanOrEqual(1)
  })

  it('fill keeps every court running (the original behaviour)', () => {
    const { rounds } = build(9, 2, 12, { restMode: 'fill' })
    for (const r of rounds) expect(r.matches.map((m) => m.type)).toEqual(['doubles', 'doubles'])
  })

  it('stamina off ignores the rest mode entirely', () => {
    const { rounds } = build(9, 2, 12, { useStamina: false, restMode: 'strict' })
    for (const r of rounds) expect(r.matches.map((m) => m.type)).toEqual(['doubles', 'doubles'])
  })
})

describe('courts', () => {
  it('never leaves a court empty when splitting into singles is allowed', () => {
    for (const seed of SEEDS) {
      const { rounds } = build(9, 2, 20, { ...QUICK, restMode: 'flex' }, seed)
      for (const r of rounds) expect(r.matches).toHaveLength(2)
    }
  })

  it('can leave a court empty when splitting is switched off', () => {
    const { rounds } = build(6, 2, 12, { restMode: 'strict', fillIdleCourts: false })
    expect(rounds.some((r) => r.matches.length < 2)).toBe(true)
  })

  it('does not give anyone singles twice in a row when it can be avoided', () => {
    for (const seed of SEEDS) {
      const { ps, rounds } = build(9, 2, 20, { ...QUICK, restMode: 'strict' }, seed)
      expect(analyse(ps, rounds).backToBackSingles).toBe(0)
    }
  })

  it('runs a singles court as singles', () => {
    const cs = [...courts(1), { id: 's', name: 'S', type: 'singles' }]
    seeded(5)
    const { round } = generateRound({
      players: players(6),
      courts: cs,
      rounds: [],
      options: FAST,
    })
    expect(round.matches.find((m) => m.courtId === 's').type).toBe('singles')
  })
})

/* ---------------------------------------------------------- editing tools */

describe('editing a round', () => {
  it('swaps a court seat with a bench seat', () => {
    seeded(8)
    const { round } = generateRound({
      players: players(6),
      courts: courts(1),
      rounds: [],
      options: FAST,
    })
    const m = round.matches[0]
    const out = m.teamA[0]
    const inn = round.benched[0]
    const next = swapSlots(
      round,
      { matchId: m.id, team: 'A', idx: 0 },
      { bench: true, playerId: inn }
    )
    expect(next.matches[0].teamA[0]).toBe(inn)
    expect(next.benched).toContain(out)
    expect(next.benched).not.toContain(inn)
  })

  it('auto-fill keeps the players already placed', () => {
    seeded(9)
    const ps = players(8)
    const { round } = createEmptyRound({ players: ps, courts: courts(1) })
    round.matches[0].teamA[0] = 'p3'
    const { round: filled } = fillRound({
      round,
      players: ps,
      courts: courts(1),
      rounds: [round],
      options: FAST,
    })
    expect(filled.matches[0].teamA[0]).toBe('p3')
    expect([...filled.matches[0].teamA, ...filled.matches[0].teamB].every(Boolean)).toBe(true)
    expectValidRound(filled, ps, courts(1))
  })
})

describe('async build', () => {
  it('reports progress and returns the rounds', async () => {
    seeded(10)
    const progress = []
    const res = await generateRoundsAsync({
      players: players(9),
      courts: courts(1),
      rounds: [],
      weights: {},
      options: { fairestOfThree: true },
      count: 6,
      onProgress: (...args) => progress.push(args),
    })
    expect(res.created).toHaveLength(6)
    expect(progress.some(([, , phase]) => phase === 'polish')).toBe(true)
    expect(Math.max(...progress.map((p) => p[3] || 1))).toBe(3) // three builds
  })

  it('cancel keeps what was built', async () => {
    seeded(11)
    let calls = 0
    const res = await generateRoundsAsync({
      players: players(9),
      courts: courts(1),
      rounds: [],
      weights: {},
      options: FAST,
      count: 10,
      shouldCancel: () => ++calls > 4,
    })
    expect(res.cancelled).toBe(true)
    expect(res.created.length).toBeGreaterThan(0)
  })
})

describe('played vs planned rounds', () => {
  const round = (...matches) => ({ matches })
  const m = (extra = {}) => ({
    teamA: ['a', 'b'],
    teamB: ['c', 'd'],
    scoreA: null,
    scoreB: null,
    ...extra,
  })

  it('counts up to the last round with a played match', () => {
    expect(playedRounds([])).toBe(0)
    expect(playedRounds([round(m()), round(m())])).toBe(0)
    expect(playedRounds([round(m({ done: true })), round(m())])).toBe(1)
    // a half-played round counts, and so does everything before it
    expect(playedRounds([round(m()), round(m({ done: true }), m()), round(m())])).toBe(2)
    expect(playedRounds([round(m({ scoreA: 21, scoreB: 15 })), round(m())])).toBe(1)
  })

  it('rebuilding what is left keeps the played rounds and counts their games', () => {
    seeded(12)
    const ps = players(9)
    const cs = courts(1)
    const first = build(9, 1, 6, { restMode: 'strict' }, 12).rounds
    first[0].matches[0].done = true
    first[1].matches[0].done = true
    const kept = first.slice(0, playedRounds(first))
    const rest = generateRounds({
      players: ps,
      courts: cs,
      rounds: kept,
      weights: {},
      options: { ...FAST, restMode: 'strict' },
      count: first.length - kept.length,
    }).created
    const all = [...kept, ...rest]
    expect(all).toHaveLength(6)
    expect(all.slice(0, 2)).toEqual(first.slice(0, 2))
    // the stamina rule runs across the join between old and new rounds
    expect(analyse(ps, all).longestPlay).toBeLessThanOrEqual(2)
    for (const r of rest) expectValidRound(r, ps, cs)
  })
})

describe('late arrivals', () => {
  it('someone joining halfway is not pushed on court to catch up', () => {
    for (const seed of SEEDS) {
      seeded(seed)
      const early = players(8)
      const cs = courts(1)
      const first = generateRounds({
        players: early,
        courts: cs,
        rounds: [],
        options: FAST,
        count: 10,
      }).created
      const all = [...early, { id: 'late', name: 'Late', level: 1 }]
      const second = generateRounds({
        players: all,
        courts: cs,
        rounds: first,
        options: FAST,
        count: 10,
      }).created
      const games = Object.fromEntries(all.map((p) => [p.id, 0]))
      for (const r of second)
        for (const m of r.matches) for (const id of [...m.teamA, ...m.teamB]) games[id]++
      const others = early.map((p) => games[p.id])
      // the old engine gave the latecomer 7 of 10 while everyone else got 4–5
      expect(games.late).toBeLessThanOrEqual(Math.max(...others))
      expect(games.late).toBeGreaterThanOrEqual(Math.min(...others) - 1)
    }
  })
})

describe('round suggestions', () => {
  const suggest = (n, c, options = {}) =>
    suggestRounds({ players: players(n), courts: courts(c), options })

  it('rounds for everyone to partner everyone, with even games when cheap', () => {
    // 36 pairs, 2 partner slots a round → 18, and 18 × 4 seats ÷ 9 = 8 games each
    expect(suggest(9, 1)).toMatchObject({ coverAll: 18, gamesEach: 8 })
    expect(suggest(8, 1)).toMatchObject({ coverAll: 14, gamesEach: 7 })
  })

  it('counts the seats the rest mode will really open', () => {
    // 9 on two courts but at most 2 in a row: about 6 seats, one doubles court
    expect(suggest(9, 2, { restMode: 'strict' }).coverAll).toBe(18)
    // filling every court gives two doubles courts → half the rounds
    expect(suggest(9, 2, { restMode: 'fill' }).coverAll).toBe(9)
  })

  it('nothing to suggest for partners on singles-only courts', () => {
    const r = suggestRounds({ players: players(6), courts: courts(2, 'singles'), options: {} })
    expect(r.coverAll).toBeNull()
  })

  it('a court booking turns into rounds', () => {
    expect(roundsForTime(2, 15)).toBe(8)
    expect(roundsForTime(1.5, 12)).toBe(7)
  })

  it('the engine really does cover everyone in the suggested rounds', () => {
    const { coverAll } = suggest(9, 1)
    const { ps, rounds } = build(9, 1, coverAll)
    expect(analyse(ps, rounds).neverPartnered).toBe(0)
  })
})
