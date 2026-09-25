/**
 * Matchmaking engine.
 *
 * Everything here is pure: given the player list, the courts and the rounds
 * played so far, it produces the next round. All the "memory" (how many games
 * someone played, who they partnered with, how long they have been sitting)
 * is derived from the round history, so undoing or editing a round
 * automatically corrects every statistic.
 */

export const MIN_LEVEL = 1
export const MAX_LEVEL = 5
const LEVEL_RANGE = MAX_LEVEL - MIN_LEVEL

/**
 * Thai club ladder, weakest → strongest: NB < BG < N < S < P.
 * NB ("หน้าบ้าน") is the default for a newly added player — most people who
 * turn up to a casual session are somewhere around there, and it is easier to
 * promote someone than to tell them you rated them too high.
 */
export const LEVEL_META = [
  { value: 1, code: 'NB', emoji: '🐣', th: 'หน้าบ้าน', en: 'Casual' },
  { value: 2, code: 'BG', emoji: '🌱', th: 'มือบิกินเนอร์', en: 'Beginner' },
  { value: 3, code: 'N', emoji: '⭐', th: 'มือ N', en: 'Level N' },
  { value: 4, code: 'S', emoji: '🔥', th: 'มือ S', en: 'Level S' },
  { value: 5, code: 'P', emoji: '👑', th: 'มือ P', en: 'Level P' },
]

/** What a brand new player gets until someone says otherwise. */
export const DEFAULT_LEVEL = 1

export const MODES = ['balanced', 'rotation', 'random', 'manual']

export const DEFAULT_WEIGHTS = {
  // --- who goes on court this round ---
  fewGames: 85, // players with fewer games so far get priority
  waiting: 70, // players who have been sitting out longest get priority
  stamina: 65, // players on a long streak get pushed back down the queue
  // --- how the selected players are arranged ---
  levelBalance: 85, // the two sides of a net should add up to a similar level
  levelSpread: 47, // avoid an N and a B+ on the same court
  partnerVariety: 76, // spread partnerships around
  opponentVariety: 55, // spread opponents around
  gender: 21, // mixed-doubles / same-gender preference
}

export const DEFAULT_OPTIONS = {
  mode: 'balanced',
  genderMode: 'off', // 'off' | 'mixed' | 'same'
  maxConsecutive: 2, // stamina: rounds in a row before a forced rest
  enforceStamina: true,
  allowDowngrade: true, // let a doubles court run as singles when short of players
  effort: 'normal', // 'fast' | 'normal' | 'thorough'
}

