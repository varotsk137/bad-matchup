import { describe, expect, it } from 'vitest'
import { rosterChange } from './roster'
import { build, players } from './testkit'

describe('roster change since the schedule was built', () => {
  it('nothing to report when everyone in the plan is still here', () => {
    const { ps, rounds } = build(9, 1, 6)
    expect(rosterChange({ players: ps, rounds })).toBeNull()
  })

  it('spots someone who left and someone who arrived', () => {
    const { ps, rounds } = build(9, 1, 6)
    rounds[0].matches[0].done = true // round 1 is played
    const now = [
      ...ps.map((p) => (p.id === 'p2' ? { ...p, active: false } : p)),
      { id: 'new', name: 'New', level: 1 },
    ]
    const change = rosterChange({ players: now, rounds })
    expect(change.gone).toEqual(['p2'])
    expect(change.arrived).toEqual(['new'])
    expect(change.upcoming).toBe(5)
  })

  it('only the rounds still to come matter', () => {
    const { ps, rounds } = build(9, 1, 3)
    for (const r of rounds) r.matches[0].done = true // everything played
    const now = ps.map((p) => (p.id === 'p2' ? { ...p, active: false } : p))
    expect(rosterChange({ players: now, rounds })).toBeNull()
    expect(rosterChange({ players: players(9), rounds: [] })).toBeNull()
  })
})
