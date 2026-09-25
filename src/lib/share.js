/**
 * Share links.
 *
 * The whole session travels inside the URL fragment, so there is no server,
 * no account and no database — exactly the constraint the app was built under.
 * Everything after `#` is never sent to the host, so a static deploy works and
 * the names never touch anyone's logs.
 *
 * Measured payloads (deflate-raw + base64url):
 *    8 players /  10 rounds →   ~340 chars
 *   20 players /  25 rounds → ~1,200 chars
 *   24 players / 100 rounds → ~4,100 chars
 *
 * That fits comfortably in a chat message, which is the whole point.
 */

import { uid } from './matchmaker'

const DEFLATED = '1'
const PLAIN = '0'

/* --------------------------------------------------------------- packing */

/**
 * Player and court ids are random strings that mean nothing outside this
 * device, so they are replaced by array indices. That alone roughly halves
 * the payload before compression even runs.
 */
export function packSession(state) {
  const pi = new Map(state.players.map((p, i) => [p.id, i]))
  const ci = new Map(state.courts.map((c, i) => [c.id, i]))
  const idx = (id) => pi.get(id) ?? -1

  return {
    v: 1,
    t: Date.now(),
    p: state.players.map((p) => [
      p.name,
      p.level,
      p.gender === 'M' ? 1 : p.gender === 'F' ? 2 : 0,
    ]),
    c: state.courts.map((c) => [c.name, c.type === 'singles' ? 1 : 2]),
    r: state.rounds.map((r) =>
      r.matches.map((m) => [
        ci.get(m.courtId) ?? 0,
        m.teamA.map(idx),
        m.teamB.map(idx),
        m.scoreA ?? -1,
        m.scoreB ?? -1,
        m.done ? 1 : 0,
      ])
    ),
    b: state.rounds.map((r) => r.benched.map(idx).filter((i) => i >= 0)),
  }
}

/** Rebuilds a state-shaped session, minting fresh ids so the UI works unchanged. */
export function unpackSession(o) {
  if (!o || !Array.isArray(o.p) || !Array.isArray(o.c)) throw new Error('bad payload')

  const players = o.p.map(([name, level, g]) => ({
    id: uid(),
    name: String(name ?? '?'),
    level: Number(level) || 1,
    gender: g === 1 ? 'M' : g === 2 ? 'F' : '-',
    active: true,
    resting: false,
  }))
  const courts = o.c.map(([name, type]) => ({
    id: uid(),
    name: String(name ?? ''),
    type: type === 1 ? 'singles' : 'doubles',
    enabled: true,
  }))

  const pid = (i) => players[i]?.id ?? null

  const rounds = (o.r || []).map((matches, ri) => ({
    id: uid(),
    createdAt: o.t ?? Date.now(),
    mode: 'balanced',
    matches: (matches || []).map(([c, A, B, sa, sb, done]) => {
      const court = courts[c] || courts[0]
      const teamA = (A || []).map(pid)
      return {
        id: uid(),
        courtId: court?.id ?? '',
        courtName: court?.name ?? String((c ?? 0) + 1),
        type: teamA.length === 1 ? 'singles' : 'doubles',
        teamA,
        teamB: (B || []).map(pid),
        scoreA: sa < 0 ? null : sa,
        scoreB: sb < 0 ? null : sb,
        done: !!done,
      }
    }),
    benched: (o.b?.[ri] || []).map(pid).filter(Boolean),
  }))

  return { players, courts, rounds, createdAt: o.t ?? null }
}

/* ------------------------------------------------------------- transport */

const toB64Url = (bytes) => {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const fromB64Url = (str) => {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const canCompress = () => typeof CompressionStream === 'function'

async function deflate(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return await new Response(stream).text()
}

/** First character marks the codec, so an old link keeps working. */
export async function encodeShare(state) {
  const json = JSON.stringify(packSession(state))
  if (canCompress()) {
    try {
      return DEFLATED + toB64Url(await deflate(json))
    } catch {
      /* fall through to the uncompressed form */
    }
  }
  return PLAIN + toB64Url(new TextEncoder().encode(json))
}

export async function decodeShare(payload) {
  const codec = payload[0]
  const bytes = fromB64Url(payload.slice(1))
  const json = codec === DEFLATED ? await inflate(bytes) : new TextDecoder().decode(bytes)
  return unpackSession(JSON.parse(json))
}

/* ------------------------------------------------------------------ urls */

export async function buildShareUrl(state, mode = 'view') {
  const payload = await encodeShare(state)
  const base = location.href.split('#')[0]
  return `${base}#s=${payload}&m=${mode === 'edit' ? 'e' : 'v'}`
}

/** @returns {{payload: string, mode: 'view'|'edit'} | null} */
export function readShareHash() {
  const raw = location.hash.replace(/^#/, '')
  if (!raw) return null
  const params = new URLSearchParams(raw)
  const payload = params.get('s')
  if (!payload) return null
  return { payload, mode: params.get('m') === 'e' ? 'edit' : 'view' }
}

/** Drops the share payload from the address bar without reloading. */
export function clearShareHash() {
  history.replaceState(null, '', location.pathname + location.search)
}
