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

export const MODES = ['balanced', 'random', 'manual']

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
  // stamina when there are not enough bodies to rest everyone on time:
  // 'fill' keeps every court running, 'flex' plays more but lets a few go one
  // round past the limit, 'strict' runs fewer courts so nobody does
  restMode: 'flex',
  useStamina: true, // off: nobody tracks streaks at all — no forced rests, no penalty
  fillIdleCourts: true, // split a doubles court into two singles rather than leave one empty
  fairestOfThree: true, // build a batch three times and keep the fairest
  bookingHours: 2, // for the round suggestion: how long the courts are booked
  minutesPerGame: 15, // …and how long a game takes, changeover included
  effort: 'normal', // 'fast' | 'normal' | 'thorough'
}

/**
 * Merges defaults and applies the stamina master switch. With stamina off
 * the hard rule and every streak penalty go away together, so the rest of the
 * engine needs no special case.
 */
function resolve(options, weights) {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  // rotation mode was retired in v2; a saved setting falls back to balanced
  if (!MODES.includes(opts.mode)) opts.mode = 'balanced'
  const w = { ...DEFAULT_WEIGHTS, ...weights }
  if (opts.useStamina === false) {
    opts.enforceStamina = false
    w.stamina = 0
  }
  return { opts, w }
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

/** Shuffles the first `n` items among themselves and leaves the rest alone. */
function shuffleHead(arr, n) {
  const head = shuffle(arr.slice(0, n))
  for (let i = 0; i < head.length; i++) arr[i] = head[i]
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
      // what an even split would have given them: each round they were there
      // (on court or on the bench) adds seats ÷ people present
      share: 0,
      load: 0, // games − share: above 0 ahead of the group, below 0 owed games
      wins: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      lastRound: -1,
      streak: 0, // rounds played back-to-back, counting from the latest round
      rest: 0, // rounds sat out since the last game
      singles: 0, // singles games so far — the most tiring format
      lastSingles: -1,
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
      if (A.length === 1 && B.length === 1) {
        for (const id of [...A, ...B]) {
          if (!stats[id]) continue
          stats[id].singles++
          stats[id].lastSingles = ri
        }
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

    // only people who were there this round earn a share or count as waiting —
    // someone who turns up at round 10 is not owed nine rounds of games
    const present = new Set([...playing, ...(round.benched || [])])
    const portion = present.size ? playing.size / present.size : 0
    for (const id of present) if (stats[id]) stats[id].share += portion

    for (const p of players) {
      const s = stats[p.id]
      if (!present.has(p.id)) {
        s.streak = 0
        s.rest = 0
        continue
      }
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

  for (const s of Object.values(stats)) s.load = s.games - s.share

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
 * preview); a bit of jitter keeps balanced mode from producing the same
 * line-up every session.
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

  // "fewer games" means fewer than their fair share — with everyone there from
  // the start that is the same ordering as raw games
  const maxGames = Math.max(1, ...rows.map((r) => r.s.games))
  const maxLoad = Math.max(...rows.map((r) => r.s.load ?? r.s.games))
  const maxRest = Math.max(1, ...rows.map((r) => r.s.rest))
  const limit = Math.max(1, options.maxConsecutive)

  for (const r of rows) {
    let score = 0
    score += (w.fewGames / 100) * ((maxLoad - (r.s.load ?? r.s.games)) / maxGames)
    score += (w.waiting / 100) * (r.s.rest / maxRest)
    // deliberately uncapped: when there are too few bench seats to honour the
    // hard limit, the longest streak still has to be the first to sit down
    if (options.useStamina !== false) score -= (w.stamina / 100) * (r.s.streak / limit)
    score += Math.random() * jitter
    r.score = score
  }
  return rows.sort((a, b) => b.score - a.score)
}

function selectPlayers(pool, capacity, ctx, weights, options) {
  const jitter = 0.08
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

    // 3b. spread singles around and never twice in a row (stamina weight, so
    // switching stamina off drops it too); the refiner has no history and
    // skips this — it scores singles on its own
    if (half === 1 && ctx.stats) {
      const ws = w.stamina / 100
      for (const id of ids) {
        const s = ctx.stats[id]
        if (!s) continue
        total += ws * 0.15 * s.singles + (s.lastSingles === lastRoundIdx ? ws * 0.6 : 0)
      }
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
function optimise(freeIds, plan, ctx, w, options, fixed, selection) {
  const totalSlots = plan.reduce((s, p) => s + p.size, 0)
  const slots = fixed || new Array(totalSlots).fill(null)
  const freePositions = []
  for (let i = 0; i < totalSlots; i++) if (slots[i] == null) freePositions.push(i)
  // Ids beyond the court slots sit in bench positions past `totalSlots`, so a
  // swap can trade someone on court for someone on the bench. That lets the
  // optimiser decide *who* plays together with *how* they are arranged.
  const courtFree = freePositions.length
  for (let i = totalSlots; i < totalSlots + freeIds.length - courtFree; i++)
    freePositions.push(i)

  const build = (order) => {
    const arr = slots.slice()
    freePositions.forEach((pos, i) => {
      arr[pos] = order[i] ?? null
    })
    return arr
  }

  const total = (arr) =>
    cost(arr, plan, ctx, w, options) + (selection ? selection(arr.slice(0, totalSlots)) : 0)

  if (options.mode === 'random') {
    return { arrangement: build(shuffle(freeIds.slice())), cost: 0 }
  }

  const { restarts, swapFactor } = EFFORT[options.effort] || EFFORT.normal
  const swapTries = Math.max(40, freePositions.length * swapFactor * plan.length)
  let best = null

  for (let r = 0; r < restarts; r++) {
    // freeIds arrives in queue order; starting every other restart from it
    // keeps the search anchored near the line-up the queue would pick
    const order = r % 2 ? shuffle(freeIds.slice()) : shuffleHead(freeIds.slice(), courtFree)
    let arr = build(order)
    let c = total(arr)

    let stale = 0
    const staleLimit = Math.max(12, freePositions.length * 3)
    for (let t = 0; t < swapTries && stale < staleLimit; t++) {
      if (freePositions.length < 2) break
      const i = freePositions[randInt(freePositions.length)]
      const j = freePositions[randInt(freePositions.length)]
      if (i === j) continue
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      const c2 = total(arr)
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

/* --------------------------------------------- how many courts to run */

/**
 * Picks the line-up size for the round. Every option is a court plan
 * (doubles + doubles, doubles + singles, …) from biggest to smallest, and the
 * rest mode decides how far down the list to go:
 *
 *   fill   – the biggest plan; only the singles fallback court is skipped when
 *            it would cost someone a rest
 *   strict – the biggest plan where nobody goes past the limit, and enough
 *            legs stay fresh that next round can still run the sustainable
 *            plan. Averaging out is what matters, so 11 players on two
 *            courts alternate D+D / D+S rather than sitting five every round.
 *   flex   – the same, but one round past the limit is allowed: more play,
 *            the odd tired leg. Early on, while everyone is fresh, that means
 *            full courts; later it settles into a mix.
 *
 * Both look a few rounds ahead rather than one: grabbing full courts now can
 * leave so many people at the limit that a later round collapses to a single
 * court. Each option is played forward on the streak counters alone, and the
 * winner is the one with the fewest over-limit seats, then the most play.
 */
function planRound(pool, enabled, ctx, w, opts, limit, staminaOn, sustainable) {
  const seatsOf = (plan) => plan.reduce((s, p) => s + p.size, 0)
  const options = []
  for (let k = Math.min(totalCapacity(enabled), pool.length); k >= 2; k--) {
    const plan = planCourts(enabled, k, opts.allowDowngrade)
    if (plan.length && !options.some((o) => seatsOf(o) === seatsOf(plan))) options.push(plan)
  }
  const pick = (plan0) => {
    const plan = opts.fillIdleCourts && opts.allowDowngrade ? spreadOut(plan0, enabled) : plan0
    const seats = seatsOf(plan)
    return { plan, selected: selectPlayers(pool, seats, ctx, w, opts).slice(0, seats) }
  }
  if (!options.length) return { plan: [], selected: [] }

  const mode = staminaOn ? opts.restMode : 'fill'
  const strictPlan = options.find((p) => seatsOf(p) <= sustainable) || options.at(-1)

  if (mode === 'strict' || mode === 'flex') {
    // highest streak anyone may already have and still be seated
    const cap = mode === 'flex' ? limit : limit - 1
    const streak = (id) => ctx.stats[id]?.streak || 0
    // the lookahead ranks on a bare model; the real line-up can differ, so the
    // first ranked plan whose actual pick stays within the cap wins
    for (const seats of lookAhead(pool, ctx, options.map(seatsOf), cap, seatsOf(strictPlan))) {
      const choice = pick(options.find((p) => seatsOf(p) === seats))
      if (!choice.selected.some((p) => streak(p.id) > cap)) return choice
    }
    return pick(strictPlan)
  }

  // fill: a court downgraded to singles is a bonus, never worth skipping a rest for
  let plan = options[0]
  if (staminaOn && plan.length > 1 && seatsOf(plan) > sustainable) {
    const trimmed = plan.filter((p) => !p.downgraded)
    if (trimmed.length) plan = trimmed
  }
  return pick(plan)
}

const LOOKAHEAD = 3

/** Lexicographic comparison of two equal-length number lists. */
function compareKeys(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]
  return 0
}

/**
 * Plays each seat count forward on a bare model of the streak counters —
 * lowest streak, then fewest games, then longest wait goes on first — and
 * returns the seat counts best first. Ranked by over-limit seats (fewest),
 * then total seats over the horizon, then the leanest round, then seats now.
 */
function lookAhead(pool, ctx, seatOptions, cap, floor) {
  const start = pool.map((p) => {
    const s = ctx.stats[p.id] || {}
    return { streak: s.streak || 0, games: s.load ?? s.games ?? 0, rest: s.rest || 0 }
  })
  const order = (st) =>
    st
      .map((_, i) => i)
      .sort(
        (a, b) =>
          st[a].streak - st[b].streak || st[a].games - st[b].games || st[b].rest - st[a].rest
      )
  const step = (st, k) => {
    const on = new Set(order(st).slice(0, k))
    return st.map((s, i) =>
      on.has(i)
        ? { streak: s.streak + 1, games: s.games + 1, rest: 0 }
        : { streak: 0, games: s.games, rest: s.rest + 1 }
    )
  }
  const over = (st, k) =>
    order(st)
      .slice(0, k)
      .filter((i) => st[i].streak > cap).length
  // the one-round rule used for the simulated future rounds
  const greedy = (st) => {
    for (const k of seatOptions) {
      if (over(st, k)) continue
      if (step(st, k).filter((s) => s.streak <= cap).length >= floor) return k
    }
    return seatOptions.at(-1)
  }

  const ranked = []
  for (const k of seatOptions) {
    let v = over(start, k)
    let st = step(start, k)
    let total = k
    let low = k
    for (let h = 1; h < LOOKAHEAD; h++) {
      const k2 = greedy(st)
      v += over(st, k2)
      total += k2
      low = Math.min(low, k2)
      st = step(st, k2)
    }
    const key = [-v, total, low, k]
    ranked.push({ k, key })
  }
  return ranked.sort((a, b) => compareKeys(b.key, a.key)).map((r) => r.k)
}

/**
 * Same seats, more courts: while a court would sit empty, split a doubles
 * court into two singles (one of them on the empty court). An idle court
 * that has been paid for is the worst outcome.
 */
function spreadOut(plan, enabled) {
  const used = new Set(plan.map((p) => p.court.id))
  const idle = enabled.filter((c) => !used.has(c.id))
  const out = plan.map((p) => ({ ...p }))
  while (idle.length) {
    const i = out.findLastIndex((p) => p.size === 4)
    if (i < 0) break
    out[i] = { ...out[i], size: 2, downgraded: true }
    const court = idle.shift()
    out.push({ court, size: 2, downgraded: courtSize(court) === 4 })
  }
  // keep the courts in their usual order
  const rank = new Map(enabled.map((c, i) => [c.id, i]))
  return out.sort((a, b) => rank.get(a.court.id) - rank.get(b.court.id))
}

/* ------------------------------------------------------ who sits out */

/**
 * Picking the top of the queue and only then arranging those players is how
 * the old engine worked, and it splits a group into two halves that never
 * meet: with 9 players on one court everyone alternates play / rest, so the
 * people who rest on odd rounds only ever partner each other. Letting the
 * optimiser trade a little queue order for a fresh pairing fixes that.
 *
 * Returns the ids the optimiser may put on court (queue order, the queue's own
 * pick first) and a cost for "how far this line-up strays from the queue".
 * Who is allowed to stray is bounded so the trade never gets unfair:
 * nobody gets more than one game ahead of the least-played candidate, and
 * the stamina limit still holds.
 */
function selectionModel(pool, queuePick, need, courts, ctx, w, opts) {
  const st = (id) => ctx.stats[id] || { games: 0, load: 0, rest: 0, streak: 0 }
  const limit = Math.max(1, opts.maxConsecutive)
  // games measured against each person's fair share (see makeContext)
  const load = (id) => st(id).load ?? st(id).games
  const minGames = Math.min(...pool.map((p) => load(p.id)))
  const picked = new Set(queuePick)

  const freshCount = pool.filter((p) => st(p.id).streak < limit).length
  const candidates = [
    ...queuePick,
    ...pool
      .map((p) => p.id)
      .filter((id) => {
        if (picked.has(id)) return false
        const s = st(id)
        if (opts.enforceStamina && freshCount >= need && s.streak >= limit) return false
        return load(id) <= minGames + 1
      }),
  ]

  // How much a seat on court costs this player's fairness, in the same rough
  // 0..1-per-court scale as the arrangement cost. Playing while ahead on games
  // or straight after a game is expensive; benching someone who already sat
  // out twice is even more so.
  const fw = w.fewGames / 100
  const ww = w.waiting / 100
  const sw = w.stamina / 100
  const seat = (id) => {
    const s = st(id)
    return (
      fw * 0.45 * (load(id) - minGames) +
      sw * 0.2 * s.streak +
      // past the limit only when the bench is too small — longest streak sits first
      sw * 1.5 * Math.max(0, s.streak - limit + 1) -
      ww * 0.3 * Math.min(s.rest, 3) ** 1.5
    )
  }
  const seatCost = new Map(candidates.map((id) => [id, seat(id)]))
  let floor = 0
  for (const id of queuePick) floor += seatCost.get(id)

  const selection = (onCourt) => {
    let c = 0
    for (const id of onCourt) if (id != null) c += seatCost.get(id)
    return (c - floor) / courts
  }
  return { candidates, selection }
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
  const { opts, w } = resolve(options, weights)

  const enabled = courts.filter((c) => c.enabled !== false)
  if (!enabled.length) return { error: 'no_courts' }

  const pool = players.filter(isAvailable)
  if (pool.length < 2) return { error: 'not_enough_players' }

  const ctx = makeContext(players, rounds)
  // With a limit of L rounds in a row, everyone has to sit at least one round
  // in every L + 1, so only about n·L/(L+1) people can be on court per round
  // without someone eventually going past the limit.
  const limit = Math.max(1, opts.maxConsecutive)
  const staminaOn = opts.enforceStamina && opts.mode !== 'random'
  const sustainable = Math.max(2, Math.floor((pool.length * limit) / (limit + 1)))
  const { selected, plan } = planRound(
    pool,
    enabled,
    ctx,
    w,
    opts,
    limit,
    staminaOn,
    sustainable
  )
  if (!plan.length) return { error: 'not_enough_players' }

  const need = plan.reduce((s, p) => s + p.size, 0)
  const ids = selected.slice(0, need).map((p) => p.id)

  let best
  if (opts.mode === 'balanced' && pool.length > need) {
    const { candidates, selection } = selectionModel(pool, ids, need, plan.length, ctx, w, opts)
    best = optimise(candidates, plan, ctx, w, opts, null, selection)
  } else {
    best = optimise(ids, plan, ctx, w, opts, null)
  }
  const playing = new Set(best.arrangement.slice(0, need))

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
/** One build: round by round, then the whole-schedule polish. */
function buildOnce({ players, courts, rounds, weights, options, count }) {
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
  if (!shouldRefine(options, created)) return { created }
  return { created: refineSchedule({ players, rounds, created, weights, options }) }
}

/** Generates `count` rounds in a row, each one aware of the ones before it. */
export function generateRounds(args) {
  const runs = attempts(args.options, args.count)
  let best = null
  for (let k = 0; k < runs; k++) {
    const res = buildOnce({ count: 1, ...args })
    if (res.error) return best ? { created: best.created } : res
    const key = scheduleKey(args, res.created)
    if (!best || compareKeys(key, best.key) < 0) best = { created: res.created, key }
  }
  return { created: best.created }
}

/** The polish only pays off in balanced mode, over more than one round. */
const shouldRefine = (options, created) =>
  (options?.mode ?? DEFAULT_OPTIONS.mode) === 'balanced' && created.length > 1

/** How many independent builds to compare (see `fairestOfThree`). */
const attempts = (options, count = 1) =>
  (options?.mode ?? DEFAULT_OPTIONS.mode) === 'balanced' &&
  count > 1 &&
  (options?.fairestOfThree ?? DEFAULT_OPTIONS.fairestOfThree)
    ? 3
    : 1

// extra builds stop once the next one would push the total past this
const ATTEMPT_BUDGET_MS = 10000

/**
 * How fair a finished batch is, lower first: seats past the stamina limit,
 * then the spread of games, then pairs that never teamed up, then how unevenly
 * opponents are spread. Every build already follows the same rules — this
 * only picks between them.
 */
function scheduleKey({ players, rounds, options }, created) {
  const { opts } = resolve(options)
  const limit = Math.max(1, opts.maxConsecutive)
  const all = [...rounds, ...created]
  const seen = new Set(all.flatMap((r) => r.matches.flatMap((m) => [...m.teamA, ...m.teamB])))
  const ids = players.map((p) => p.id).filter((id) => seen.has(id))

  let over = 0
  const streak = {}
  const pc = new Map()
  const oc = new Map()
  for (const r of all) {
    const on = new Set()
    for (const m of r.matches) {
      const A = m.teamA.filter(Boolean)
      const B = m.teamB.filter(Boolean)
      for (const id of [...A, ...B]) on.add(id)
      for (const t of [A, B])
        if (t.length === 2) pc.set(pairKey(...t), (pc.get(pairKey(...t)) || 0) + 1)
      for (const a of A)
        for (const b of B) oc.set(pairKey(a, b), (oc.get(pairKey(a, b)) || 0) + 1)
    }
    for (const id of ids) {
      streak[id] = on.has(id) ? (streak[id] || 0) + 1 : 0
      if (opts.useStamina !== false && streak[id] > limit) over++
    }
  }

  let never = 0
  const opp = []
  for (let i = 0; i < ids.length; i++)
    for (let j = i + 1; j < ids.length; j++) {
      const k = pairKey(ids[i], ids[j])
      if (!pc.get(k)) never++
      opp.push(oc.get(k) || 0)
    }
  const mean = opp.reduce((a, b) => a + b, 0) / (opp.length || 1)
  const spread = opp.reduce((a, x) => a + (x - mean) ** 2, 0)

  // games against fair share, so a late arrival with fewer games is not "unfair"
  const ctx = makeContext(players, all)
  const loads = ids.map((id) => ctx.stats[id].load)
  return [over, Math.max(...loads) - Math.min(...loads), never, spread]
}

/**
 * Same thing, but hands the main thread back between rounds.
 *
 * The solver is ~99% of the cost and a big schedule is genuinely slow — 100
 * rounds for 24 players across 5 courts takes around 8 seconds — so running it
 * in one synchronous burst would freeze the tab. Yielding after each round
 * keeps the progress readout painting and the cancel button tappable.
 *
 * With `fairestOfThree` the whole batch is built up to three times and the
 * fairest kept; cancelling during a later build keeps the best one so far.
 */
export async function generateRoundsAsync(args) {
  const runs = attempts(args.options, args.count)
  const started = Date.now()
  let best = null
  for (let k = 0; k < runs; k++) {
    if (k > 0) {
      const perRun = (Date.now() - started) / k
      if (Date.now() - started + perRun > ATTEMPT_BUDGET_MS) break
    }
    const res = await buildOnceAsync(args, k + 1, runs)
    if (res.cancelled) return best ? { created: best.created, cancelled: true } : res
    if (res.error) return best ? { created: best.created } : res
    const key = scheduleKey(args, res.created)
    if (!best || compareKeys(key, best.key) < 0) best = { created: res.created, key }
  }
  return { created: best.created }
}

async function buildOnceAsync(
  { players, courts, rounds, weights, options, count = 1, onProgress, shouldCancel },
  attempt,
  attemptsTotal
) {
  const report = (done, phase) => onProgress?.(done, count, phase, attempt, attemptsTotal)
  let history = rounds
  const created = []
  for (let i = 0; i < count; i++) {
    if (shouldCancel?.()) return { created, cancelled: true }
    const res = generateRound({ players, courts, rounds: history, weights, options })
    if (res.error) return { error: res.error, created }
    history = [...history, res.round]
    created.push(res.round)
    report(created.length)
    if (i < count - 1) await yieldToBrowser()
  }

  if (!shouldRefine(options, created)) return { created }
  report(created.length, 'polish')
  // the polish runs in slices too, so cancel still works; cancelling keeps the
  // rounds already built, just less polished
  let cancelled = false
  const polished = await polish({ players, rounds, created, weights, options }, async () => {
    if (shouldCancel?.()) {
      cancelled = true
      return false
    }
    await yieldToBrowser()
  })
  return cancelled ? { created, cancelled: true } : { created: polished }
}

const yieldToBrowser = () => new Promise((resolve) => setTimeout(resolve, 0))

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
  const { opts, w } = resolve(
    { ...options, mode: options?.mode === 'random' ? 'random' : 'balanced' },
    weights
  )

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

/* ------------------------------------------------------ how many rounds */

const gcd = (a, b) => (b ? gcd(b, a % b) : a)

/**
 * Rounds worth suggesting before a session starts. `seats` is what a round
 * typically puts on court once the rest mode has had its say (the long-run
 * sustainable number when not everyone can rest), and `teams` the doubles
 * pairs that make up — singles have no partners, so they add nothing here.
 *
 *   coverAll – fewest rounds in which every pair could have partnered once,
 *              rounded up to an even-games count when that costs little
 *   gamesEach – roughly how many games everyone gets in that many rounds
 */
export function suggestRounds({ players, courts, options }) {
  const { opts } = resolve(options)
  const n = players.filter(isAvailable).length
  const enabled = courts.filter((c) => c.enabled !== false)
  if (n < 2 || !enabled.length) return null

  let seats = Math.min(totalCapacity(enabled), n)
  if (opts.enforceStamina && opts.restMode !== 'fill') {
    const limit = Math.max(1, opts.maxConsecutive)
    seats = Math.min(seats, Math.max(2, Math.floor((n * limit) / (limit + 1))))
  }
  const doublesCourts = enabled.filter((c) => courtSize(c) === 4).length
  const teams = 2 * Math.min(doublesCourts, Math.floor(seats / 4))
  if (!teams) return { seats, coverAll: null, gamesEach: null }

  const pairs = (n * (n - 1)) / 2
  let coverAll = Math.ceil(pairs / teams)
  // every `step` rounds the games come out exactly even
  const step = n / gcd(n, seats)
  const even = Math.ceil(coverAll / step) * step
  if (even - coverAll <= Math.max(2, coverAll * 0.25)) coverAll = even
  return { seats, coverAll, gamesEach: Math.round((coverAll * seats) / n) }
}

/** Rounds that fit a court booking: rounds run side by side on every court. */
export const roundsForTime = (hours, minutesPerGame) =>
  Math.max(1, Math.floor((hours * 60) / Math.max(1, minutesPerGame)))

/* ----------------------------------------------------- played vs planned */

/** A match has started counting once it is ticked off or has a score. */
export const isMatchPlayed = (m) =>
  !!m.done || typeof m.scoreA === 'number' || typeof m.scoreB === 'number'

/**
 * How many rounds from the start are history: everything up to and including
 * the last round with any played match. Reshuffling "what is left" rebuilds
 * only the rounds after that, so a round that is half played stays as it is.
 */
export function playedRounds(rounds) {
  for (let i = rounds.length - 1; i >= 0; i--)
    if ((rounds[i].matches || []).some(isMatchPlayed)) return i + 1
  return 0
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

/* ------------------------------------------------- whole-schedule polish */

// steps per pass, and how many passes to spend chasing a perfect spread
const REFINE = {
  // `ms` caps the extra passes; the first pass always runs to the end
  fast: { steps: 15000, passes: 1, ms: 0 },
  normal: { steps: 30000, passes: 5, ms: 2500 },
  thorough: { steps: 60000, passes: 12, ms: 8000 },
}

/**
 * Building rounds one at a time can only look backwards, so the last pair or
 * two that never teamed up tends to stay that way. Once a whole batch exists
 * this pass reworks it as one piece — simulated annealing over two moves:
 *
 *   - swap two people inside a round (changes partners / opponents)
 *   - trade a seat across two rounds: x plays round r instead of y, and y
 *     plays round s instead of x, so nobody's game count moves
 *
 * The objective spreads partnerships as evenly as the slots allow (sum of
 * squared pair counts, which bottoms out exactly when every pair has teamed up
 * before any pair repeats), keeps sides level, and guards the rest / stamina
 * rules on each player's play-sit sequence. Rounds before the batch are fixed
 * history.
 */
export function createRefiner({ players, rounds, created, weights, options, focus }) {
  const { opts, w } = resolve(options, weights)
  const limit = Math.max(1, opts.maxConsecutive)
  const level = {}
  const gender = {}
  for (const p of players) {
    level[p.id] = p.level ?? 3
    gender[p.id] = p.gender || '-'
  }
  // no history: `cost` then scores only level and gender, never variety
  const flatCtx = {
    pairCount: new Map(),
    oppCount: new Map(),
    lastPair: new Map(),
    lastOpp: new Map(),
    level,
    gender,
    totalRounds: 0,
  }

  // mutable working copy: per round, a flat id list court after court + bench
  const work = created.map((r) => ({
    sizes: r.matches.map((m) => m.teamA.length + m.teamB.length),
    ids: r.matches.flatMap((m) => [...m.teamA, ...m.teamB]),
    bench: [...(r.benched || [])],
  }))
  if (!work.length || work.some((r) => r.ids.some((id) => id == null))) return null

  const eachPair = (ids, sizes, fn) => {
    let o = 0
    for (const size of sizes) {
      const half = size / 2
      const A = ids.slice(o, o + half)
      const B = ids.slice(o + half, o + size)
      o += size
      if (half > 1) {
        fn('p', pairKey(A[0], A[1]))
        fn('p', pairKey(B[0], B[1]))
      }
      for (const a of A) for (const b of B) fn('o', pairKey(a, b))
    }
  }

  const pc = new Map()
  const oc = new Map()
  const bump = (kind, k, d) => {
    const m = kind === 'p' ? pc : oc
    m.set(k, (m.get(k) || 0) + d)
  }
  for (const r of rounds)
    for (const m of r.matches || []) {
      const ids = [...(m.teamA || []), ...(m.teamB || [])]
      if (ids.some((id) => id == null)) continue
      eachPair(ids, [ids.length], (kind, k) => bump(kind, k, 1))
    }
  for (const r of work) eachPair(r.ids, r.sizes, (kind, k) => bump(kind, k, 1))

  // focus 'opponents' is the follow-up pass: everything the first pass cares
  // about (partners, rests, singles, level balance) is scaled up by `lock` so
  // it effectively cannot get worse, and opponents get a real say
  const opponentsPass = focus === 'opponents'
  const lock = opponentsPass ? 80 : 1
  const wp = (w.partnerVariety / 100) * 0.25 * lock
  const wo = (w.opponentVariety / 100) * (opponentsPass ? 4 : 0.06)
  const pairEnergy = (keys) => {
    let e = 0
    for (const [kind, k] of keys) {
      const c = (kind === 'p' ? pc : oc).get(k) || 0
      e += (kind === 'p' ? wp : wo) * c * c
    }
    return e
  }

  const plans = new Map()
  const planFor = (sizes) => {
    const key = sizes.join(',')
    if (!plans.has(key))
      plans.set(
        key,
        sizes.map((size) => ({ size }))
      )
    return plans.get(key)
  }
  const roundStatic = (r) =>
    cost(r.ids, planFor(r.sizes), flatCtx, w, opts) * r.sizes.length * lock

  // the history before the batch only matters through each trailing run
  // (and how many singles everyone has already played)
  const lead = {}
  for (const p of players) lead[p.id] = { play: 0, rest: 0, singles: 0, lastSingles: false }
  for (const r of rounds) {
    const on = new Set(
      (r.matches || []).flatMap((m) => [...(m.teamA || []), ...(m.teamB || [])])
    )
    const single = new Set(
      (r.matches || [])
        .filter((m) => m.teamA?.length === 1 && m.teamB?.length === 1)
        .flatMap((m) => [...m.teamA, ...m.teamB])
    )
    const benched = new Set(r.benched || [])
    for (const p of players) {
      const l = lead[p.id]
      if (on.has(p.id)) {
        l.play++
        l.rest = 0
      } else {
        l.play = 0
        l.rest = benched.has(p.id) ? l.rest + 1 : 0
      }
      if (single.has(p.id)) l.singles++
      l.lastSingles = single.has(p.id)
    }
  }
  // size of the court `id` plays on in round `r` (0 = not on court)
  const seatSize = (r, id) => {
    const at = r.ids.indexOf(id)
    if (at < 0) return 0
    let o = 0
    for (const size of r.sizes) {
      if (at < o + size) return size
      o += size
    }
    return 0
  }
  const ww = w.waiting / 100
  const sw = w.stamina / 100
  const hardCap = !opts.enforceStamina
    ? Infinity
    : opts.restMode === 'strict'
      ? limit
      : opts.restMode === 'flex'
        ? limit + 1
        : Infinity
  const seqCost = (id) => {
    let play = lead[id]?.play || 0
    let rest = lead[id]?.rest || 0
    let singles = lead[id]?.singles || 0
    let lastSingles = lead[id]?.lastSingles || false
    let c = 0 // the rules: past the limit, long rests, singles twice running
    let soft = 0 // back-to-back within the limit — a preference, not a rule
    for (const r of work) {
      const size = seatSize(r, id)
      if (size === 2) {
        singles++
        if (lastSingles) c += sw * 0.6
      }
      lastSingles = size === 2
      if (size) {
        play++
        rest = 0
        // back-to-back is allowed when the numbers force it, never for free
        if (play >= 2) soft += sw * 0.8
        if (opts.enforceStamina && play > limit) c += 2 * (play - limit)
        // the rest mode's ceiling is a wall, not a price: the polish may not
        // buy a better pairing with a streak the round planner refused
        if (play > hardCap) c += 50
      } else if (r.bench.includes(id)) {
        rest++
        play = 0
        if (rest >= 3) c += ww * 1.5 * (rest - 2)
      } else {
        play = 0
        rest = 0
      }
    }
    // squared, so the singles load spreads evenly instead of piling on one person
    // the opponents pass locks the rules but lets the preference trade
    return (c + sw * 0.08 * singles * singles) * lock + soft
  }

  const statics = work.map(roundStatic)
  const seqs = new Map(players.map((p) => [p.id, seqCost(p.id)]))
  // sequence cost change for `ids` after a move; commitSeq() keeps it
  let pendingSeq = []
  const reseq = (ids) => {
    pendingSeq = ids.filter((id) => id != null).map((id) => [id, seqCost(id)])
    return pendingSeq.reduce((d, [id, c]) => d + c - seqs.get(id), 0)
  }
  const commitSeq = () => {
    for (const [id, c] of pendingSeq) seqs.set(id, c)
  }
  const roundKeys = (r) => {
    const keys = []
    eachPair(r.ids, r.sizes, (kind, k) => keys.push([kind, k]))
    return keys
  }

  // puts new content into round `ri` and returns the change in energy
  const replaceRound = (ri, nextIds, nextBench) => {
    const r = work[ri]
    const oldKeys = roundKeys(r)
    const newKeys = roundKeys({ ids: nextIds, sizes: r.sizes })
    const touched = [...oldKeys, ...newKeys]
    const before = pairEnergy(touched)
    for (const [kind, k] of oldKeys) bump(kind, k, -1)
    for (const [kind, k] of newKeys) bump(kind, k, 1)
    const after = pairEnergy(touched)
    r.ids = nextIds
    r.bench = nextBench
    const s = roundStatic(r)
    const d = after - before + s - statics[ri]
    statics[ri] = s
    return d
  }

  const snapshot = () => work.map((r) => ({ ids: r.ids.slice(), bench: r.bench.slice() }))
  let energy = 0
  let best = { energy, snap: snapshot() }
  const steps = Math.round(
    (REFINE[opts.effort] || REFINE.normal).steps * Math.max(1, players.length / 9)
  )
  const T0 = 0.25
  const T1 = 0.002
  let done = 0

  const accept = (d, T) => d <= 0 || Math.random() < Math.exp(-d / T)

  const inBatch = new Set(work.flatMap((r) => r.ids))
  const ids = players.filter((p) => inBatch.has(p.id)).map((p) => p.id)
  const hasDoubles = work.some((r) => r.sizes.some((size) => size === 4))

  // aim straight at a pair that has never teamed up: find a round where both
  // are on court and put one of them in the other's partner's seat
  const tryMatchmake = (T) => {
    const missing = []
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        if (!pc.get(pairKey(ids[i], ids[j]))) missing.push([ids[i], ids[j]])
    if (!missing.length) return false
    const [a, b] = missing[randInt(missing.length)]
    const rounds = []
    for (let ri = 0; ri < work.length; ri++)
      if (work[ri].ids.includes(a) && work[ri].ids.includes(b)) rounds.push(ri)
    if (!rounds.length) return false
    const ri = rounds[randInt(rounds.length)]
    const r = work[ri]
    // a's partner sits next to a: positions 2k / 2k+1 inside a doubles court
    let o = 0
    let mate = -1
    const ia = r.ids.indexOf(a)
    for (const size of r.sizes) {
      if (ia >= o && ia < o + size && size === 4) mate = ia % 2 === 0 ? ia + 1 : ia - 1
      o += size
    }
    if (mate < 0) return false
    const ib = r.ids.indexOf(b)
    const prevIds = r.ids
    const next = prevIds.slice()
    ;[next[mate], next[ib]] = [next[ib], next[mate]]
    let d = replaceRound(ri, next, r.bench)
    d += reseq([next[mate], next[ib]])
    if (accept(d, T)) {
      energy += d
      commitSeq()
    } else replaceRound(ri, prevIds, r.bench)
    return true
  }

  // a round's teams as [start, length] slices of its id list
  const teamsOf = (r) => {
    const teams = []
    let o = 0
    for (const size of r.sizes) {
      teams.push([o, size / 2], [o + size / 2, size / 2])
      o += size
    }
    return teams
  }

  // Moves a whole team, partners intact, so only opponents change: either to
  // another court in the same round, or to another round where both of them
  // sat out — trading places with a team from there that sat out this round.
  const tryTeamTrade = (T) => {
    const ri = randInt(work.length)
    const r = work[ri]
    const teams = teamsOf(r)
    const [a0, len] = teams[randInt(teams.length)]
    const mine = r.ids.slice(a0, a0 + len)
    if (Math.random() < 0.5 && teams.length > 2) {
      // same round, other court
      const cands = teams.filter(
        ([b0, l]) => l === len && Math.floor(b0 / (2 * len)) !== Math.floor(a0 / (2 * len))
      )
      if (!cands.length) return
      const [b0] = cands[randInt(cands.length)]
      const next = r.ids.slice()
      for (let k = 0; k < len; k++) [next[a0 + k], next[b0 + k]] = [next[b0 + k], next[a0 + k]]
      const prevIds = r.ids
      let d = replaceRound(ri, next, r.bench)
      d += reseq([...mine, ...prevIds.slice(b0, b0 + len)])
      if (accept(d, T)) {
        energy += d
        commitSeq()
      } else replaceRound(ri, prevIds, r.bench)
      return
    }
    // other round: they all sat there, and the team they swap with sat here
    const options = []
    for (let si = 0; si < work.length; si++) {
      if (si === ri || !mine.every((id) => work[si].bench.includes(id))) continue
      for (const [b0, l] of teamsOf(work[si])) {
        if (l !== len) continue
        const theirs = work[si].ids.slice(b0, b0 + l)
        if (theirs.every((id) => r.bench.includes(id))) options.push([si, b0, theirs])
      }
    }
    if (!options.length) return
    const [si, b0, theirs] = options[randInt(options.length)]
    const s2 = work[si]
    const prev = [r.ids, r.bench, s2.ids, s2.bench]
    const swapIn = (list, from, to) =>
      list.map((id) => (from.includes(id) ? to[from.indexOf(id)] : id))
    const rIds = r.ids.slice()
    const sIds = s2.ids.slice()
    for (let k = 0; k < len; k++) {
      rIds[a0 + k] = theirs[k]
      sIds[b0 + k] = mine[k]
    }
    let d = replaceRound(ri, rIds, swapIn(r.bench, theirs, mine))
    d += replaceRound(si, sIds, swapIn(s2.bench, mine, theirs))
    d += reseq([...mine, ...theirs])
    if (accept(d, T)) {
      energy += d
      commitSeq()
    } else {
      replaceRound(si, prev[2], prev[3])
      replaceRound(ri, prev[0], prev[1])
    }
  }

  const tryMove = (T) => {
    if (opponentsPass && Math.random() < 0.6) return tryTeamTrade(T)
    if (hasDoubles && Math.random() < 0.15 && tryMatchmake(T)) return
    const ri = randInt(work.length)
    const r = work[ri]
    if (Math.random() < 0.5 || !r.bench.length) {
      // swap two people on court in one round
      const i = randInt(r.ids.length)
      const j = randInt(r.ids.length)
      if (i === j) return
      const prevIds = r.ids
      const ids = prevIds.slice()
      ;[ids[i], ids[j]] = [ids[j], ids[i]]
      let d = replaceRound(ri, ids, r.bench)
      d += reseq([ids[i], ids[j]])
      if (accept(d, T)) {
        energy += d
        commitSeq()
      } else replaceRound(ri, prevIds, r.bench)
      return
    }
    // trade seats across two rounds
    const i = randInt(r.ids.length)
    const x = r.ids[i]
    const y = r.bench[randInt(r.bench.length)]
    const others = []
    for (let s = 0; s < work.length; s++)
      if (s !== ri && work[s].bench.includes(x) && work[s].ids.includes(y)) others.push(s)
    if (!others.length) return
    const si = others[randInt(others.length)]
    const s = work[si]
    const prev = [r.ids, r.bench, s.ids, s.bench]
    const rIds = r.ids.slice()
    rIds[i] = y
    let d = replaceRound(
      ri,
      rIds,
      r.bench.map((id) => (id === y ? x : id))
    )
    d += replaceRound(
      si,
      s.ids.map((id) => (id === y ? x : id)),
      s.bench.map((id) => (id === x ? y : id))
    )
    const sx = seqCost(x)
    const sy = seqCost(y)
    d += sx - seqs.get(x) + sy - seqs.get(y)
    if (accept(d, T)) {
      energy += d
      seqs.set(x, sx)
      seqs.set(y, sy)
    } else {
      replaceRound(si, prev[2], prev[3])
      replaceRound(ri, prev[0], prev[1])
    }
  }

  /** Runs up to `n` more steps; true once the whole budget is spent. */
  const run = (n) => {
    const end = Math.min(steps, done + n)
    for (; done < end; done++) {
      tryMove(T0 * (T1 / T0) ** (done / steps))
      if (energy < best.energy - 1e-9) best = { energy, snap: snapshot() }
    }
    return done >= steps
  }

  const result = () =>
    created.map((round, ri) => {
      const { ids, bench } = best.snap[ri]
      let o = 0
      const matches = round.matches.map((m) => {
        const size = m.teamA.length + m.teamB.length
        const seg = ids.slice(o, o + size)
        o += size
        return { ...m, teamA: seg.slice(0, size / 2), teamB: seg.slice(size / 2) }
      })
      return { ...round, matches, benched: bench }
    })

  /**
   * Pairs that never teamed up, minus the ones that cannot fit: with fewer
   * partner seats than pairs, some pairs have to miss out. 0 means as even as
   * the numbers allow.
   */
  const gap = () => {
    const inIds = new Set(ids)
    let seats = 0
    let missing = 0
    for (const [k, v] of pc) {
      const [a, b] = k.split('|')
      if (inIds.has(a) && inIds.has(b)) seats += v
    }
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++) if (!pc.get(pairKey(ids[i], ids[j]))) missing++
    const pairsTotal = (ids.length * (ids.length - 1)) / 2
    return missing - Math.max(0, pairsTotal - seats)
  }

  return { run, result, gap }
}

/**
 * Runs refiner passes, each restarting from the best schedule so far, until
 * the partner spread is as even as the numbers allow or the pass budget runs
 * out — then one more pass that evens out opponents without touching the
 * partner spread. `step` is awaited between slices; returning false stops.
 */
async function polish(args, step) {
  const { passes, ms } = REFINE[args.options?.effort] || REFINE.normal
  const deadline = Date.now() + ms
  let created = args.created
  for (let pass = 0; pass < passes && (pass === 0 || Date.now() < deadline); pass++) {
    const refiner = createRefiner({ ...args, created })
    if (!refiner) return created
    while (!refiner.run(1500)) if ((await step()) === false) return refiner.result()
    created = refiner.result()
    // a fresh refiner, because the old one's working state drifts past its best
    if (createRefiner({ ...args, created }).gap() <= 0) break
  }
  const opponents = createRefiner({ ...args, created, focus: 'opponents' })
  if (!opponents) return created
  while (!opponents.run(1500)) if ((await step()) === false) return opponents.result()
  return opponents.result()
}

/** Synchronous version of polish, for callers that do not need to yield. */
export function refineSchedule(args) {
  const { passes, ms } = REFINE[args.options?.effort] || REFINE.normal
  const deadline = Date.now() + ms
  let created = args.created
  for (let pass = 0; pass < passes && (pass === 0 || Date.now() < deadline); pass++) {
    const refiner = createRefiner({ ...args, created })
    if (!refiner) return created
    refiner.run(Infinity)
    created = refiner.result()
    if (createRefiner({ ...args, created }).gap() <= 0) break
  }
  const opponents = createRefiner({ ...args, created, focus: 'opponents' })
  if (!opponents) return created
  opponents.run(Infinity)
  return opponents.result()
}
