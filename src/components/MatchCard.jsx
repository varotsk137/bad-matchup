import { GenderDot, LevelBadge } from './PlayerBits'
import { cx } from './ui'

const SIDE = {
  A: {
    wrap: 'bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-900/60',
    chip: 'border-sky-200/80 bg-slate-50 dark:border-sky-900/60 dark:bg-slate-900',
    win: 'ring-2 ring-sky-500',
  },
  B: {
    wrap: 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/60',
    chip: 'border-rose-200/80 bg-slate-50 dark:border-rose-900/60 dark:bg-slate-900',
    win: 'ring-2 ring-rose-500',
  },
}

function Slot({ player, team, idx, matchId, selected, onTap, locked, t }) {
  const isSelected =
    selected &&
    !selected.bench &&
    selected.matchId === matchId &&
    selected.team === team &&
    selected.idx === idx

  const handle = () => onTap({ matchId, team, idx })

  if (!player) {
    return (
      <button
        disabled={locked}
        onClick={handle}
        className={cx(
          'flex h-10 flex-1 items-center justify-center rounded-lg border border-dashed text-xs font-medium transition',
          isSelected
            ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-900/40 dark:text-accent-200'
            : 'border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500',
          !locked && 'hover:border-brand-400 active:scale-[0.98]'
        )}
      >
        + {t('emptySlot')}
      </button>
    )
  }

  return (
    <button
      disabled={locked}
      onClick={handle}
      className={cx(
        'flex h-10 min-w-0 flex-1 items-center gap-1.5 rounded-lg border px-2 text-left transition',
        SIDE[team].chip,
        isSelected && 'ring-2 ring-accent-500 ring-offset-1 dark:ring-offset-slate-900',
        !locked && 'active:scale-[0.98]'
      )}
    >
      <GenderDot gender={player.gender} />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{player.name}</span>
      <LevelBadge level={player.level} />
    </button>
  )
}

const SCORE_TONE = {
  A: {
    marker: '🟦',
    box: 'border-sky-300 bg-sky-50 text-sky-800 focus:border-sky-500 focus:ring-sky-500/30 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
  },
  B: {
    marker: '🟥',
    box: 'border-rose-300 bg-rose-50 text-rose-800 focus:border-rose-500 focus:ring-rose-500/30 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
  },
}

/** Carries its team's colour and marker, so nobody keys the score into the wrong side. */
function ScoreBox({ value, onChange, disabled, side }) {
  const tone = SCORE_TONE[side]
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5">
      <span className="text-[9px] leading-none" aria-hidden>
        {tone.marker}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={99}
        disabled={disabled}
        value={value ?? ''}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return onChange(null)
          const n = Math.max(0, Math.min(99, Number(raw)))
          onChange(Number.isNaN(n) ? null : n)
        }}
        placeholder="–"
        aria-label={`score ${side}`}
        className={cx(
          'h-8 w-10 rounded-md border text-center text-base font-bold tabular-nums',
          'focus:ring-2 focus:outline-none',
          'disabled:opacity-80',
          tone.box
        )}
      />
    </span>
  )
}

export default function MatchCard({
  match,
  playersById,
  t,
  selected,
  onTap,
  onScore,
  onToggleDone,
  editable,
  readOnly = false,
}) {
  const winner =
    typeof match.scoreA === 'number' &&
    typeof match.scoreB === 'number' &&
    match.scoreA !== match.scoreB
      ? match.scoreA > match.scoreB
        ? 'A'
        : 'B'
      : null

  const renderTeam = (team) => {
    const ids = team === 'A' ? match.teamA : match.teamB
    const isWinner = match.done && winner === team
    return (
      <div
        className={cx(
          'flex items-center gap-1.5 rounded-xl border p-1',
          SIDE[team].wrap,
          isWinner && SIDE[team].win
        )}
      >
        {ids.map((id, idx) => (
          <Slot
            key={`${team}-${idx}`}
            player={id ? playersById.get(id) : null}
            team={team}
            idx={idx}
            matchId={match.id}
            selected={selected}
            onTap={onTap}
            locked={!editable}
            t={t}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cx(
        'rounded-xl border p-2 transition',
        match.done
          ? 'border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/20'
          : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900'
      )}
    >
      {renderTeam('A')}

      <div className="flex items-center gap-2 py-1">
        <span className="shrink-0 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-bold text-white dark:bg-slate-700">
          {match.courtName}
        </span>
        {match.type === 'singles' && (
          <span className="shrink-0 text-[10px] font-medium text-slate-400">
            {t('singles')}
          </span>
        )}
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <ScoreBox
          value={match.scoreA}
          onChange={(v) => onScore(match.id, { scoreA: v })}
          disabled={match.done || readOnly}
          side="A"
        />
        <span className="text-[10px] font-bold text-slate-400">:</span>
        <ScoreBox
          value={match.scoreB}
          onChange={(v) => onScore(match.id, { scoreB: v })}
          disabled={match.done || readOnly}
          side="B"
        />
        {readOnly ? (
          match.done && (
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-600 text-white">
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              >
                <path d="m5 10.5 3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          )
        ) : (
          <button
            onClick={() => onToggleDone(match.id)}
            aria-label={t(match.done ? 'reopen' : 'finishGame')}
            title={t(match.done ? 'reopen' : 'finishGame')}
            className={cx(
              'grid h-8 w-8 shrink-0 place-items-center rounded-md transition active:scale-95',
              match.done
                ? 'bg-brand-600 text-white'
                : 'border border-slate-300 text-slate-400 hover:border-brand-500 hover:text-brand-600 dark:border-slate-700'
            )}
          >
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
            >
              <path d="m5 10.5 3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {renderTeam('B')}
    </div>
  )
}
