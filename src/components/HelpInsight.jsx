import { PAIRINGS } from './helpData'
import { cx } from './ui'

/**
 * "How balanced mode thinks", for the help sheet. Steps 1–2 use a small made-up
 * example worked through with the engine's real default weights; step 3 shows
 * real engine output (see helpData.js).
 */
export default function HelpInsight({ t }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-brand-600/40 dark:border-brand-500/30">
      <h4 className="flex items-center gap-2 bg-brand-50 px-3 py-2.5 text-sm font-semibold dark:bg-brand-950/60">
        <span aria-hidden>🔍</span>
        {t('insTitle')}
      </h4>
      <div className="space-y-4 p-3">
        <p className="text-xs text-slate-600 dark:text-slate-300">{t('insIntro')}</p>
        <Step n={1} title={t('insQueueTitle')} body={t('insQueueBody')}>
          <QueueArt t={t} />
        </Step>
        <Step n={2} title={t('insPairTitle')} body={t('insPairBody')}>
          <PairArt t={t} />
        </Step>
        <Step n={3} title={t('insPolishTitle')} body={t('insPolishBody')}>
          <PolishArt t={t} />
        </Step>
        <Step n={4} title={t('insCourtsTitle')} body={t('insCourtsBody')} />
      </div>
    </section>
  )
}