/* ------------------------------------------------------------------ utils */

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`)

const randInt = (n) => Math.floor(Math.random() * n)

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1)
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const courtSize = (court) => (court.type === 'singles' ? 2 : 4)

export const isAvailable = (p) => p.active !== false && !p.resting

/** Capacity of every enabled court added together. */
export function totalCapacity(courts) {
  return courts.filter((c) => c.enabled !== false).reduce((s, c) => s + courtSize(c), 0)
}

/* ------------------------------------------------------- history → context */

/**
 * Walks the round history once and produces every counter the cost function
 * and the queue need.
 */
export function makeContext(players, rounds) {
  const stats = {}
  for (const p of players) {
    stats[p.id] = {
      games: 0,
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      lastRound: -1,
      streak: 0, // rounds played back-to-back, counting from the latest round
      rest: 0, // rounds sat out since the last game
      partners: new Set(),
      opponents: new Set(),
    }
  }

  const pairCount = new Map()
  const oppCount = new Map()
  const lastPair = new Map()
  const lastOpp = new Map()

  rounds.forEach((round, ri) => {
    const playing = new Set()

    for (const m of round.matches || []) {
      const A = (m.teamA || []).filter(Boolean)
      const B = (m.teamB || []).filter(Boolean)

      for (const id of [...A, ...B]) {
        playing.add(id)
        if (stats[id]) stats[id].games++
      }

      for (const team of [A, B]) {
        for (let i = 0; i < team.length; i++) {
          for (let j = i + 1; j < team.length; j++) {
            const k = pairKey(team[i], team[j])
            pairCount.set(k, (pairCount.get(k) || 0) + 1)
            lastPair.set(k, ri)
            stats[team[i]]?.partners.add(team[j])
            stats[team[j]]?.partners.add(team[i])
          }
        }
      }

      for (const a of A) {
        for (const b of B) {
          const k = pairKey(a, b)
          oppCount.set(k, (oppCount.get(k) || 0) + 1)
          lastOpp.set(k, ri)
          stats[a]?.opponents.add(b)
          stats[b]?.opponents.add(a)
        }
      }

      const { scoreA: sa, scoreB: sb } = m
      if (typeof sa === 'number' && typeof sb === 'number' && sa !== sb) {
        const aWon = sa > sb
        for (const id of A) {
          const s = stats[id]
          if (!s) continue
          s.pointsFor += sa
          s.pointsAgainst += sb
          aWon ? s.wins++ : s.losses++
        }
        for (const id of B) {
          const s = stats[id]
          if (!s) continue
          s.pointsFor += sb
          s.pointsAgainst += sa
          aWon ? s.losses++ : s.wins++
        }
      }
    }

    for (const p of players) {
      const s = stats[p.id]
      if (playing.has(p.id)) {
        s.streak++
        s.rest = 0
        s.lastRound = ri
      } else {
        s.streak = 0
        s.rest++
      }
    }
  })

  let maxPair = 0
  for (const v of pairCount.values()) if (v > maxPair) maxPair = v
  let maxOpp = 0
  for (const v of oppCount.values()) if (v > maxOpp) maxOpp = v

  const level = {}
  const gender = {}
  for (const p of players) {
    level[p.id] = p.level ?? 3
    gender[p.id] = p.gender || '-'
  }

  return {
    stats,
    pairCount,
    oppCount,
    lastPair,
    lastOpp,
    maxPair,
    maxOpp,
    level,
    gender,
    totalRounds: rounds.length,
  }
}

/* ----------------------------------------------------------- the queue */

/**
 * Orders the available players by "who deserves to play next".
 * `jitter` of 0 makes the order fully deterministic (used for the queue
 * preview and for rotation mode); a bit of jitter keeps balanced mode from
 * producing the same line-up every session.
 */
export function rankPlayers(pool, ctx, weights, options, jitter = 0) {
  const w = weights
  const rows = pool.map((p) => ({
    p,
    s: ctx.stats[p.id] || { games: 0, rest: 0, streak: 0 },
    score: 0,
  }))

  if (options.mode === 'random') {
    for (const r of rows) r.score = Math.random()
    return rows.sort((a, b) => b.score - a.score)
  }

  const maxGames = Math.max(1, ...rows.map((r) => r.s.games))
  const maxRest = Math.max(1, ...rows.map((r) => r.s.rest))
  const limit = Math.max(1, options.maxConsecutive)

  for (const r of rows) {
    let score = 0
    score += (w.fewGames / 100) * ((maxGames - r.s.games) / maxGames)
    score += (w.waiting / 100) * (r.s.rest / maxRest)
    // deliberately uncapped: when there are too few bench seats to honour the
    // hard limit, the longest streak still has to be the first to sit down
    score -= (w.stamina / 100) * (r.s.streak / limit)
    score += Math.random() * jitter
    r.score = score
  }
  return rows.sort((a, b) => b.score - a.score)
}

function selectPlayers(pool, capacity, ctx, weights, options) {
  const jitter = options.mode === 'rotation' ? 0 : 0.08
  let ranked = rankPlayers(pool, ctx, weights, options, jitter)

  // Hard stamina rule: anyone who already played `maxConsecutive` rounds in a
  // row goes to the back of the queue — but only if there are enough other
  // bodies to cover the courts, otherwise they keep playing.
  if (options.enforceStamina && options.mode !== 'random' && pool.length > capacity) {
    const limit = Math.max(1, options.maxConsecutive)
    const fresh = ranked.filter((r) => r.s.streak < limit)
    const tired = ranked.filter((r) => r.s.streak >= limit)
    ranked = [...fresh, ...tired]
  }

  return ranked.slice(0, Math.min(capacity, ranked.length)).map((r) => r.p)
}

/* ------------------------------------------------------------ court plan */

/**
 * Decides which courts actually run this round and at what size.
 * Courts are filled in order; a doubles court may drop to singles when only
 * two players are left over (if the option is on).
 */
export function planCourts(courts, playerCount, allowDowngrade) {
  const plan = []
  let remaining = playerCount
  for (const court of courts) {
    const size = courtSize(court)
    if (remaining >= size) {
      plan.push({ court, size, downgraded: false })
      remaining -= size
    } else if (allowDowngrade && size === 4 && remaining >= 2) {
      plan.push({ court, size: 2, downgraded: true })
      remaining -= 2
    }
  }
  return plan
}

/* ------------------------------------------------------- the cost function */

/**
 * Lower is better. Every term is normalised to roughly 0..1 before its weight
 * is applied, so the sliders in Settings behave predictably against each other.
 *
 * `arrangement` is a flat list of player ids laid out court after court.
 * Inside a court the first half is team A, the second half team B.
 */
function cost(arrangement, plan, ctx, w, options) {
  let total = 0
  let offset = 0
  // Fixed divisors on purpose. Scaling by the running maximum (1 + maxPair)
  // makes the variety terms fade as the session goes on — the opposite of what
  // you want once everyone has already partnered once or twice.
  const pairNorm = 2
  const oppNorm = 4
  const lastRoundIdx = ctx.totalRounds - 1

  // how badly we punish repeating a partner/opponent from the very last rounds
  const recency = (lastSeen) => {
    if (lastSeen == null) return 0
    const gap = lastRoundIdx - lastSeen
    if (gap <= 0) return 2
    if (gap === 1) return 1
    return 0
  }

  for (const slot of plan) {
    const ids = arrangement.slice(offset, offset + slot.size)
    offset += slot.size
    const half = slot.size / 2
    const A = ids.slice(0, half)
    const B = ids.slice(half)
    const lv = (id) => ctx.level[id] ?? 3

    // 1. the two sides should add up to a similar level
    const sumA = A.reduce((s, id) => s + lv(id), 0)
    const sumB = B.reduce((s, id) => s + lv(id), 0)
    const maxDiff = half * LEVEL_RANGE
    total += (w.levelBalance / 100) * (Math.abs(sumA - sumB) / maxDiff) ** 2

    // 2. no huge skill gap inside one court (a mismatch is no fun for anyone)
    const levels = ids.map(lv)
    const spread = (Math.max(...levels) - Math.min(...levels)) / LEVEL_RANGE
    total += (w.levelSpread / 100) * spread ** 2

    // 3. partner variety (doubles only)
    if (half > 1) {
      let pv = 0
      for (const team of [A, B]) {
        for (let i = 0; i < team.length; i++) {
          for (let j = i + 1; j < team.length; j++) {
            const k = pairKey(team[i], team[j])
            pv += (ctx.pairCount.get(k) || 0) + recency(ctx.lastPair.get(k)) * 1.5
          }
        }
      }
      total += (w.partnerVariety / 100) * (pv / 2 / pairNorm)
    }

    // 4. opponent variety
    let ov = 0
    for (const a of A) {
      for (const b of B) {
        const k = pairKey(a, b)
        ov += (ctx.oppCount.get(k) || 0) + recency(ctx.lastOpp.get(k))
      }
    }
    total += (w.opponentVariety / 100) * (ov / (half * half) / oppNorm)

    // 5. gender composition
    if (options.genderMode !== 'off' && half > 1) {
      let g = 0
      for (const team of [A, B]) {
        const m = team.filter((id) => ctx.gender[id] === 'M').length
        const f = team.filter((id) => ctx.gender[id] === 'F').length
        if (options.genderMode === 'mixed') {
          if (!(m === 1 && f === 1)) g += 1
        } else if (m > 0 && f > 0) {
          g += 1
        }
      }
      total += (w.gender / 100) * (g / 2)
    }
  }

  return plan.length ? total / plan.length : 0
}

/* --------------------------------------------------------- the optimiser */

const EFFORT = {
  fast: { restarts: 40, swapFactor: 4 },
  normal: { restarts: 160, swapFactor: 10 },
  thorough: { restarts: 420, swapFactor: 20 },
}

/**
 * Randomised restarts + hill-climbing swaps. `fixed` marks slots that must
 * keep their player (used by manual mode's "auto-fill the rest").
 */
function optimise(freeIds, plan, ctx, w, options, fixed) {
  const totalSlots = plan.reduce((s, p) => s + p.size, 0)
  const slots = fixed || new Array(totalSlots).fill(null)
  const freePositions = []
  for (let i = 0; i < totalSlots; i++) if (slots[i] == null) freePositions.push(i)

  const build = (order) => {
    const arr = slots.slice()
    freePositions.forEach((pos, i) => {
      arr[pos] = order[i] ?? null
    })
    return arr
  }

  if (options.mode === 'random') {
    return { arrangement: build(shuffle(freeIds.slice())), cost: 0 }
  }

  const { restarts, swapFactor } = EFFORT[options.effort] || EFFORT.normal
  const swapTries = Math.max(40, freePositions.length * swapFactor * plan.length)
  let best = null

  for (let r = 0; r < restarts; r++) {
    const order = shuffle(freeIds.slice())
    let arr = build(order)
    let c = cost(arr, plan, ctx, w, options)

    let stale = 0
    const staleLimit = Math.max(12, freePositions.length * 3)
    for (let t = 0; t < swapTries && stale < staleLimit; t++) {
      if (freePositions.length < 2) break
      const i = freePositions[randInt(freePositions.length)]
      const j = freePositions[randInt(freePositions.length)]
      if (i === j) continue
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      const c2 = cost(arr, plan, ctx, w, options)
      if (c2 < c - 1e-12) {
        c = c2
        stale = 0
      } else {
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
        stale++
      }
    }

    if (!best || c < best.cost) best = { arrangement: arr.slice(), cost: c }
    if (best.cost <= 1e-9) break
  }

  return best || { arrangement: build(freeIds.slice()), cost: 0 }
}

/* ---------------------------------------------------------- round builders */

function matchesFromArrangement(arrangement, plan) {
  const matches = []
  let offset = 0
  for (const slot of plan) {
    const seg = arrangement.slice(offset, offset + slot.size)
    offset += slot.size
    const half = slot.size / 2
    matches.push({
      id: uid(),
      courtId: slot.court.id,
      courtName: slot.court.name,
      type: slot.size === 2 ? 'singles' : 'doubles',
      downgraded: slot.downgraded,
      teamA: seg.slice(0, half),
      teamB: seg.slice(half),
      scoreA: null,
      scoreB: null,
      done: false,
    })
  }
  return matches
}

/**
 * Builds the next round.
 * Returns `{ round }` or `{ error }` where error is one of
 * 'no_courts' | 'not_enough_players'.
 */
export function generateRound({ players, courts, rounds, weights, options }) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const w = { ...DEFAULT_WEIGHTS, ...weights }

  const enabled = courts.filter((c) => c.enabled !== false)
  if (!enabled.length) return { error: 'no_courts' }

  const pool = players.filter(isAvailable)
  if (pool.length < 2) return { error: 'not_enough_players' }

  const ctx = makeContext(players, rounds)
  const capacity = totalCapacity(enabled)
  const selected = selectPlayers(pool, capacity, ctx, w, opts)
  const plan = planCourts(enabled, selected.length, opts.allowDowngrade)
  if (!plan.length) return { error: 'not_enough_players' }

  const need = plan.reduce((s, p) => s + p.size, 0)
  const onCourt = selected.slice(0, need)
  const ids = onCourt.map((p) => p.id)

  const best = optimise(ids, plan, ctx, w, opts, null)
  const playing = new Set(ids)

  return {
    round: {
      id: uid(),
      createdAt: Date.now(),
      mode: opts.mode,
      matches: matchesFromArrangement(best.arrangement, plan),
      benched: pool.filter((p) => !playing.has(p.id)).map((p) => p.id),
    },
    cost: best.cost,
  }
}

/** Generates `count` rounds in a row, each one aware of the ones before it. */
export function generateRounds({ players, courts, rounds, weights, options, count = 1 }) {
  let history = rounds
  const created = []
  for (let i = 0; i < count; i++) {
    const res = generateRound({
      players,
      courts,
      rounds: history,
      weights,
      options,
    })
    if (res.error) return { error: res.error, created }
    history = [...history, res.round]
    created.push(res.round)
  }
  return { created }
}

/**
 * Same thing, but hands the main thread back between rounds.
 *
 * The solver is ~99% of the cost and a big schedule is genuinely slow — 100
 * rounds for 24 players across 5 courts takes around 8 seconds — so running it
 * in one synchronous burst would freeze the tab. Yielding after each round
 * keeps the progress readout painting and the cancel button tappable.
 */
export async function generateRoundsAsync({
  players,
  courts,
  rounds,
  weights,
  options,
  count = 1,
  onProgress,
  shouldCancel,
}) {
  let history = rounds
  const created = []
  for (let i = 0; i < count; i++) {
    if (shouldCancel?.()) return { created, cancelled: true }
    const res = generateRound({ players, courts, rounds: history, weights, options })
    if (res.error) return { error: res.error, created }
    history = [...history, res.round]
    created.push(res.round)
    onProgress?.(created.length, count)
    if (i < count - 1) await new Promise((resolve) => setTimeout(resolve, 0))
  }
  return { created }
}

/** An all-empty round for manual mode — the user taps players into the slots. */
export function createEmptyRound({ players, courts }) {
  const enabled = courts.filter((c) => c.enabled !== false)
  if (!enabled.length) return { error: 'no_courts' }
  const pool = players.filter(isAvailable)

  const plan = enabled.map((court) => ({
    court,
    size: courtSize(court),
    downgraded: false,
  }))
  const matches = plan.map((slot) => ({
    id: uid(),
    courtId: slot.court.id,
    courtName: slot.court.name,
    type: slot.size === 2 ? 'singles' : 'doubles',
    downgraded: false,
    teamA: new Array(slot.size / 2).fill(null),
    teamB: new Array(slot.size / 2).fill(null),
    scoreA: null,
    scoreB: null,
    done: false,
  }))

  return {
    round: {
      id: uid(),
      createdAt: Date.now(),
      mode: 'manual',
      matches,
      benched: pool.map((p) => p.id),
    },
  }
}

/**
 * Fills whatever slots are still empty in `round`, keeping every player that
 * has already been placed exactly where they are.
 */
export function fillRound({ round, players, courts, rounds, weights, options }) {
  const opts = {
    ...DEFAULT_OPTIONS,
    ...options,
    mode: options?.mode === 'random' ? 'random' : 'balanced',
  }
  const w = { ...DEFAULT_WEIGHTS, ...weights }

  const history = rounds.filter((r) => r.id !== round.id)
  const ctx = makeContext(players, history)

  const plan = round.matches.map((m) => ({
    court: { id: m.courtId, name: m.courtName },
    size: m.teamA.length + m.teamB.length,
    downgraded: m.downgraded,
  }))

  const fixed = []
  for (const m of round.matches) fixed.push(...m.teamA, ...m.teamB)
  const emptyCount = fixed.filter((x) => x == null).length
  if (!emptyCount) return { round }

  const placed = new Set(fixed.filter(Boolean))
  const candidates = players.filter((p) => isAvailable(p) && !placed.has(p.id))
  if (!candidates.length) return { round }

  const ranked = rankPlayers(candidates, ctx, w, opts, 0.05)
  const chosen = ranked.slice(0, emptyCount).map((r) => r.p.id)

  // not enough bodies to fill every slot — leave the tail empty
  while (chosen.length < emptyCount) chosen.push(null)

  const best = optimise(chosen.filter(Boolean), plan, ctx, w, opts, fixed)
  const arrangement = best.arrangement

  let offset = 0
  const matches = round.matches.map((m) => {
    const size = m.teamA.length + m.teamB.length
    const seg = arrangement.slice(offset, offset + size)
    offset += size
    const half = size / 2
    return { ...m, teamA: seg.slice(0, half), teamB: seg.slice(half) }
  })

  const onCourt = new Set(arrangement.filter(Boolean))
  return {
    round: {
      ...round,
      matches,
      benched: players.filter((p) => isAvailable(p) && !onCourt.has(p.id)).map((p) => p.id),
    },
  }
}

/* ------------------------------------------------------- editing a round */

const teamKey = (t) => (t === 'A' ? 'teamA' : 'teamB')

/**
 * Swaps two slots inside a round. A slot is either a court position
 * `{ matchId, team, idx }` or a bench seat `{ bench: true, playerId }`.
 */
export function swapSlots(round, a, b) {
  const r = {
    ...round,
    matches: round.matches.map((m) => ({
      ...m,
      teamA: [...m.teamA],
      teamB: [...m.teamB],
    })),
    benched: [...round.benched],
  }
  const readCourt = (p) => r.matches.find((m) => m.id === p.matchId)[teamKey(p.team)][p.idx]
  const writeCourt = (p, v) => {
    r.matches.find((m) => m.id === p.matchId)[teamKey(p.team)][p.idx] = v
  }

  const va = a.bench ? a.playerId : readCourt(a)
  const vb = b.bench ? b.playerId : readCourt(b)
  if (va == null && vb == null) return round

  if (!a.bench) writeCourt(a, vb)
  if (!b.bench) writeCourt(b, va)

  let bench = r.benched
  if (a.bench) {
    bench = bench.filter((x) => x !== va)
    if (vb != null) bench.push(vb)
  }
  if (b.bench) {
    bench = bench.filter((x) => x !== vb)
    if (va != null) bench.push(va)
  }
  r.benched = bench
  return r
}

/** Explains, in numbers, how good the produced round is. Shown under the round. */
export function roundQuality(round, players, priorRounds) {
  const ctx = makeContext(players, priorRounds)
  let repeatPartners = 0
  let repeatOpponents = 0
  let maxGap = 0
  let matches = 0

  for (const m of round.matches || []) {
    const A = (m.teamA || []).filter(Boolean)
    const B = (m.teamB || []).filter(Boolean)
    if (!A.length || !B.length) continue
    matches++
    for (const team of [A, B]) {
      for (let i = 0; i < team.length; i++)
        for (let j = i + 1; j < team.length; j++)
          if (ctx.pairCount.get(pairKey(team[i], team[j]))) repeatPartners++
    }
    for (const a of A) for (const b of B) if (ctx.oppCount.get(pairKey(a, b))) repeatOpponents++

    const lv = (id) => ctx.level[id] ?? 3
    const gap = Math.abs(
      A.reduce((s, id) => s + lv(id), 0) - B.reduce((s, id) => s + lv(id), 0)
    )
    if (gap > maxGap) maxGap = gap
  }

  return { repeatPartners, repeatOpponents, maxGap, matches }
}
