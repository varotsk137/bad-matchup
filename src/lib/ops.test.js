/**
 * The named changes in ops.js are the only way the app edits its data, so
 * each one must be pure (leave the old state alone) and do exactly what the
 * screen that calls it promises.
 */
import { describe, expect, it } from 'vitest'
import { ops } from './ops'
import { defaultState } from './storage'

const player = (id, name = id) => ({
  id,
  name,
  level: 3,
  gender: '-',
  active: true,
  resting: false,
})

function sample() {
  const s = defaultState()
  const [c1] = s.courts
  return {
    ...s,
    players: ['a', 'b', 'c', 'd', 'e'].map((id) => player(id)),
    rounds: [
      {
        id: 'r1',
        benched: ['e'],
        matches: [{ id: 'm1', courtId: c1.id, teamA: ['a', 'b'], teamB: ['c', 'd'] }],
      },
    ],
  }
}

describe('ops', () => {
  it('never mutates the state it is given', () => {
    const s = sample()
    const frozen = JSON.stringify(s)
    ops.addPlayers(s, ['x'])
    ops.removePlayer(s, 'a')
    ops.toggleMatchDone(s, 'r1', 'm1')
    ops.updateMatch(s, 'r1', 'm1', { scoreA: 21 })
    ops.swapInRound(
      s,
      'r1',
      { matchId: 'm1', team: 'A', idx: 0 },
      { bench: true, playerId: 'e' }
    )
    expect(JSON.stringify(s)).toBe(frozen)
  })

  it('adds new players present, at the starting level', () => {
    const next = ops.addPlayers(sample(), ['Somchai', 'Pook'])
    const added = next.players.slice(-2)
    expect(added.map((p) => p.name)).toEqual(['Somchai', 'Pook'])
    expect(added.every((p) => p.active && !p.resting && p.level === 1 && p.id)).toBe(true)
  })

  it('hides a player who already played instead of deleting them', () => {
    const s = sample()
    const used = ops.removePlayer(s, 'a')
    expect(used.players.find((p) => p.id === 'a')).toMatchObject({
      deleted: true,
      active: false,
    })

    // someone who never played is simply gone
    const withNew = ops.addPlayers(s, ['New'])
    const newId = withNew.players.at(-1).id
    expect(ops.removePlayer(withNew, newId).players.some((p) => p.id === newId)).toBe(false)
  })

  it('ticks and unticks a match', () => {
    const once = ops.toggleMatchDone(sample(), 'r1', 'm1')
    expect(once.rounds[0].matches[0].done).toBe(true)
    expect(ops.toggleMatchDone(once, 'r1', 'm1').rounds[0].matches[0].done).toBe(false)
  })

  it('keeps the played rounds when the rest are rebuilt', () => {
    const s = { ...sample(), rounds: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }] }
    const next = ops.replaceRoundsFrom(s, 1, [{ id: 'n2' }, { id: 'n3' }, { id: 'n4' }])
    expect(next.rounds.map((r) => r.id)).toEqual(['r1', 'n2', 'n3', 'n4'])
  })

  it('appends a roster without doubling names already here', () => {
    const s = {
      ...sample(),
      rosters: [{ id: 'tue', name: 'Tue', players: [{ name: 'a' }, { name: 'Late' }] }],
    }
    const appended = ops.loadRoster(s, 'tue', 'append')
    expect(appended.players.map((p) => p.name)).toEqual(['a', 'b', 'c', 'd', 'e', 'Late'])
    expect(appended.rounds).toHaveLength(1)

    const replaced = ops.loadRoster(s, 'tue')
    expect(replaced.players.map((p) => p.name)).toEqual(['a', 'Late'])
    expect(replaced.rounds).toEqual([])
  })

  it('keeps court ids by name when a preset is applied', () => {
    const s = ops.savePreset(sample(), 'Tuesday')
    const [preset] = s.presets
    const applied = ops.applyPreset(
      { ...s, options: { ...s.options, maxConsecutive: 4 } },
      preset.id
    )
    expect(applied.courts.map((c) => c.id)).toEqual(s.courts.map((c) => c.id))
    expect(applied.options.maxConsecutive).toBe(s.options.maxConsecutive)
  })

  it('returns the same object when there is nothing to do', () => {
    const s = sample()
    expect(ops.applyPreset(s, 'missing')).toBe(s)
    expect(ops.loadRoster(s, 'missing')).toBe(s)
  })

  it('resets the session but keeps how the app looks', () => {
    const s = { ...sample(), lang: 'en', theme: 'dark', skin: 'league' }
    const next = ops.reset(s, defaultState())
    expect(next.players).toEqual([])
    expect(next).toMatchObject({ lang: 'en', theme: 'dark', skin: 'league' })
  })
})
