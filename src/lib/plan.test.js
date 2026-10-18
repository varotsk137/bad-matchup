import { describe, expect, it } from 'vitest'
import { generateRounds, swapSlots } from './matchmaker'
import { planKey } from './plan'
import { analyse, build, courts, FAST, players, seeded } from './testkit'

const situation = (rounds, extra = {}) => ({
  players: players(9),
  courts: courts(1),
  options: FAST,
  weights: {},
  rounds,
  ...extra,
})

describe('planned rounds', () => {
  it('ticking a match done or scoring it keeps the plan', () => {
    const { rounds } = build(9, 1, 3)
    const before = planKey(situation(rounds))
    const ticked = rounds.map((r) => ({
      ...r,
      matches: r.matches.map((m) => ({ ...m, done: true, scoreA: 21, scoreB: 12 })),
    }))
    expect(planKey(situation(ticked))).toBe(before)
  })

  it('a swap, a player leaving, or a setting change throws it away', () => {
    const { rounds } = build(9, 1, 3)
    const before = planKey(situation(rounds))
    const m = rounds[0].matches[0]
    const swapped = [
      swapSlots(
        rounds[0],
        { matchId: m.id, team: 'A', idx: 0 },
        { bench: true, playerId: rounds[0].benched[0] }
      ),
      ...rounds.slice(1),
    ]
    expect(planKey(situation(swapped))).not.toBe(before)

    const left = players(9)
    left[3].active = false
    expect(planKey(situation(rounds, { players: left }))).not.toBe(before)
    expect(planKey(situation(rounds, { options: { ...FAST, maxConsecutive: 3 } }))).not.toBe(
      before
    )
  })

  it('revealing a plan one round at a time is as good as building it all at once', () => {
    // 20 taps of "add a round" against one 20-round plan — the old way
    // (each round on its own) left 1–3 pairs who never partnered
    seeded(21)
    const ps = players(9)
    const plan = generateRounds({
      players: ps,
      courts: courts(1),
      rounds: [],
      options: FAST,
      count: 20,
    }).created
    const revealed = []
    for (const r of plan) revealed.push(r)
    expect(analyse(ps, revealed).neverPartnered).toBe(0)
  })
})
