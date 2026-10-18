import { useState } from 'react'
import HelpInsight from './HelpInsight'
import { REST } from './helpData'
import { Sheet, cx } from './ui'

/**
 * The "?" manual. One card per matching mode, each with a small drawing of
 * what that mode actually does to the courts — the one-line descriptions on
 * the mode buttons are not enough to tell the modes apart.
 */
export default function HelpSheet({ open, onClose, t }) {
  return (
    <Sheet open={open} onClose={onClose} title={t('helpTitle')}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('helpIntro')}</p>

        <Section
          emoji="⚖️"
          title={t('modeBalanced')}
          points={[t('helpBalanced1'), t('helpBalanced2'), t('helpBalanced3')]}
        >
          <BalancedArt t={t} />
        </Section>

        <Section
          emoji="🎲"
          title={t('modeRandom')}
          points={[t('helpRandom1'), t('helpRandom2')]}
        >
          <RandomArt />
        </Section>

        <Section
          emoji="✋"
          title={t('modeManual')}
          points={[t('helpManual1'), t('helpManual2')]}
        >
          <ManualArt t={t} />
        </Section>

        <HelpInsight t={t} />

        <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <h4 className="mb-1.5 text-sm font-semibold">💡 {t('helpTipsTitle')}</h4>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
            <li>{t('helpTip1')}</li>
            <li>{t('helpTip2')}</li>
            <li>{t('helpTip3')}</li>
            <li>{t('helpTip4')}</li>
            <li>{t('helpTip5')}</li>
          </ul>
        </div>
      </div>
    </Sheet>
  )
}

function Section({ emoji, title, points, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <h4 className="flex items-center gap-2 px-3 pt-3 text-sm font-semibold">
        <span aria-hidden>{emoji}</span>
        {title}
      </h4>
      <div className="mx-3 mt-2 rounded-xl bg-slate-100 p-2.5 dark:bg-slate-950/60">
        {children}
      </div>
      <ul className="list-disc space-y-1 px-3 pt-2 pb-3 pl-8 text-xs text-slate-600 dark:text-slate-300">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </section>
  )
}

/* ------------------------------------------------------------- drawings */

// one hue per pretend player, so the same letter is the same person in every frame
const TONE = {
  A: 'bg-sky-500 text-white',
  B: 'bg-pink-500 text-white',
  C: 'bg-violet-500 text-white',
  D: 'bg-accent-500 text-white',
  E: 'bg-brand-600 text-white',
  F: 'bg-rose-500 text-white',
  G: 'bg-cyan-600 text-white',
  H: 'bg-amber-700 text-white',
}

function Dot({ id, dim = false, ring = false, label }) {
  if (!id) {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-dashed border-slate-400 text-xs text-slate-400 dark:border-slate-600">
        +
      </span>
    )
  }
  return (
    <span
      className={cx(
        'relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold',
        TONE[id],
        dim && 'opacity-35',
        ring &&
          'ring-2 ring-slate-900 ring-offset-1 ring-offset-slate-100 dark:ring-white dark:ring-offset-slate-950'
      )}
    >
      {id}
      {label && (
        <span className="absolute -right-1.5 -bottom-1 rounded bg-slate-50 px-0.5 text-[9px] leading-tight dark:bg-slate-800">
          {label}
        </span>
      )}
    </span>
  )
}

/** A doubles court seen from above: side A | net | side B. */
function Court({ a, b, ringed = [], labels = {}, className = '' }) {
  const dot = (id, i) => <Dot key={i} id={id} ring={ringed.includes(id)} label={labels[id]} />
  return (
    <div
      className={cx(
        'flex items-center gap-1.5 rounded-lg border border-brand-700/40 bg-brand-100 px-2 py-1.5 dark:border-brand-500/30 dark:bg-brand-950',
        className
      )}
    >
      <div className="flex gap-1">{a.map(dot)}</div>
      <span className="h-7 w-0.5 rounded bg-slate-50 dark:bg-slate-300" aria-hidden />
      <div className="flex gap-1">{b.map(dot)}</div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </div>
  )
}

