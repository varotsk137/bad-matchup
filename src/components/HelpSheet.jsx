import { Sheet, cx } from './ui'

/**
 * The "?" manual. One card per matching mode, each with a small drawing of
 * what that mode actually does to the courts — the one-line descriptions on
 * the mode buttons are not enough to tell "balanced" from "rotation".
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
          emoji="🔁"
          title={t('modeRotation')}
          points={[t('helpRotation1'), t('helpRotation2')]}
        >
          <RotationArt t={t} />
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

        <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
          <h4 className="mb-1.5 text-sm font-semibold">💡 {t('helpTipsTitle')}</h4>
          <ul className="list-disc space-y-1 pl-5 text-xs text-slate-600 dark:text-slate-300">
            <li>{t('helpTip1')}</li>
            <li>{t('helpTip2')}</li>
            <li>{t('helpTip3')}</li>
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

function RotationArt({ t }) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          {t('helpQueue')}
        </span>
        {['E', 'F', 'G', 'H'].map((id) => (
          <Dot key={id} id={id} />
        ))}
        <Arrow />
        <Court a={['A', 'B']} b={['C', 'D']} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          {t('helpNext')}
        </span>
        <Court a={['E', 'F']} b={['G', 'H']} />
        <Arrow />
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          {t('helpBackOfQueue')}
        </span>
        {['A', 'B', 'C', 'D'].map((id) => (
          <Dot key={id} id={id} dim />
        ))}
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
