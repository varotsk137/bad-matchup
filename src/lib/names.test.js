import { describe, expect, it } from 'vitest'
import {
  MAX_NAME,
  PLAYER_MAX,
  checkBatch,
  cleanName,
  clipName,
  nameLength,
  nameProblem,
} from './names'

describe('names', () => {
  it('cleans what a chat copy drags along', () => {
    expect(cleanName('  ต้น​  น้อย ')).toBe('ต้น น้อย')
    expect(cleanName(null)).toBe('')
  })

  it('counts Thai the way it looks, not in code units', () => {
    expect('สมศักดิ์'.length).toBe(8)
    expect(nameLength('สมศักดิ์')).toBe(5)
    expect(nameLength('Christopher')).toBe(11)
  })

  it('stops typing at the limit without breaking a Thai character', () => {
    const long = 'สมศักดิ์ศรีสวัสดิ์วงศ์'
    const cut = clipName(long)
    expect(nameLength(cut)).toBe(MAX_NAME)
    expect(long.startsWith(cut)).toBe(true)
    expect(clipName('ต้น')).toBe('ต้น')
  })

  it('refuses empty, too long and duplicate names', () => {
    expect(nameProblem('   ')).toBe('empty')
    expect(nameProblem('A'.repeat(MAX_NAME + 1))).toBe('tooLong')
    expect(nameProblem('A'.repeat(MAX_NAME))).toBe(null)
    expect(nameProblem('ต้น', ['ต้น'])).toBe('duplicate')
    expect(nameProblem('Ton ', ['ton'])).toBe('duplicate')
    expect(nameProblem('ต้น 2', ['ต้น'])).toBe(null)
  })

  it('checks a pasted list against itself and the current players', () => {
    const r = checkBatch(['ฝน', 'ต้น', 'ฝน', '', 'A'.repeat(20), 'เจ'], ['ต้น'])
    expect(r.names).toEqual(['ฝน', 'เจ'])
    expect(r.problems.map((p) => p.problem)).toEqual(['duplicate', 'duplicate', 'tooLong'])
    expect(r.over).toBe(0)
  })

  it(`says how far a list would go past ${PLAYER_MAX} players`, () => {
    const taken = Array.from({ length: PLAYER_MAX - 1 }, (_, i) => `p${i}`)
    expect(checkBatch(['x', 'y', 'z'], taken).over).toBe(2)
  })
})
