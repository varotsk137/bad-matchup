import { useMemo, useState } from 'react'
import { rosterChange } from '../lib/roster'
import { Card, SectionTitle, cx } from './ui'

/**
 * "Is this schedule evened out well?" — every number is set against what the
 * schedule could possibly reach, because "3 pairs never partnered" is a great
 * result with too few rounds and a poor one with plenty.
 */
export default function FairnessReport({ state, playersById, t, goTo }) {
  const [view, setView] = useState('partners')
  const r = useMemo(() => analyse(state), [state])
  if (r.ids.length < 3) return null

  const limit = state.options?.maxConsecutive ?? 2
  const staminaOn = state.options?.useStamina !== false
  const checks = [
    {
      label: t('fairPartners'),
      value: `${r.neverPartnered}`,
      note:
        t('fairPartnersNote', { best: r.partnerFloor }) +
        (r.neverMet ? ` · ${t('fairNeverMetNote', { n: r.neverMet })}` : ''),
      grade:
        r.neverPartnered <= r.partnerFloor ? 0 : r.neverPartnered <= r.partnerFloor + 2 ? 1 : 2,
    },
    {
      label: t('fairOpponents'),
      value: `${r.oppMin}–${r.oppMax}`,
      note: t('fairOpponentsNote', { lo: r.oppLo, hi: r.oppHi, off: r.oppOff }),
      // calibrated on what the engine reaches: a perfect spread is rare even
      // when partners are perfect, so a fifth of pairs off still counts as good
      grade: r.oppOff <= r.pairs * 0.2 ? 0 : r.oppOff <= r.pairs * 0.4 ? 1 : 2,
    },
    {
      label: t('fairGames'),
      // with part-timers the raw range says nothing; show the gap to fair share
      value: r.partTime ? `±${Math.round(r.loadSpread)}` : `${r.gamesMin}–${r.gamesMax}`,
      note: t(r.partTime ? 'fairGamesNotePartTime' : 'fairGamesNote'),
      grade: r.loadSpread <= 1.01 ? 0 : r.loadSpread <= 2.01 ? 1 : 2,
    },
    {
      label: t('fairStreak'),
      value: `${r.longestPlay}`,
      note: staminaOn ? t('fairStreakNote', { limit }) : t('fairStaminaOff'),
      grade: !staminaOn || r.longestPlay <= limit ? 0 : r.longestPlay === limit + 1 ? 1 : 2,
    },
    {
      label: t('fairRest'),
      value: `${r.longestRest}`,
      note: t('fairRestNote'),
      grade: r.longestRest <= 2 ? 0 : r.longestRest === 3 ? 1 : 2,
    },
  ]
  if (r.singlesMax > 0)
    checks.push({
      label: t('fairSingles'),
      value: `${r.singlesMin}–${r.singlesMax}`,
      note: t('fairSinglesNote'),
      grade: r.singlesMax - r.singlesMin <= 1 ? 0 : r.singlesMax - r.singlesMin === 2 ? 1 : 2,
    })
  const worst = Math.max(...checks.map((c) => c.grade))
  // a group change the schedule has not caught up with explains any odd
  // numbers below — say that instead of grading a plan that is out of date
  const stale = rosterChange(state)

  const grid = view === 'partners' ? r.partner : view === 'opponents' ? r.opp : r.together
  const names = r.ids.map((id) => playersById.get(id)?.name || '?')

  return (
    <div>
      <SectionTitle>{t('fairTitle')}</SectionTitle>
      <Card className="space-y-3 p-3">
        {stale ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg bg-accent-100 px-3 py-2 dark:bg-accent-950">
            <span className="min-w-0 flex-1 text-sm text-accent-900 dark:text-accent-100">
              {t('fairStale', { n: stale.upcoming })}
            </span>
            {goTo && (
              <button
                onClick={() => goTo('play')}
                className="shrink-0 text-sm font-semibold text-accent-800 underline-offset-2 hover:underline dark:text-accent-200"
              >
                {t('fairStaleLink')} →
              </button>
            )}
          </div>
        ) : (
          <p
            className={cx(
              'rounded-lg px-3 py-2 text-sm font-semibold',
              worst === 0
                ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
                : 'bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-200'
            )}
          >
            {t(['fairVerdictGood', 'fairVerdictOk', 'fairVerdictBad'][worst])}
          </p>
        )}

        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 py-1.5">
              <span
                aria-hidden
                className={cx(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  ['bg-emerald-500', 'bg-accent-500', 'bg-rose-500'][c.grade]
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm">{c.label}</span>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                  {c.note}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold tabular-nums">{c.value}</span>
            </li>
          ))}
        </ul>

        <div>
          <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl border-(length:--line-w) border-edge bg-track p-1">
            {[
              ['partners', t('partneredWith')],
              ['opponents', t('playedAgainst')],
              ['together', t('fairTogether')],
            ].map(([k, label]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                className={cx(
                  'h-8 rounded-lg text-xs font-semibold transition',
                  view === k
                    ? 'bg-pick text-pick-ink shadow-[var(--shadow-pick)]'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <MeetGrid names={names} grid={grid} />
          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            {t('fairGridHint')}
          </p>
        </div>
      </Card>
    </div>
  )
}

/** Everyone × everyone, with the count in each cell; zeros stand out. */
function MeetGrid({ names, grid }) {
  const max = Math.max(1, ...grid.flat())
  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-0.5 text-[10px]">
        <thead>
          <tr>
            <th />
            {names.map((n, j) => (
              <th
                key={j}
                className="h-14 w-6 align-bottom font-medium text-slate-500 dark:text-slate-400"
              >
                <span className="mx-auto block max-h-14 truncate [writing-mode:vertical-rl] rotate-180">
                  {n}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, i) => (
            <tr key={i}>
              <th className="max-w-20 truncate pr-1 text-right font-medium text-slate-500 dark:text-slate-400">
                {names[i]}
              </th>
              {row.map((v, j) =>
                i === j ? (
                  <td key={j} className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-800" />
                ) : (
                  <td
                    key={j}
                    className={cx(
                      'h-6 w-6 rounded text-center font-bold tabular-nums',
                      v === 0 ? 'bg-rose-500 text-white' : 'text-slate-900 dark:text-white'
                    )}
                    style={
                      v === 0
                        ? undefined
                        : {
                            backgroundColor: `color-mix(in oklch, var(--color-brand-500) ${20 + (v / max) * 70}%, transparent)`,
                          }
                    }
                  >
                    {v}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Every fairness number in one pass over the rounds. */
export function analyse(state) {
  const order = new Map(state.players.map((p, i) => [p.id, i]))
  const played = new Set()
  for (const r of state.rounds)
    for (const m of r.matches) for (const id of [...m.teamA, ...m.teamB]) if (id) played.add(id)
  const ids = [...played]
    .filter((id) => order.has(id))
    .sort((a, b) => order.get(a) - order.get(b))
  const at = new Map(ids.map((id, i) => [id, i]))
  const n = ids.length
  const mk = () => Array.from({ length: n }, () => new Array(n).fill(0))
  const partner = mk()
  const opp = mk()
  const games = new Array(n).fill(0)
  // fair share of games for the rounds each person was there (see makeContext)
  const share = new Array(n).fill(0)
  const presentRounds = new Array(n).fill(0)
  // rounds two people were both there — a pair who never overlapped cannot
  // have partnered, so they are left out of "never partnered"
  const overlap = mk()
  const singles = new Array(n).fill(0)
  const play = new Array(n).fill(0)
  const rest = new Array(n).fill(0)
  // a late arrival's first rounds are not rests — count from their first game
  const started = new Array(n).fill(false)
  let longestPlay = 0
  let longestRest = 0
  let partnerSeats = 0
  let oppSlots = 0

  for (const r of state.rounds) {
    const on = new Set()
    for (const m of r.matches) {
      const A = m.teamA.filter((id) => at.has(id)).map((id) => at.get(id))
      const B = m.teamB.filter((id) => at.has(id)).map((id) => at.get(id))
      for (const i of [...A, ...B]) {
        on.add(i)
        games[i]++
        if (A.length === 1 && B.length === 1) singles[i]++
      }
      for (const team of [A, B])
        if (team.length === 2) {
          partner[team[0]][team[1]]++
          partner[team[1]][team[0]]++
          partnerSeats++
        }
      for (const a of A)
        for (const b of B) {
          opp[a][b]++
          opp[b][a]++
          oppSlots++
        }
    }
    const present = new Set([
      ...on,
      ...(r.benched || []).filter((id) => at.has(id)).map((id) => at.get(id)),
    ])
    for (const i of present) {
      share[i] += on.size / present.size
      presentRounds[i]++
      for (const j of present) if (j !== i) overlap[i][j]++
    }
    for (let i = 0; i < n; i++) {
      if (on.has(i)) {
        started[i] = true
        play[i]++
        rest[i] = 0
      } else {
        // a rest is a round on the bench — not the rounds after going home
        rest[i] = started[i] && present.has(i) ? rest[i] + 1 : 0
        play[i] = 0
      }
      longestPlay = Math.max(longestPlay, play[i])
      longestRest = Math.max(longestRest, rest[i])
    }
  }

  let pairs = 0
  let neverMet = 0
  let neverPartnered = 0
  const oppCounts = []
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      if (!overlap[i][j]) {
        neverMet++
        continue
      }
      pairs++
      if (!partner[i][j]) neverPartnered++
      oppCounts.push(opp[i][j])
    }
  const oppLo = Math.floor(oppSlots / (pairs || 1))
  const oppHi = Math.ceil(oppSlots / (pairs || 1))
  const together = partner.map((row, i) => row.map((v, j) => v + opp[i][j]))

  return {
    ids,
    pairs,
    partner,
    opp,
    together,
    neverPartnered,
    neverMet,
    partnerFloor: Math.max(0, pairs - partnerSeats),
    oppMin: Math.min(...oppCounts),
    oppMax: Math.max(...oppCounts),
    oppLo,
    oppHi,
    oppOff: oppCounts.filter((x) => x < oppLo || x > oppHi).length,
    gamesMin: Math.min(...games),
    gamesMax: Math.max(...games),
    // spread of games against fair share; equals the plain spread when
    // everyone was there throughout
    loadSpread:
      Math.max(...games.map((g, i) => g - share[i])) -
      Math.min(...games.map((g, i) => g - share[i])),
    partTime: new Set(presentRounds).size > 1,
    singlesMin: Math.min(...singles),
    singlesMax: Math.max(...singles),
    longestPlay,
    longestRest,
  }
}