function Bench({ ids }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      <span className="text-[10px] text-slate-400" aria-hidden>
        🪑
      </span>
      {ids.map((id) => (
        <Dot key={id} id={id} dim />
      ))}
    </div>
  )
}

function Arrow() {
  return (
    <span className="text-slate-400" aria-hidden>
      →
    </span>
  )
}

function BalancedArt({ t }) {
  // A gets a different partner every round, and the bench changes hands so
  // nobody sits twice in a row
  const rounds = [
    { a: ['A', 'B'], b: ['C', 'D'], bench: ['E', 'F'] },
    { a: ['A', 'E'], b: ['F', 'B'], bench: ['C', 'D'] },
    { a: ['C', 'A'], b: ['D', 'E'], bench: ['B', 'F'] },
  ]
  return (
    <div className="space-y-1.5">
      {rounds.map((r, i) => (
        <Row key={i} label={`${t('round')} ${i + 1}`}>
          <Court a={r.a} b={r.b} ringed={['A']} />
          <Bench ids={r.bench} />
        </Row>
      ))}
      <p className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
        {t('helpBalancedArt')}
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Court a={['A', 'B']} b={['C', 'D']} labels={{ A: '👑', B: '🐣', C: '⭐', D: '⭐' }} />
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('helpBalancedLevel')}
        </span>
      </div>
    </div>
  )
}

function RandomArt() {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Court a={['A', 'B']} b={['C', 'D']} />
      <span className="text-base" aria-hidden>
        🎲
      </span>
      <Court a={['D', 'G']} b={['A', 'H']} />
      <span className="text-base" aria-hidden>
        🎲
      </span>
      <Court a={['B', 'A']} b={['F', 'C']} />
    </div>
  )
}

function ManualArt({ t }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Court a={['A', null]} b={['C', null]} />
      <Arrow />
      <span className="rounded-lg bg-brand-600 px-2 py-1 text-[11px] font-semibold text-white">
        {t('autoFill')}
      </span>
      <Arrow />
      <Court a={['A', 'E']} b={['C', 'G']} ringed={['E', 'G']} />
    </div>
  )
}

/* ------------------------------------------------- rest-mode explainer */

const EXAMPLE_LIMIT = 2
const cap = (s) => s[0].toUpperCase() + s.slice(1)

/**
 * Walks an example schedule once: for every round, each player's streak
 * (rounds in a row so far, 0 = resting) — the number the colours are about.
 */
function withStreaks(rounds) {
  const streak = {}
  return rounds.map(([c1, c2, bench]) => {
    const on = (c1 + c2).replace(/-/g, '')
    for (const id of 'ABCDEFGHI') streak[id] = on.includes(id) ? (streak[id] || 0) + 1 : 0
    return { courts: [c1, c2], bench, streak: { ...streak } }
  })
}

/** Headline numbers for one mode's example. */
function summarise(rounds) {
  const games = {}
  let longest = 0
  let over = 0
  for (const r of rounds)
    for (const [id, n] of Object.entries(r.streak)) {
      if (n) games[id] = (games[id] || 0) + 1
      longest = Math.max(longest, n)
      if (n > EXAMPLE_LIMIT) over++
    }
  const range = (v) =>
    Math.min(...v) === Math.max(...v) ? `${v[0]}` : `${Math.min(...v)}–${Math.max(...v)}`
  return {
    games: range(Object.values(games)),
    longest,
    over,
    resting: range(rounds.map((r) => r.bench.length)),
  }
}

