import { useState } from 'react'
import { exportSchedulePng } from '../lib/exportImage'
import { levelMeta } from './PlayerBits'
import { Card, cx } from './ui'

/**
 * The whole session on one grid: a row per round (1 → n), a column per court.
 * Deliberately dense — this is the "what's the plan" view, the card list is
 * the "what's happening right now" view.
 */
export default function ScheduleTable({ rounds, courts, playersById, t, setToast }) {
  const [showLevels, setShowLevels] = useState(false)
  const [busy, setBusy] = useState(false)

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

  const benchNames = (round) =>
    round.benched
      .map((id) => playersById.get(id)?.name)
      .filter(Boolean)
      .join(', ')

  const hasBench = rounds.some((r) => r.benched.length)

  /** One side of a net on a single line: "สมชาย + หมู" */
  const Side = ({ ids, tone }) => (
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
          </span>
        )
      })}
    </span>
  )

  const onExport = async () => {
    setBusy(true)
    try {
      const where = await exportSchedulePng({
        rounds,
        courts,
        playersById,
        showLevels,
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
      if (where === 'downloaded') setToast?.(t('exportDone'))
    } catch {
      setToast?.(t('exportFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
        <button
          onClick={() => setShowLevels((v) => !v)}
          className={cx(
            'rounded-lg px-2.5 py-1 text-xs font-medium transition',
            showLevels
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
          )}
        >
          {t('showLevels')}
        </button>
        <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500">
          {t('tableHint')}
        </span>
        <button
          onClick={onExport}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
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

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="sticky left-0 z-10 bg-slate-50 py-1.5 pr-2 pl-3 text-[10px] font-semibold tracking-wide text-slate-400 uppercase dark:bg-slate-900">
                #
              </th>
              {columns.map((c) => (
                <th
                  key={c.id}
                  className="min-w-36 px-2 py-1.5 text-[10px] font-semibold tracking-wide text-slate-400 uppercase"
                >
                  {t('courtLabel')} {c.name}
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
            {rounds.map((round, i) => (
              <tr
                key={round.id}
                className={cx(
                  'border-b border-slate-100 last:border-0 dark:border-slate-800/70',
                  i % 2 === 1 && 'bg-slate-50/60 dark:bg-slate-800/20'
                )}
              >
                <td
                  className={cx(
                    'sticky left-0 z-10 py-1.5 pr-2 pl-3 align-middle',
                    i % 2 === 1
                      ? 'bg-slate-50 dark:bg-slate-900'
                      : 'bg-slate-50 dark:bg-slate-900'
                  )}
                >
                  <span className="text-xs font-bold text-slate-400 tabular-nums">{i + 1}</span>
                </td>

                {columns.map((c) => {
                  const m = round.matches.find((x) => x.courtId === c.id)
                  if (!m)
                    return (
                      <td key={c.id} className="px-2 py-1.5 text-xs text-slate-300">
                        —
                      </td>
                    )
                  const hasScore = typeof m.scoreA === 'number' && typeof m.scoreB === 'number'
                  return (
                    <td key={c.id} className="px-2 py-1.5 align-middle">
                      <Side ids={m.teamA} tone="A" />
                      <span className="flex items-center gap-1 text-[10px] leading-3 font-bold text-slate-300 dark:text-slate-600">
                        {t('vs')}
                        {hasScore && (
                          <span className="text-slate-500 tabular-nums dark:text-slate-400">
                            {m.scoreA}–{m.scoreB}
                          </span>
                        )}
                        {m.done && (
                          <span className="text-brand-600 dark:text-brand-400">✓</span>
                        )}
                      </span>
                      <Side ids={m.teamB} tone="B" />
                    </td>
                  )
                })}

                {hasBench && (
                  <td className="px-2 py-1.5 align-middle text-[11px] leading-4 text-slate-400 dark:text-slate-500">
                    {benchNames(round) || '—'}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
