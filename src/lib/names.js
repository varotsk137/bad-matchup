/**
 * The rules for player and court names, in one place.
 *
 * Length is counted in what a reader sees as one character (a grapheme), not
 * in code units: "ศักดิ์" is three marks on screen but six code units, and
 * the limit exists for how wide a name is on a court card or in the image.
 */

export const MAX_NAME = 12
export const MAX_COURT_NAME = 12
/** Past this many players the schedule gets long; the app says so. */
export const PLAYER_WARN = 20
/** No more players than this can be added. */
export const PLAYER_MAX = 50

const segmenter =
  typeof Intl !== 'undefined' && Intl.Segmenter
    ? new Intl.Segmenter('th', { granularity: 'grapheme' })
    : null

const graphemes = (s) =>
  segmenter ? Array.from(segmenter.segment(s), (g) => g.segment) : Array.from(s)

/** Invisible characters that ride along when a name is copied out of a chat. */
const INVISIBLE = /[​-‍⁠﻿]/g

/** What a name is stored as: no invisible characters, single spaces, no ends. */
export function cleanName(s) {
  return String(s ?? '')
    .normalize('NFC')
    .replace(INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function nameLength(s) {
  return graphemes(String(s ?? '')).length
}

/** Cuts typing off at `max` characters, so a field can never hold more. */
export function clipName(s, max = MAX_NAME) {
  const g = graphemes(String(s ?? ''))
  return g.length > max ? g.slice(0, max).join('') : String(s ?? '')
}

const key = (s) => cleanName(s).toLocaleLowerCase('th')

/**
 * Why a player name cannot be used, or null when it can.
 * @param {string} name
 * @param {string[]} taken names already in use (leave out the player being renamed)
 * @returns {null | 'empty' | 'tooLong' | 'duplicate'}
 */
export function nameProblem(name, taken = []) {
  const clean = cleanName(name)
  if (!clean) return 'empty'
  if (nameLength(clean) > MAX_NAME) return 'tooLong'
  const k = key(clean)
  if (taken.some((t) => key(t) === k)) return 'duplicate'
  return null
}

/**
 * Checks a pasted list of names against each other and the current players.
 * Nothing is added unless every name passes, so nobody is silently dropped.
 *
 * @returns {{names: string[], problems: {name: string, problem: string}[], over: number}}
 *   `over` is how many names would go past PLAYER_MAX
 */
export function checkBatch(raw, taken = []) {
  const names = []
  const problems = []
  const seen = [...taken]
  for (const line of raw) {
    const name = cleanName(line)
    if (!name) continue
    const problem = nameProblem(name, seen)
    if (problem) problems.push({ name, problem })
    else names.push(name)
    seen.push(name)
  }
  const over = Math.max(0, taken.length + names.length + problems.length - PLAYER_MAX)
  return { names, problems, over }
}