function Step({ n, title, body, children }) {
  return (
    <div>
      <h5 className="flex items-center gap-2 text-[13px] font-semibold">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-bold text-white">
          {n}
        </span>
        {title}
      </h5>
      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{body}</p>
      {children && (
        <div className="mt-2 rounded-xl bg-slate-100 p-2.5 dark:bg-slate-950/60">
          {children}
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------- 1. who goes on court */

// six players, one doubles court, limit 2 in a row. Score = default weights:
// fewGames 0.85 × (most games − games) / most + waiting 0.70 × rest / longest rest
// − stamina 0.65 × streak / limit
const QUEUE = [
  { id: 'A', games: 3, rest: 2, streak: 0 },
  { id: 'B', games: 3, rest: 1, streak: 0 },
  { id: 'C', games: 4, rest: 1, streak: 0 },
  { id: 'F', games: 3, rest: 0, streak: 1 },
  { id: 'D', games: 4, rest: 0, streak: 1 },
  { id: 'E', games: 4, rest: 0, streak: 2 },
].map((p) => ({
  ...p,
  score: 0.85 * ((4 - p.games) / 4) + 0.7 * (p.rest / 2) - 0.65 * (p.streak / 2),
}))
const ON_COURT = 4

function QueueArt({ t }) {
  const max = Math.max(...QUEUE.map((p) => Math.abs(p.score)))
  return (
    <div>
      <div className="grid grid-cols-[1.5rem_repeat(3,2.75rem)_1fr] items-center gap-x-1 gap-y-1 text-[11px]">
        <span />
        <span className="text-center text-[10px] text-slate-500 dark:text-slate-400">
          {t('insGames')}
        </span>
        <span className="text-center text-[10px] text-slate-500 dark:text-slate-400">
          {t('insWaited')}
        </span>
        <span className="text-center text-[10px] text-slate-500 dark:text-slate-400">
          {t('insStreak')}
        </span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400">{t('insScore')}</span>
        {QUEUE.map((p, i) => {
          const on = i < ON_COURT
          return [
            <span
              key={p.id}
              className={cx(
                'grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold',
                on
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
              )}
            >
              {p.id}
            </span>,
            <span key={p.id + 'g'} className="text-center tabular-nums">
              {p.games}
            </span>,
            <span key={p.id + 'r'} className="text-center tabular-nums">
              {p.rest}
            </span>,
            <span
              key={p.id + 's'}
              className={cx(
                'text-center tabular-nums',
                p.streak >= 2 && 'font-bold text-rose-600 dark:text-rose-400'
              )}
            >
              {p.streak}
            </span>,
            <span key={p.id + 'b'} className="flex h-3 items-center">
              <span
                className={cx(
                  'h-full rounded-sm',
                  p.score >= 0 ? 'bg-brand-500' : 'bg-rose-400'
                )}
                style={{ width: `${(Math.abs(p.score) / max) * 100}%` }}
              />
            </span>,
          ]
        })}
      </div>
      <p className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">
        {t('insQueueResult')}
      </p>
    </div>
  )
}

/* -------------------------------------------------- 2. who partners whom */

// the four from step 1. Levels 🐣1 🌱2 ⭐3 🔥4; F and A partnered last round.
// Costs use the default weights: level gap 0.85 × (gap / 8)², a partner
// repeated from the round before 0.76 × (1 + 2 × 1.5) / 2 / 2.
const LEVEL = { A: '⭐', B: '🐣', C: '🔥', F: '🌱' }
const OPTIONS = [
  { a: ['A', 'B'], b: ['C', 'F'], sums: [4, 6], level: 0.85 * (2 / 8) ** 2, repeat: 0 },
  { a: ['A', 'C'], b: ['B', 'F'], sums: [7, 3], level: 0.85 * (4 / 8) ** 2, repeat: 0 },
  { a: ['A', 'F'], b: ['B', 'C'], sums: [5, 5], level: 0, repeat: (0.76 * 4) / 4 },
]

function PairArt({ t }) {
  const totals = OPTIONS.map((o) => o.level + o.repeat)
  const best = totals.indexOf(Math.min(...totals))
  const max = Math.max(...totals)
  return (
    <div className="space-y-1.5">
      {OPTIONS.map((o, i) => (
        <div
          key={i}
          className={cx(
            'flex items-center gap-2 rounded-lg px-2 py-1.5',
            i === best && 'bg-brand-100 ring-1 ring-brand-600 dark:bg-brand-950'
          )}
        >
          <span className="w-28 shrink-0 text-[11px] font-semibold">
            {o.a.map((id) => id + LEVEL[id]).join(' ')}
            <span className="font-normal text-slate-400"> vs </span>
            {o.b.map((id) => id + LEVEL[id]).join(' ')}
          </span>
          <span className="flex h-3 min-w-0 flex-1 overflow-hidden rounded-sm bg-slate-200 dark:bg-slate-800">
            <span
              className="h-full bg-violet-500"
              style={{ width: `${(o.level / max) * 100}%` }}
            />
            <span
              className="h-full bg-rose-500"
              style={{ width: `${(o.repeat / max) * 100}%` }}
            />
          </span>
          <span className="w-14 shrink-0 text-right text-[10px] text-slate-500 tabular-nums dark:text-slate-400">
            {o.sums[0]} : {o.sums[1]}
          </span>
        </div>
      ))}
      <p className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-violet-500" />
          {t('insLevelGap')}
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-2 rounded-sm bg-rose-500" />
          {t('insRepeat')}
        </span>
        <span>{t('insSums')}</span>
      </p>
      <p className="text-[11px] text-slate-600 dark:text-slate-300">{t('insPairResult')}</p>
    </div>
  )
}

/* -------------------------------------------- 3. polishing the schedule */

const zeroPairs = (grid) => {
  let n = 0
  for (let i = 0; i < grid.length; i++)
    for (let j = i + 1; j < grid.length; j++) if (!grid[i][j]) n++
  return n
}

function Heatmap({ grid }) {
  return (
    <div className="grid w-max grid-cols-9 gap-px">
      {grid.flatMap((row, i) =>
        row.map((v, j) => (
          <span
            key={`${i}-${j}`}
            className={cx(
              'h-2.5 w-2.5 rounded-[2px]',
              v < 0
                ? 'bg-slate-200 dark:bg-slate-800'
                : v === 0
                  ? 'bg-rose-500'
                  : v === 1
                    ? 'bg-brand-200 dark:bg-brand-700'
                    : v === 2
                      ? 'bg-brand-500'
                      : v === 3
                        ? 'bg-brand-800 dark:bg-brand-200'
                        : 'bg-amber-500'
            )}
          />
        ))
      )}
    </div>
  )
}

function Stage({ label, grid, count }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Heatmap grid={grid} />
      <span className="text-center text-[10px] leading-tight font-semibold whitespace-pre-line">
        {label}
      </span>
      <span
        className={cx(
          'text-[10px] font-bold tabular-nums',
          count ? 'text-rose-600 dark:text-rose-400' : 'text-brand-700 dark:text-brand-300'
        )}
      >
        {count}
      </span>
    </div>
  )
}

function PolishArt({ t }) {
  const stages = [
    ['original', t('insStageOriginal')],
    ['rounds', t('insStageRounds')],
    ['polished', t('insStagePolished')],
  ]
  return (
    <div className="space-y-3">
      {[
        ['partners', t('insPartnerMaps'), t('insNeverPartnered')],
        ['opponents', t('insOpponentMaps'), t('insNeverFaced')],
      ].map(([kind, title, unit]) => (
        <div key={kind}>
          <p className="mb-1.5 text-[11px] font-semibold">{title}</p>
          <div className="flex justify-between gap-2 overflow-x-auto">
            {stages.map(([k, label]) => {
              const grid = PAIRINGS[k][kind]
              return (
                <Stage key={k} label={label} grid={grid} count={`${zeroPairs(grid)} ${unit}`} />
              )
            })}
          </div>
        </div>
      ))}
      <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="inline-block h-2 w-2 rounded-sm bg-rose-500" /> 0
        <span className="inline-block h-2 w-2 rounded-sm bg-brand-200 dark:bg-brand-700" /> 1
        <span className="inline-block h-2 w-2 rounded-sm bg-brand-500" /> 2
        <span className="inline-block h-2 w-2 rounded-sm bg-brand-800 dark:bg-brand-200" /> 3
        <span className="inline-block h-2 w-2 rounded-sm bg-amber-500" /> 4+
        <span>· {t('insMapLegend')}</span>
      </p>
      <p className="text-[11px] text-slate-600 dark:text-slate-300">{t('insPolishResult')}</p>
    </div>
  )
}
