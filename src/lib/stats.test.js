/**
 * The Stats tab must judge people by the rounds they were actually there for:
 * someone who left early or arrived late is not "unfair", and two people who
 * were never there at the same time cannot have partnered.
 */
import { describe, expect, it } from 'vitest'
import { analyse } from '../components/FairnessReport'
import { generateRounds, makeContext } from './matchmaker'
import { courts, FAST, players, seeded } from './testkit'

function session() {
  seeded(31)
  const ps = players(9)
  const cs = courts(1)
  // p8 plays rounds 1–10 and leaves; "late" arrives for rounds 11–20
  const first = generateRounds({
    players: ps,
    courts: cs,
    rounds: [],
    options: FAST,
    count: 10,
  }).created
  const after = [...ps.slice(0, 8), { id: 'late', name: 'Late', level: 1 }]
  const second = generateRounds({
    players: after,
    courts: cs,
    rounds: first,
    options: FAST,
    count: 10,
  }).created
  const everyone = [...ps, { id: 'late', name: 'Late', level: 1 }]
  return { everyone, rounds: [...first, ...second] }
}

describe('stats for people who came and went', () => {
  it('records when each person was there', () => {
    const { everyone, rounds } = session()
    const { stats } = makeContext(everyone, rounds)
    expect(stats.p8).toMatchObject({ present: 10, firstPresent: 0, lastPresent: 9 })
    expect(stats.late).toMatchObject({ present: 10, firstPresent: 10, lastPresent: 19 })
    expect(stats.p0.present).toBe(20)
  })

  it('a leaver and a latecomer never overlapped, so they do not count as "never partnered"', () => {
    const { everyone, rounds } = session()
    const r = analyse({ players: everyone, rounds })
    expect(r.neverMet).toBe(1) // p8 and Late
    expect(r.pairs).toBe((10 * 9) / 2 - 1)
  })

  it('games are judged against each person’s fair share', () => {
    const { everyone, rounds } = session()
    const r = analyse({ players: everyone, rounds })
    expect(r.partTime).toBe(true)
    // raw totals differ a lot (part-timers have about half), the fair-share
    // spread stays small
    expect(r.gamesMax - r.gamesMin).toBeGreaterThan(2)
    expect(r.loadSpread).toBeLessThanOrEqual(2)
  })

  it('the rounds after someone went home are not counted as resting', () => {
    const { everyone, rounds } = session()
    expect(analyse({ players: everyone, rounds }).longestRest).toBeLessThanOrEqual(3)
  })
})
