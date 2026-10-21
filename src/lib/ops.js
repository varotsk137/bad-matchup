/**
 * Every change the app can make to its data, as a named pure function:
 * `(state, ...args) => nextState`. Returning the same object means "nothing
 * changed".
 *
 * Screens never edit state themselves; they ask the store to run one of these
 * by name (see store.js). Keeping the list closed and the functions pure is
 * what lets a different store — a room shared over the network — replay,
 * diff or forward the same changes without the screens knowing.
 *
 * Round *building* is not in here: the matchmaker is slow, can fail and can be
 * cancelled, so App.jsx runs it first and hands the finished rounds to
 * `appendRounds`, `setRounds` and friends.
 */

import { DEFAULT_LEVEL, DEFAULT_OPTIONS, DEFAULT_WEIGHTS, swapSlots, uid } from './matchmaker'
import { mergeResults } from './room'

const newPlayer = (name, level = DEFAULT_LEVEL, gender = '-') => ({
  id: uid(),
  name,
  level,
  gender,
  active: true,
  resting: false,
})

const patchRound = (s, roundId, fn) => ({
  ...s,
  rounds: s.rounds.map((r) => (r.id === roundId ? fn(r) : r)),
})

export const ops = {
  set: (s, patch) => ({ ...s, ...patch }),
  replace: (s, next) => next,

  setOption: (s, key, value) => ({ ...s, options: { ...s.options, [key]: value } }),
  setWeight: (s, key, value) => ({ ...s, weights: { ...s.weights, [key]: value } }),

  /* ---- players ---- */
  addPlayers: (s, names) => ({
    ...s,
    players: [...s.players, ...names.map((name) => newPlayer(name))],
  }),

  updatePlayer: (s, id, patch) => ({
    ...s,
    players: s.players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  }),

  removePlayer: (s, id) => {
    // keep the record (hidden) when past rounds still refer to them, so
    // the schedule never shows a blank name
    const used = s.rounds.some(
      (r) =>
        r.benched.includes(id) || r.matches.some((m) => [...m.teamA, ...m.teamB].includes(id))
    )
    return {
      ...s,
      players: used
        ? s.players.map((p) =>
            p.id === id ? { ...p, deleted: true, active: false, resting: false } : p
          )
        : s.players.filter((p) => p.id !== id),
    }
  },

  /** Players and the schedule go together — a schedule without its players
   *  would render as a grid of blanks, so this clears both. */
  clearPlayers: (s) => ({ ...s, players: [], rounds: [] }),

  markAllPresent: (s) => ({
    ...s,
    players: s.players.map((p) => (p.deleted ? p : { ...p, active: true, resting: false })),
  }),

  /* ---- saved settings ---- */
  savePreset: (s, name) => ({
    ...s,
    presets: [
      {
        id: uid(),
        name,
        savedAt: Date.now(),
        options: { ...s.options },
        weights: { ...s.weights },
        courts: s.courts.map((c) => ({ name: c.name, type: c.type, enabled: c.enabled })),
      },
      ...(s.presets || []),
    ],
  }),

  /**
   * Settings and courts from the preset; players and the schedule stay.
   * A court whose name is already here keeps its id, so rounds that were
   * built for it still line up with it.
   */
  applyPreset: (s, id) => {
    const preset = (s.presets || []).find((p) => p.id === id)
    if (!preset) return s
    const byName = new Map(s.courts.map((c) => [c.name, c]))
    return {
      ...s,
      options: { ...DEFAULT_OPTIONS, ...preset.options },
      weights: { ...DEFAULT_WEIGHTS, ...preset.weights },
      courts: preset.courts.map((c) => ({ ...c, id: byName.get(c.name)?.id ?? uid() })),
    }
  },

  deletePreset: (s, id) => ({ ...s, presets: (s.presets || []).filter((p) => p.id !== id) }),

  /* ---- saved rosters ---- */
  saveRoster: (s, name) => ({
    ...s,
    rosters: [
      {
        id: uid(),
        name,
        savedAt: Date.now(),
        // only the durable facts: who they are and how they play.
        // Attendance and rest flags belong to a single session.
        players: s.players
          .filter((p) => !p.deleted)
          .map((p) => ({ name: p.name, level: p.level, gender: p.gender })),
      },
      ...s.rosters,
    ],
  }),

  renameRoster: (s, id, name) => ({
    ...s,
    rosters: s.rosters.map((r) => (r.id === id ? { ...r, name } : r)),
  }),

  deleteRoster: (s, id) => ({ ...s, rosters: s.rosters.filter((r) => r.id !== id) }),

  /**
   * `replace` swaps the whole roster in (and drops the schedule, which
   * refers to players who are about to disappear); `append` just adds the
   * names that are not already here — the late arrivals from another group.
   */
  loadRoster: (s, id, mode = 'replace') => {
    const roster = s.rosters.find((r) => r.id === id)
    if (!roster) return s
    const make = (p) => newPlayer(p.name, p.level ?? DEFAULT_LEVEL, p.gender ?? '-')
    if (mode === 'append') {
      const here = new Set(s.players.filter((p) => !p.deleted).map((p) => p.name))
      const extra = roster.players.filter((p) => !here.has(p.name)).map(make)
      return { ...s, players: [...s.players, ...extra] }
    }
    return { ...s, players: roster.players.map(make), rounds: [] }
  },

  /* ---- courts ---- */
  addCourt: (s) => ({
    ...s,
    courts: [
      ...s.courts,
      { id: uid(), name: String(s.courts.length + 1), type: 'doubles', enabled: true },
    ],
  }),

  updateCourt: (s, id, patch) => ({
    ...s,
    courts: s.courts.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }),

  removeCourt: (s, id) => ({ ...s, courts: s.courts.filter((c) => c.id !== id) }),

  /* ---- rounds: results of the matchmaker ---- */
  appendRounds: (s, rounds) => ({ ...s, rounds: [...s.rounds, ...rounds] }),
  setRounds: (s, rounds) => ({ ...s, rounds }),
  /** Keeps the first `keep` rounds and puts `rounds` after them. */
  replaceRoundsFrom: (s, keep, rounds) => ({
    ...s,
    rounds: [...s.rounds.slice(0, keep), ...rounds],
  }),
  replaceRound: (s, roundId, round) => patchRound(s, roundId, () => round),

  /* ---- rounds: edits during the session ---- */
  swapInRound: (s, roundId, a, b) => patchRound(s, roundId, (r) => swapSlots(r, a, b)),

  // puts who-plays-where back the way it was (undoing a swap) without
  // touching scores or ticks entered since
  restoreLineup: (s, roundId, before) =>
    patchRound(s, roundId, (r) => ({
      ...r,
      benched: before.benched,
      matches: r.matches.map((m) => {
        const old = before.matches.find((x) => x.id === m.id)
        return old ? { ...m, teamA: old.teamA, teamB: old.teamB } : m
      }),
    })),

  updateMatch: (s, roundId, matchId, patch) =>
    patchRound(s, roundId, (r) => ({
      ...r,
      matches: r.matches.map((m) => (m.id === matchId ? { ...m, ...patch } : m)),
    })),

  toggleMatchDone: (s, roundId, matchId) =>
    patchRound(s, roundId, (r) => ({
      ...r,
      matches: r.matches.map((m) => (m.id === matchId ? { ...m, done: !m.done } : m)),
    })),

  /**
   * Ticks and scores that arrived from a live room's edit links, as
   * { [matchId]: {done, scoreA, scoreB} }. Same state back when they agree
   * with what is here already.
   */
  applyResults: (s, results) => {
    const rounds = mergeResults(s.rounds, results)
    return rounds === s.rounds ? s : { ...s, rounds }
  },

  deleteRound: (s, roundId) => ({ ...s, rounds: s.rounds.filter((r) => r.id !== roundId) }),

  clearRounds: (s) => ({ ...s, rounds: [] }),

  /* ---- whole session ---- */
  /** A schedule that arrived through a share link, taken over as this device's own. */
  adoptSession: (s, { players, courts, rounds }) => ({ ...s, players, courts, rounds }),

  /** Back to a fresh start, keeping how the app looks. */
  reset: (s, fresh) => ({ ...fresh, lang: s.lang, theme: s.theme, skin: s.skin }),
}
