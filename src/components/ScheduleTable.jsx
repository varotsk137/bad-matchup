import { Fragment, useMemo, useState } from 'react'
import { renderSchedulePng } from '../lib/exportImage'
import ImageSheet from './ImageSheet'
import { levelMeta } from './PlayerBits'
import { Card, courtTone, cx } from './ui'

/**
 * The whole session on one grid: a row per round (1 → n), a column per court.
 * Deliberately dense — this is the "what's the plan" view, the card list is
 * the "what's happening right now" view.
 */
export default function ScheduleTable({
  rounds,
  courts,
  playersById,
  t,
  setToast,
  staminaLimit = 2,
  onToggleDone, // absent in the read-only shared view
}) {
  const [showLevels, setShowLevels] = useState(false)
  // a checking aid, so it stays off the everyday view and out of the image
  const [showStamina, setShowStamina] = useState(false)
  const [busy, setBusy] = useState(false)
  const [png, setPng] = useState(null)

  const columns = []
  const seen = new Set()
  for (const c of courts) {
    if (rounds.some((r) => r.matches.some((m) => m.courtId === c.id))) {
      columns.push({ id: c.id, name: c.name })
      seen.add(c.id)
    }
  }
  for (const r of rounds) {
    for (const m of r.matches) {
      if (!seen.has(m.courtId)) {
        columns.push({ id: m.courtId, name: m.courtName })
        seen.add(m.courtId)
      }
    }
  }

  // per round, per player: how many rounds in a row they have played (or sat
  // out) up to and including that round — the same counter the stamina rule uses
  const stamina = useMemo(() => {
    const play = new Map()
    const rest = new Map()
    return rounds.map((round) => {
      const on = new Set(round.matches.flatMap((m) => [...m.teamA, ...m.teamB]).filter(Boolean))
      const ids = new Set([...on, ...round.benched, ...play.keys(), ...rest.keys()])
      const row = new Map()
      for (const id of ids) {
        if (on.has(id)) {
          play.set(id, (play.get(id) || 0) + 1)
          rest.set(id, 0)
        } else {
          rest.set(id, (rest.get(id) || 0) + 1)
          play.set(id, 0)
        }
        row.set(id, { play: play.get(id), rest: rest.get(id) })
      }
      return row
    })
  }, [rounds])

  const benchNames = (round) =>
    round.benched
      .map((id) => playersById.get(id)?.name)
      .filter(Boolean)
      .join(', ')

  const hasBench = rounds.some((r) => r.benched.length)
  // the first round that is not fully ticked off is the one on court now
  const currentIdx = rounds.findIndex((r) => !r.matches.every((m) => m.done))

  const PlayBadge = ({ n }) => (
    <span
      className={cx(
        'ml-0.5 rounded px-0.5 text-[10px] font-bold tabular-nums',
        n > staminaLimit
          ? 'bg-rose-600 text-white'
          : n === staminaLimit
            ? 'bg-accent-100 text-accent-800 dark:bg-accent-950 dark:text-accent-300'
            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
      )}
    >
      {n}/{staminaLimit}
    </span>
  )

  const RestBadge = ({ n }) => (
    <span
      className={cx(
        'ml-0.5 rounded px-0.5 text-[10px] font-bold tabular-nums',
        n >= 3
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          : 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300'
      )}
    >
      💤{n}
    </span>
  )

  /** One side of a net on a single line: "สมชาย + หมู" */
  const Side = ({ ids, tone, ri }) => (
    <span
      className={cx(
        'block truncate text-[13px] leading-5 font-semibold',
        tone === 'A' ? 'text-sky-700 dark:text-sky-300' : 'text-rose-700 dark:text-rose-300'
      )}
    >
      {ids.map((id, i) => {
        const p = id ? playersById.get(id) : null
        return (
          <span key={i}>
            {i > 0 && <span className="font-normal text-slate-400"> + </span>}
            {p ? p.name : '—'}
            {p && showLevels && (
              <span className="ml-0.5 text-[10px] font-medium text-slate-400">
                {levelMeta(p.level).code}
              </span>
            )}
            {p && showStamina && <PlayBadge n={stamina[ri].get(id)?.play ?? 1} />}
          </span>
        )
      })}
    </span>
  )

  const onExport = async () => {
    setBusy(true)
    try {
      const rendered = await renderSchedulePng({
        rounds,
        courts,
        playersById,
        title: t('imageTitle'),
        subtitle: `${rounds.length} ${t('roundsUnit')} · ${new Date().toLocaleDateString()}`,
        labels: {
          round: t('round'),
          court: t('courtLabel'),
          bench: t('bench'),
          vs: t('vs'),
          footer: t('appName'),
        },
      })
      setPng(rendered)
    } catch {
      setToast?.(t('exportFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <ImageSheet png={png} onClose={() => setPng(null)} t={t} setToast={setToast} />
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <button
          onClick={() => setShowLevels((v) => !v)}
          className={cx(
            'rounded-full border-2 px-2.5 py-0.5 text-xs whitespace-nowrap transition',
            showLevels
              ? 'border-slate-900 bg-shuttle text-shuttle-ink dark:border-slate-950'
              : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          {t('showLevels')}
        </button>
        <button
          onClick={() => setShowStamina((v) => !v)}
          className={cx(
            'rounded-full border-2 px-2.5 py-0.5 text-xs whitespace-nowrap transition',
            showStamina
              ? 'border-slate-900 bg-shuttle text-shuttle-ink dark:border-slate-950'
              : 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
          )}
        >
          {t('showStamina')}
        </button>
        <span className="ml-auto hidden text-[11px] text-slate-400 sm:inline dark:text-slate-500">
          {t('tableHint')}
        </span>
        <button
          onClick={onExport}
          disabled={busy}
          className="press ml-auto inline-flex items-center gap-1.5 rounded-full border-2 border-slate-900 bg-brand-600 px-3 py-1 text-xs whitespace-nowrap text-white hover:bg-brand-700 disabled:opacity-60 sm:ml-0 dark:border-slate-950"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M3.5 13.5V15a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-1.5" strokeLinecap="round" />
          </svg>
          {busy ? t('exporting') : t('exportImage')}
        </button>
      </div>

      {showStamina && (
        <p className="border-b border-slate-100 px-3 py-1.5 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {t('staminaLegend', { a: `1/${staminaLimit}`, b: '💤1' })}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="sticky left-0 z-10 bg-slate-50 py-1.5 pr-2 pl-3 text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:bg-slate-900">
                #
              </th>
              {columns.map((c, ci) => (
                <th
                  key={c.id}
                  colSpan={onToggleDone ? 2 : 1}
                  className="min-w-36 px-2 py-1.5 text-left"
                >
                  <span
                    className={cx(
                      'font-display inline-block rounded-full border-2 border-slate-900 px-2.5 py-0.5 text-[11px] dark:border-slate-950',
                      courtTone(ci)
                    )}
                  >
                    {t('courtLabel')} {c.name}
                  </span>
                </th>
              ))}
              {hasBench && (
                <th className="min-w-24 px-2 py-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                  {t('bench')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rounds.map((round, i) => {
              const finished = round.matches.length > 0 && round.matches.every((m) => m.done)
              const current = i === currentIdx
              return (
                <tr
                  key={round.id}
                  className={cx(
                    'border-b border-slate-100 last:border-0 dark:border-slate-800/70',
                    current
                      ? 'bg-brand-50 dark:bg-brand-950/40'
                      : i % 2 === 1 && 'bg-slate-50/60 dark:bg-slate-800/20',
                    finished && 'opacity-55'
                  )}
                >
                  <td
                    className={cx(
                      'sticky left-0 z-10 py-1.5 pr-2 pl-3 align-middle',
                      current
                        ? 'border-l-4 border-brand-600 bg-brand-50 pl-2 dark:bg-brand-950'
                        : 'bg-slate-50 dark:bg-slate-900'
                    )}
                  >
                    <span
                      className={cx(
                        'block text-xs font-bold tabular-nums',
                        current ? 'text-brand-700 dark:text-brand-300' : 'text-slate-400'
                      )}
                    >
                      {i + 1}
                    </span>
                    {current && (
                      <span className="block text-[9px] leading-tight font-semibold text-brand-700 dark:text-brand-300">
                        {t('nowPlaying')}
                      </span>
                    )}
                  </td>

                  {columns.map((c) => {
                    const m = round.matches.find((x) => x.courtId === c.id)
                    if (!m)
                      return (
                        <td
                          key={c.id}
                          colSpan={onToggleDone ? 2 : 1}
                          className="px-2 py-1.5 text-xs text-slate-300"
                        >
                          —
                        </td>
                      )
                    const hasScore =
                      typeof m.scoreA === 'number' && typeof m.scoreB === 'number'
                    return (
                      <Fragment key={c.id}>
                        <td
                          className={cx(
                            'py-1.5 pl-2 align-middle',
                            onToggleDone ? 'pr-1' : 'pr-2'
                          )}
                        >
                          <div className="min-w-0">
                            <Side ids={m.teamA} tone="A" ri={i} />
                            <span className="flex items-center gap-1 text-[10px] leading-3 font-bold text-slate-300 dark:text-slate-600">
                              {t('vs')}
                              {hasScore && (
                                <span className="text-slate-500 tabular-nums dark:text-slate-400">
                                  {m.scoreA}–{m.scoreB}
                                </span>
                              )}
                              {m.done && !onToggleDone && (
                                <span className="text-brand-600 dark:text-brand-400">✓</span>
                              )}
                            </span>
                            <Side ids={m.teamB} tone="B" ri={i} />
                          </div>
                        </td>
                        {/* its own narrow column, so the pills line up row after row and
                            sit right after the longest names on that court */}
                        {onToggleDone && (
                          <td className="w-px py-1.5 pr-2 align-middle">
                            <button
                              onClick={() => onToggleDone(round, m.id)}
                              aria-pressed={!!m.done}
                              title={t(m.done ? 'reopen' : 'finishGame')}
                              className={cx(
                                'inline-flex h-7 shrink-0 items-center gap-1 rounded-full border px-2 text-[11px] font-semibold whitespace-nowrap transition active:scale-95',
                                m.done
                                  ? 'border-brand-600 bg-brand-600 text-white'
                                  : 'border-slate-300 text-slate-600 hover:border-brand-500 hover:text-brand-700 dark:border-slate-600 dark:text-slate-300'
                              )}
                            >
                              <span aria-hidden>{m.done ? '✓' : '○'}</span>
                              {t(m.done ? 'matchFinished' : 'finishGame')}
                            </button>
                          </td>
                        )}
                      </Fragment>
                    )
                  })}

                  {hasBench && (
                    <td className="px-2 py-1.5 align-middle text-[11px] leading-4 text-slate-400 dark:text-slate-500">
                      {!round.benched.length
                        ? '—'
                        : showStamina
                          ? round.benched.map((id, j) => {
                              const p = playersById.get(id)
                              if (!p) return null
                              return (
                                <span key={id} className="whitespace-nowrap">
                                  {j > 0 && ', '}
                                  {p.name}
                                  <RestBadge n={stamina[i].get(id)?.rest ?? 1} />
                                </span>
                              )
                            })
                          : benchNames(round) || '—'}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
