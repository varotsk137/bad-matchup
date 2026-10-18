/**
 * Quality levels measured while tuning the engine, at default settings. If a
 * change drops below one of these, it made the pairing worse — even if every
 * rule still holds.
 */
import { describe, expect, it } from 'vitest'
import { analyse, build, SEEDS } from './testkit'

/* -------------------------------------------------------- the quality bar */

describe('pairing quality (balanced, default settings)', () => {
  it('9 players, 1 court, 20 rounds: everyone partners everyone', () => {
    for (const seed of SEEDS) {
      const { ps, rounds } = build(9, 1, 20, {}, seed)
      const a = analyse(ps, rounds)
      expect(a.neverPartnered).toBe(0)
      expect(a.gamesSpread).toBeLessThanOrEqual(1)
      expect(a.longestRest).toBeLessThanOrEqual(2)
    }
  })

  it('8 players, 1 court, 14 rounds: every pair exactly once', () => {
    const { ps, rounds } = build(8, 1, 14)
    expect(analyse(ps, rounds).neverPartnered).toBe(0)
  })

  it('6 players, 1 court: equal games', () => {
    const { ps, rounds } = build(6, 1, 15)
    expect(analyse(ps, rounds).gamesSpread).toBe(0)
  })

  it('build 3 times is at least as good as one build', () => {
    const one = analyse(...Object.values(build(10, 1, 23, { fairestOfThree: false }, 7)))
    const three = analyse(...Object.values(build(10, 1, 23, { fairestOfThree: true }, 7)))
    expect(three.neverPartnered).toBeLessThanOrEqual(one.neverPartnered)
  })
})
