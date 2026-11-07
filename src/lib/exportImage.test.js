import { describe, expect, it } from 'vitest'
import { playerCount, posterDpr } from './exportImage'

describe('posterDpr', () => {
  it('keeps the device sharpness, at least 2x and at most 3x', () => {
    expect(posterDpr(1080, 1500, 1)).toBe(2)
    expect(posterDpr(1080, 1500, 2.625)).toBe(2.625)
    expect(posterDpr(1080, 1500, 4)).toBe(3)
  })

  it('drops below 2x for a tall poster so the canvas stays under the iOS limit', () => {
    const w = 1080
    const h = 8000
    const dpr = posterDpr(w, h, 3)
    expect(dpr).toBeLessThan(2)
    expect(w * h * dpr * dpr).toBeLessThanOrEqual(16_000_000)
  })
})

describe('playerCount', () => {
  it('counts everyone once, on court or sitting out, and skips empty slots', () => {
    const rounds = [
      { matches: [{ teamA: ['a', 'b'], teamB: ['c', null] }], benched: ['d'] },
      { matches: [{ teamA: ['a'], teamB: ['d'] }], benched: ['b', 'c'] },
    ]
    expect(playerCount(rounds)).toBe(4)
  })
})