function Fact({ label, value, bad }) {
  return (
    <div className="rounded-lg bg-slate-100 px-2 py-1.5 text-center dark:bg-slate-950/60">
      <p
        className={cx(
          'text-sm font-bold tabular-nums',
          bad && 'text-rose-600 dark:text-rose-400'
        )}
      >
        {value}
      </p>
      <p className="text-[10px] leading-tight text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

/** A player letter coloured by how many rounds in a row they have played. */
function Who({ id, n }) {
  return (
    <span
      className={cx(
        'inline-grid h-5 w-5 place-items-center rounded text-[11px] font-bold',
        n > EXAMPLE_LIMIT
          ? 'bg-rose-600 text-white'
          : n === EXAMPLE_LIMIT
            ? 'bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-300'
            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
      )}
    >
      {id}
    </span>
  )
}

function CourtCell({ court, streak, t }) {
  if (!court)
    return (
      <span className="block rounded border border-dashed border-slate-300 py-0.5 text-center text-[10px] text-slate-400 dark:border-slate-700">
        {t('restHelpIdle')}
      </span>
    )
  const [a, b] = court.split('-')
  return (
    <span className="flex items-center gap-0.5">
      {[...a].map((id) => (
        <Who key={id} id={id} n={streak[id]} />
      ))}
      <span className="px-0.5 text-[9px] text-slate-400">vs</span>
      {[...b].map((id) => (
        <Who key={id} id={id} n={streak[id]} />
      ))}
      {a.length === 1 && (
        <span className="ml-0.5 text-[9px] text-slate-500 dark:text-slate-400">
          {t('restHelpSingles')}
        </span>
      )}
    </span>
  )
}

/** The "?" next to the rest-mode picker in Settings. */
export function RestModeHelp({ open, onClose, t }) {
  const [mode, setMode] = useState('flex')
  const rounds = withStreaks(REST[mode])
  const sum = summarise(rounds)
  return (
    <Sheet open={open} onClose={onClose} title={t('restMode')}>
      <div className="space-y-3">
        <p className="text-sm text-slate-600 dark:text-slate-300">{t('restHelpIntro')}</p>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800">
          {['fill', 'flex', 'strict'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cx(
                'h-8 rounded-lg text-xs font-semibold transition',
                mode === m
                  ? 'bg-slate-50 text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              {t(`rest${cap(m)}`)}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t(`rest${cap(mode)}Hint`)}
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          <Fact label={t('restFactGames')} value={sum.games} />
          <Fact
            label={t('restFactLongest')}
            value={sum.longest}
            bad={sum.longest > EXAMPLE_LIMIT + 1}
          />
          <Fact label={t('restFactOver')} value={sum.over} bad={sum.over > 0} />
          <Fact label={t('restFactResting')} value={sum.resting} />
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-1 pr-1 pl-2 font-semibold">#</th>
                <th className="px-1 py-1 font-semibold">{t('courtLabel')} 1</th>
                <th className="px-1 py-1 font-semibold">{t('courtLabel')} 2</th>
                <th className="py-1 pr-2 pl-1 font-semibold">{t('bench')}</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r, i) => (
                <tr
                  key={i}
                  className={cx(
                    'border-b border-slate-100 last:border-0 dark:border-slate-800/70',
                    i % 2 === 1 && 'bg-slate-100/60 dark:bg-slate-800/20'
                  )}
                >
                  <td className="py-1 pr-1 pl-2 text-[10px] font-bold text-slate-400 tabular-nums">
                    {i + 1}
                  </td>
                  {r.courts.map((c, k) => (
                    <td key={k} className="px-1 py-1">
                      <CourtCell court={c} streak={r.streak} t={t} />
                    </td>
                  ))}
                  <td className="py-1 pr-2 pl-1">
                    <span className="flex flex-wrap gap-0.5">
                      {[...r.bench].map((id) => (
                        <span
                          key={id}
                          className="inline-grid h-5 w-5 place-items-center rounded border border-dashed border-slate-300 text-[11px] text-slate-500 dark:border-slate-600 dark:text-slate-400"
                        >
                          {id}
                        </span>
                      ))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('restHelpLegend')}</p>
      </div>
    </Sheet>
  )
}
