import { useMemo, useState } from 'react'
import { Avatar, LevelBadge } from './PlayerBits'
import { Card, Empty, SectionTitle, cx } from './ui'

export default function StatsTab({ state, stats, playersById, t, lang }) {
  const [sort, setSort] = useState('games')

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
  const minGames = played.length ? Math.min(...played.map((r) => r.s.games)) : 0
  const spread = played.length ? Math.max(...played.map((r) => r.s.games)) - minGames : 0

  if (!state.rounds.length) {
    return (
      <Card>
        <Empty emoji="📊" title={t('noStats')} />
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
            <div key={p.id} className="px-3 py-2.5">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.name}</span>
                <LevelBadge level={p.level} />
                <span className="w-10 text-right text-sm font-bold tabular-nums">
                  {s.games}
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
                </span>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
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
