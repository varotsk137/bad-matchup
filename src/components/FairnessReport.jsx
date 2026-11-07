import { useMemo, useState } from 'react'
import { rosterChange } from '../lib/roster'
import { Card, SectionTitle, Segmented, cx } from './ui'

/**
 * "Is this schedule evened out well?" — every number is set against what the
 * schedule could possibly reach, because "3 pairs never partnered" is a great
 * result with too few rounds and a poor one with plenty. Null with fewer than
 * three players: there is nothing to even out.
 */
export function useFairness(state, t) {
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
  return {
    r,
    checks,
    worst: Math.max(...checks.map((c) => c.grade)),
    // a group change the schedule has not caught up with explains any odd
    // numbers — say that instead of grading a plan that is out of date
    stale: rosterChange(state),
  }
}

const GRADES = [
  {
    key: 'v4GradeGood',
    tone: 'text-brand-700 dark:text-brand-300',
    // a tick
    path: 'M5 10.5l3 3 7-7',
  },
  {
    key: 'v4GradeOk',
    tone: 'bg-accent-100 text-accent-900 dark:bg-accent-950 dark:text-accent-200',
    // a level line
    path: 'M5.5 10h9',
  },
  {
    key: 'v4GradeBad',
    tone: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200',
    // an exclamation mark
    path: 'M10 5v6M10 14.5v.5',
  },
]

/** A check's grade: a shape and a word as well as a colour. */
export function GradeMark({ grade, t, className = '' }) {
  const g = GRADES[grade]
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center gap-1 rounded-full pr-2 pl-1.5 text-xs font-semibold',
        g.tone,
        className
      )}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={g.path} />
      </svg>
      {t(g.key)}
    </span>
  )
}

/** The checks, one clean row each, then who met whom. The verdict lives in the Stats hero. */
export default function FairnessReport({ fair, playersById, t }) {
  const [view, setView] = useState('partners')
  if (!fair) return null
  const { r, checks } = fair
  const grid = view === 'partners' ? r.partner : view === 'opponents' ? r.opp : r.together
  const names = r.ids.map((id) => playersById.get(id)?.name || '?')

  return (
    <>
      <section aria-labelledby="fair-checks">
        <SectionTitle>
          <span id="fair-checks">{t('v4Checks')}</span>
        </SectionTitle>
        <Card className="px-4">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-4 py-3.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9375rem] font-medium text-slate-900 dark:text-slate-50">
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
                    {c.note}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="num text-2xl text-slate-900 dark:text-slate-50">{c.value}</span>
                  <GradeMark grade={c.grade} t={t} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section aria-labelledby="fair-grid">
        <SectionTitle hint={t('fairGridHint')}>
          <span id="fair-grid">{t('v4MeetGrid')}</span>
        </SectionTitle>
        <Card className="space-y-4 p-4">
          <Segmented
            label={t('v4GridView')}
            value={view}
            onChange={setView}
            options={[
              { value: 'partners', label: t('partneredWith') },
              { value: 'opponents', label: t('playedAgainst') },
              { value: 'together', label: t('fairTogether') },
            ]}
          />
          <MeetGrid names={names} grid={grid} t={t} />
        </Card>
      </section>
    </>
  )
}

/**
 * Everyone × everyone, with the count in each cell. In a big group most pairs
 * never meet, so a zero stays quiet; the colour only warms up where two people
 * met more than their fair share (the average, rounded up), and those cells
 * get a ring too so the warning is not colour alone.
 */
function MeetGrid({ names, grid, t }) {
  const cells = grid.flatMap((row, i) => row.filter((_, j) => j !== i))
  const mean = cells.length ? cells.reduce((a, b) => a + b, 0) / cells.length : 0
  const fair = Math.max(1, Math.ceil(mean))
  const max = Math.max(fair + 1, ...cells)
  const tone = (v) =>
    v === 0
      ? { className: 'bg-track font-medium text-slate-600 dark:text-slate-400' }
      : v <= fair
        ? {
            className: 'font-semibold text-slate-900 dark:text-white',
            style: {
              backgroundColor: `color-mix(in oklch, var(--color-brand-500) ${18 + (v / fair) * 27}%, transparent)`,
            },
          }
        : {
            className: 'font-bold text-slate-950 ring-2 ring-accent-600 ring-inset dark:text-white',
            style: {
              backgroundColor: `color-mix(in oklch, var(--color-accent-500) ${45 + ((v - fair) / (max - fair)) * 45}%, transparent)`,
            },
          }
  return (
    <div>
      <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
        {[
          [0, t('meetNone')],
          [1, t('meetFair', { n: fair })],
          [fair + 1, t('meetOver', { n: fair })],
        ].map(([v, label]) => {
          const c = tone(v)
          return (
            <li key={label} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className={cx('grid h-6 w-6 place-items-center rounded-md text-xs tabular-nums', c.className)}
                style={c.style}
              >
                {v}
              </span>
              {label}
            </li>
          )
        })}
      </ul>
      <div className="-mx-4 overflow-x-auto px-4">
        <table className="border-separate border-spacing-[3px] text-xs">
          <thead>
            <tr>
              <th />
              {names.map((n, j) => (
                <th
                  key={j}
                  scope="col"
                  className="h-16 w-7 align-bottom font-medium text-slate-600 dark:text-slate-400"
                >
                  <span className="mx-auto block max-h-16 truncate [writing-mode:vertical-rl] rotate-180">
                    {n}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, i) => (
              <tr key={i}>
                <th
                  scope="row"
                  className="max-w-24 truncate pr-1.5 text-right font-medium text-slate-600 dark:text-slate-400"
                >
                  {names[i]}
                </th>
                {row.map((v, j) =>
                  i === j ? (
                    <td key={j} className="h-7 w-7" aria-hidden />
                  ) : (
                    <td
                      key={j}
                      className={cx('h-7 w-7 rounded-md text-center tabular-nums', tone(v).className)}
                      style={tone(v).style}
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
