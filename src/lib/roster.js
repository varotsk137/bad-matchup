import { isAvailable, playedRounds } from './matchmaker'

/**
 * Has the group changed since the rounds still to come were built? Someone in
 * those rounds is no longer here (left, marked resting or deleted), or someone
 * who is here appears in none of them (just arrived). Either way the rest of
 * the schedule is out of date and should be rebuilt.
 *
 * Returns null when there is nothing to come, or nothing changed.
 */
export function rosterChange({ players, rounds }) {
  const upcoming = rounds.slice(playedRounds(rounds))
  if (!upcoming.length) return null
  const here = new Set(players.filter((p) => isAvailable(p) && !p.deleted).map((p) => p.id))
  const listed = new Set()
  for (const r of upcoming) {
    for (const m of r.matches) for (const id of [...m.teamA, ...m.teamB]) if (id) listed.add(id)
    for (const id of r.benched || []) listed.add(id)
  }
  const gone = [...listed].filter((id) => !here.has(id))
  const arrived = [...here].filter((id) => !listed.has(id))
  if (!gone.length && !arrived.length) return null
  return { gone, arrived, upcoming: upcoming.length }
}
