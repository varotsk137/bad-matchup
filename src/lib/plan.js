/**
 * Adding rounds one tap at a time used to build each round on its own, which
 * can only look backwards — the last pair or two never got to team up. Now the
 * app plans the rest of the session in one go (with the whole-schedule
 * polish), keeps the plan out of sight and reveals it a round per tap.
 *
 * The plan is only valid for the exact situation it was built for. This key
 * captures that situation; when it changes — someone swapped, arrived or left,
 * a setting or a court changed — the plan is thrown away and rebuilt. Ticking
 * a match done or typing a score does not count as a change.
 */
export function planKey({ players, courts, options, weights, rounds }) {
  return JSON.stringify({
    players: players
      .filter((p) => p.active !== false && !p.resting && !p.deleted)
      .map((p) => [p.id, p.level, p.gender]),
    courts: courts.filter((c) => c.enabled !== false).map((c) => [c.id, c.type]),
    options,
    weights,
    rounds: rounds.map((r) => [
      r.matches.map((m) => [m.courtId, m.teamA, m.teamB]),
      [...(r.benched || [])].sort(),
    ]),
  })
}

/** Rounds to plan at a time: enough for full partner coverage, at least 8. */
export const PLAN_MIN = 8
export const PLAN_MAX = 30
