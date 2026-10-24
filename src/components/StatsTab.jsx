import { useMemo, useState } from 'react'
import FairnessReport from './FairnessReport'
import { Avatar, LevelBadge } from './PlayerBits'
import { Card, Empty, SectionTitle, Sheet, cx } from './ui'

export default function StatsTab({ state, stats, playersById, t, lang, goTo }) {
  const [sort, setSort] = useState('games')
  const [openId, setOpenId] = useState(null)
  const formats = useMemo(() => countFormats(state.rounds), [state.rounds])

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
  const maxGames = Math.max(1, ...rows.map((r) => r.s.games))
  // measured against fair share, so someone who came late or left early does
  // not make the session look unfair (same number as before when everyone
  // was there throughout)
  const loads = played.map((r) => r.s.load ?? r.s.games)
  const spread = loads.length ? Math.round(Math.max(...loads) - Math.min(...loads)) : 0
  const total = state.rounds.length

  if (!state.rounds.length) {
    return (
      <Card>
        <Empty icon="chart" title={t('noStats')} />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle>{t('statsSummary')}</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          <Stat label={t('totalRounds')} value={state.rounds.length} />
          <Stat label={t('totalMatches')} value={totalMatches} />
          <Stat label={t('fairness')} value={`±${spread}`} small />
        </div>
        <p className="mt-1.5 px-1 text-xs text-slate-400 dark:text-slate-500">
          {t('fairnessHint')}
        </p>
      </div>

      <FairnessReport state={state} playersById={playersById} t={t} goTo={goTo} />

      <div>
        <SectionTitle>{t('players')}</SectionTitle>
        <div className="mb-2 flex gap-1.5 px-1">
          {[
            ['games', t('games')],
            ['wins', t('wins')],
            ['rate', t('winRate')],
            ['name', t('sortName')],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={cx(
                'rounded-full px-2.5 py-1 text-xs font-medium transition',
                sort === k
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <Card className="divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
          {rows.map(({ p, s }) => (
            <button
              key={p.id}
              onClick={() => setOpenId(p.id)}
              className="block w-full px-3 py-2.5 text-left transition hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <Avatar name={p.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {p.name}
                  {s.present > 0 && s.present < total && (
                    <span className="ml-1.5 rounded bg-slate-200 px-1 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {s.firstPresent > 0
                        ? t('joinedAt', { n: s.firstPresent + 1 })
                        : t('leftAfter', { n: s.lastPresent + 1 })}
                    </span>
                  )}
                </span>
                <LevelBadge level={p.level} />
                <span className="text-right text-sm font-bold tabular-nums">
                  {s.games}
                  {s.present > 0 && s.present < total && (
                    <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400">
                      {t('fairShareN', { n: Math.round(s.share) })}
                    </span>
                  )}
                </span>
              </div>

              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand-500"
                    style={{ width: `${(s.games / maxGames) * 100}%` }}
                  />
                </div>
                <span className="shrink-0 text-[11px] text-slate-500 tabular-nums dark:text-slate-400">
                  {s.wins + s.losses > 0 && (
                    <>
                      {s.wins} {t('wins')} – {s.losses} {t('losses')} ·{' '}
                      {Math.round(rate(s) * 100)}%{' · '}
                      {s.pointsFor - s.pointsAgainst >= 0 ? '+' : ''}
                      {s.pointsFor - s.pointsAgainst}
                      {' · '}
                    </>
                  )}
                  {s.partners.size} {t('uniquePartners')}
                  {formats.get(p.id)?.singles > 0 && (
                    <>
                      {' · '}
                      {t('doublesN', { n: formats.get(p.id).doubles })} ·{' '}
                      {t('singlesN', { n: formats.get(p.id).singles })}
                    </>
                  )}
                </span>
              </div>
            </button>
          ))}
        </Card>
      </div>

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
      <div className="grid grid-cols-3 gap-2">
        <Stat label={t('doubles')} value={f.doubles} />
        <Stat label={t('singles')} value={f.singles} />
        <Stat label={t('games')} value={f.doubles + f.singles} />
      </div>

      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="py-1.5 text-left font-semibold">{t('players')}</th>
            <th className="w-20 py-1.5 text-center font-semibold">{t('partneredWith')}</th>
            <th className="w-20 py-1.5 text-center font-semibold">{t('playedAgainst')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.p.id}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
            >
              <td className="py-1.5">
                <span className="flex items-center gap-2">
                  <Avatar name={r.p.name} size="sm" />
                  <span className="truncate">{r.p.name}</span>
                </span>
              </td>
              <Count n={r.with} />
              <Count n={r.vs} />
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('meetHint')}</p>
    </Sheet>
  )
}

function Count({ n }) {
  return (
    <td className="py-1.5 text-center">
      <span
        className={cx(
          'inline-block min-w-7 rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums',
          n === 0
            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        )}
      >
        {n}
      </span>
    </td>
  )
}

const rate = (s) => (s.wins + s.losses > 0 ? s.wins / (s.wins + s.losses) : 0)

function Stat({ label, value, small }) {
  return (
    <Card className="px-3 py-3 text-center">
      <p className={cx('font-bold tabular-nums', small ? 'text-xl' : 'text-2xl')}>{value}</p>
      <p className="mt-0.5 text-[11px] leading-tight text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </Card>
  )
}
