import { useMemo, useState } from 'react'
import FairnessReport, { useFairness } from './FairnessReport'
import { LevelBadge } from './PlayerBits'
import {
  Button,
  Card,
  Empty,
  ScreenTitle,
  SectionTitle,
  Segmented,
  Sheet,
  StatTile,
  cx,
} from './ui'

export default function StatsTab({ state, stats, playersById, t, lang, goTo }) {
  const [sort, setSort] = useState('games')
  const [openId, setOpenId] = useState(null)
  const formats = useMemo(() => countFormats(state.rounds), [state.rounds])
  const fair = useFairness(state, t)

  const rows = useMemo(() => {
    const list = state.players
      .filter((p) => !p.deleted)
      .map((p) => ({ p, s: stats[p.id] || { games: 0 } }))
    const cmp = {
      games: (a, b) => b.s.games - a.s.games || a.p.name.localeCompare(b.p.name),
      wins: (a, b) => b.s.wins - a.s.wins || b.s.games - a.s.games,
      rate: (a, b) => rate(b.s) - rate(a.s),
      name: (a, b) => a.p.name.localeCompare(b.p.name, lang === 'th' ? 'th' : 'en'),
    }[sort]
    return list.sort(cmp)
  }, [state.players, stats, sort, lang])

  const totalMatches = state.rounds.reduce((s, r) => s + r.matches.length, 0)
  const played = rows.filter((r) => r.s.games > 0)
  // measured against fair share, so someone who came late or left early does
  // not make the session look unfair (same number as before when everyone
  // was there throughout)
  const loads = played.map((r) => r.s.load ?? r.s.games)
  const spread = loads.length ? Math.round(Math.max(...loads) - Math.min(...loads)) : 0
  const total = state.rounds.length
  const done = state.rounds.filter((r) => r.matches.length && r.matches.every((m) => m.done)).length

  if (!total) {
    return (
      <div>
        <ScreenTitle title={t('tabStats')} />
        <Card>
          <Empty icon="chart" title={t('noStats')} />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <ScreenTitle title={t('tabStats')} meta={t('v4StatsMeta', { done, total })} />
        <Hero
          fair={fair}
          t={t}
          goTo={goTo}
          tiles={[
            [total, t('totalRounds')],
            [totalMatches, t('totalMatches')],
            [`±${spread}`, t('v4Spread')],
          ]}
        />
      </div>

      <FairnessReport fair={fair} playersById={playersById} t={t} />

      <section aria-labelledby="stats-players">
        <SectionTitle>
          <span id="stats-players">{t('players')}</span>
        </SectionTitle>
        <Segmented
          className="mb-3"
          label={t('v4SortBy')}
          value={sort}
          onChange={setSort}
          options={[
            { value: 'games', label: t('games') },
            { value: 'wins', label: t('wins') },
            { value: 'rate', label: t('winRate') },
            { value: 'name', label: t('sortName') },
          ]}
        />

        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map(({ p, s }) => {
              const partTime = s.present > 0 && s.present < total
              const f = formats.get(p.id)
              const meta = [
                `${s.partners?.size ?? 0} ${t('uniquePartners')}`,
                s.wins + s.losses > 0 &&
                  `${s.wins} ${t('wins')} – ${s.losses} ${t('losses')} · ${Math.round(rate(s) * 100)}% · ${
                    s.pointsFor - s.pointsAgainst >= 0 ? '+' : ''
                  }${s.pointsFor - s.pointsAgainst}`,
                f?.singles > 0 &&
                  `${t('doublesN', { n: f.doubles })} · ${t('singlesN', { n: f.singles })}`,
                partTime &&
                  (s.firstPresent > 0
                    ? t('joinedAt', { n: s.firstPresent + 1 })
                    : t('leftAfter', { n: s.lastPresent + 1 })),
              ].filter(Boolean)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(p.id)}
                    className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100/70 focus-visible:bg-slate-100 focus-visible:outline-none dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[0.9375rem] font-medium text-slate-900 dark:text-slate-50">
                          {p.name}
                        </span>
                        <LevelBadge level={p.level} className="text-xs!" />
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-600 tabular-nums dark:text-slate-400">
                        {meta.join(' · ')}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="num block text-2xl text-slate-900 dark:text-slate-50">
                        {s.games}
                      </span>
                      <span className="mt-1 block text-xs text-slate-600 dark:text-slate-400">
                        {partTime ? t('fairShareN', { n: Math.round(s.share) }) : t('games')}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </section>

      <PlayerSheet
        player={openId ? playersById.get(openId) : null}
        players={state.players.filter((p) => !p.deleted)}
        rounds={state.rounds}
        formats={formats}
        onClose={() => setOpenId(null)}
        t={t}
        lang={lang}
      />
    </div>
  )
}

/**
 * The one block the screen is about: is it fair, in a word, then the three
 * numbers that say so. With fewer than three players there is no verdict.
 */
function Hero({ fair, t, goTo, tiles }) {
  const stale = fair?.stale
  const worst = fair?.worst
  return (
    <Card tone="ink" className="p-5">
      {fair && (
        <div className="mb-5">
          <p className="text-xs font-medium text-slate-300">{t('fairTitle')}</p>
          {stale ? (
            <>
              <p className="mt-2 text-sm text-slate-100">{t('fairStale', { n: stale.upcoming })}</p>
              {goTo && (
                <Button variant="accent" size="md" className="mt-3" onClick={() => goTo('play')}>
                  {t('fairStaleLink')}
                </Button>
              )}
            </>
          ) : (
            <>
              <h3 className="mt-1.5 flex items-center gap-2.5 text-2xl leading-tight text-slate-50">
                <span
                  aria-hidden
                  className={cx(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                    worst === 0
                      ? 'ink-keep bg-accent-300 text-slate-900'
                      : 'border-2 border-slate-400 text-slate-50'
                  )}
                >
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d={worst === 0 ? 'M5 10.5l3 3 7-7' : 'M10 5v6M10 14.5v.5'} />
                  </svg>
                </span>
                {t(['v4FairGood', 'v4FairOk', 'v4FairBad'][worst])}
              </h3>
              <p className="mt-1.5 text-sm text-slate-300">
                {t(['v4FairGoodBody', 'v4FairOkBody', 'v4FairBadBody'][worst])}
              </p>
            </>
          )}
        </div>
      )}
      <div
        className={cx(
          'grid grid-cols-3 gap-3',
          fair && 'border-t border-slate-50/15 pt-4'
        )}
      >
        {tiles.map(([value, label]) => (
          <StatTile key={label} ink value={value} label={label} />
        ))}
      </div>
      {!fair && <p className="mt-3 text-xs text-slate-300">{t('fairnessHint')}</p>}
    </Card>
  )
}

/** Doubles vs singles games per player, straight from the rounds. */
function countFormats(rounds) {
  const out = new Map()
  for (const r of rounds)
    for (const m of r.matches) {
      const ids = [...m.teamA, ...m.teamB].filter(Boolean)
      if (ids.length < 2) continue
      const key = m.teamA.length === 1 ? 'singles' : 'doubles'
      for (const id of ids) {
        const f = out.get(id) || { doubles: 0, singles: 0 }
        f[key]++
        out.set(id, f)
      }
    }
  return out
}

/**
 * One player's view of the session: how often they teamed up with and played
 * against each other player. Zeros are highlighted — that is the part people
 * open this to check.
 */
function PlayerSheet({ player, players, rounds, formats, onClose, t, lang }) {
  const rows = useMemo(() => {
    if (!player) return []
    const with_ = new Map()
    const vs = new Map()
    const bump = (m, id) => m.set(id, (m.get(id) || 0) + 1)
    for (const r of rounds)
      for (const m of r.matches) {
        const A = m.teamA.filter(Boolean)
        const B = m.teamB.filter(Boolean)
        const mine = A.includes(player.id) ? A : B.includes(player.id) ? B : null
        if (!mine) continue
        const other = mine === A ? B : A
        for (const id of mine) if (id !== player.id) bump(with_, id)
        for (const id of other) bump(vs, id)
      }
    return players
      .filter((p) => p.id !== player.id)
      .map((p) => ({ p, with: with_.get(p.id) || 0, vs: vs.get(p.id) || 0 }))
      .sort(
        (a, b) =>
          b.with + b.vs - (a.with + a.vs) ||
          a.p.name.localeCompare(b.p.name, lang === 'th' ? 'th' : 'en')
      )
  }, [player, players, rounds, lang])

  if (!player) return null
  const f = formats.get(player.id) || { doubles: 0, singles: 0 }

  return (
    <Sheet open onClose={onClose} title={player.name}>
      <div className="grid grid-cols-3 gap-3 px-1">
        <StatTile label={t('doubles')} value={f.doubles} />
        <StatTile label={t('singles')} value={f.singles} />
        <StatTile label={t('games')} value={f.doubles + f.singles} />
      </div>

      <table className="mt-5 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
            <th className="py-2 text-left font-semibold">{t('players')}</th>
            <th className="w-20 py-2 text-center font-semibold">{t('partneredWith')}</th>
            <th className="w-20 py-2 text-center font-semibold">{t('playedAgainst')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.p.id}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
            >
              <td className="py-2">
                <span className="block truncate">{r.p.name}</span>
              </td>
              <Count n={r.with} />
              <Count n={r.vs} />
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">{t('meetHint')}</p>
    </Sheet>
  )
}

function Count({ n }) {
  return (
    <td className="py-2 text-center">
      <span
        className={cx(
          'inline-block min-w-8 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums',
          n === 0
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        )}
      >
        {n}
      </span>
    </td>
  )
}

const rate = (s) => (s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0)
