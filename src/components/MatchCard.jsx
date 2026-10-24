import { courtTone, cx } from './ui'

/** Team colours live in the text, like the table view — no tinted boxes. */
export const TEAM_TEXT = {
  A: 'text-sky-700 dark:text-sky-300',
  B: 'text-rose-700 dark:text-rose-300',
}

const SCORE_BOX = {
  A: 'border-sky-300 text-sky-800 focus:border-sky-500 focus:ring-sky-500/30 dark:border-sky-800 dark:text-sky-200',
  B: 'border-rose-300 text-rose-800 focus:border-rose-500 focus:ring-rose-500/30 dark:border-rose-800 dark:text-rose-200',
}

function Slot({ player, team, idx, matchId, selected, onTap, locked, winner, t }) {
  const isSelected =
    selected &&
    !selected.bench &&
    selected.matchId === matchId &&
    selected.team === team &&
    selected.idx === idx

  const handle = () => onTap({ matchId, team, idx })
  const ring = isSelected && 'bg-accent-100 ring-2 ring-accent-500 dark:bg-accent-900/40'

  if (!player) {
    return (
      <button
        disabled={locked}
        onClick={handle}
        className={cx(
          'w-full truncate rounded-md border border-dashed border-slate-300 px-1 py-0.5 text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500',
          team === 'B' ? 'text-right' : 'text-left',
          ring
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
      title={player.name}
      className={cx(
        'block w-full truncate rounded-md px-1 py-0.5 text-sm leading-snug transition',
        team === 'B' ? 'text-right' : 'text-left',
        TEAM_TEXT[team],
        winner ? 'font-extrabold' : 'font-semibold',
        !locked && 'active:scale-[0.98]',
        ring
      )}
    >
      {player.name}
    </button>
  )
}

/** Optional: a match can be finished with both boxes left empty. */
function ScoreBox({ value, onChange, disabled, side }) {
  return (
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
        'h-9 w-9 shrink-0 rounded-lg border bg-slate-50 text-center text-base font-bold tabular-nums dark:bg-slate-950',
        'focus:ring-2 focus:outline-none disabled:opacity-80',
        SCORE_BOX[side]
      )}
    />
  )
}

/**
 * One match on one row: the blue side (players 1, 2), its score, "vs", the
 * red side's score and the red side (players 3, 4), then the finish button.
 */
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
  courtIndex = 0,
}) {
  const winner =
    typeof match.scoreA === 'number' &&
    typeof match.scoreB === 'number' &&
    match.scoreA !== match.scoreB
      ? match.scoreA > match.scoreB
        ? 'A'
        : 'B'
      : null

  const side = (team) => {
    const ids = team === 'A' ? match.teamA : match.teamB
    return (
      <div className="min-w-0 flex-1 space-y-0.5">
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
            winner={winner === team}
            t={t}
          />
        ))}
      </div>
    )
  }

  const check = (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      <path d="m5 10.5 3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )

  return (
    <div
      className={cx(
        // min-w-0: a grid item, so a long name truncates instead of
        // stretching the row past the round
        'flex min-w-0 items-center gap-1.5 rounded-xl border-(length:--line-w) px-1.5 py-1.5 transition',
        match.done
          ? 'border-slate-200 bg-slate-50/60 opacity-70 dark:border-slate-800 dark:bg-slate-800/20'
          : 'border-edge bg-slate-50 dark:bg-slate-900'
      )}
    >
      <span
        className={cx(
          'font-display max-w-[3.25rem] shrink-0 truncate rounded-[var(--radius-pill)] border-(length:--line-w) border-btn-edge px-1.5 py-0.5 text-[10px]',
          courtTone(courtIndex)
        )}
        title={match.courtName}
      >
        {match.courtName}
      </span>

      {side('A')}

      <ScoreBox
        value={match.scoreA}
        onChange={(v) => onScore(match.id, { scoreA: v })}
        disabled={readOnly}
        side="A"
      />
      <span className="shrink-0 text-[10px] font-bold text-slate-400">vs</span>
      <ScoreBox
        value={match.scoreB}
        onChange={(v) => onScore(match.id, { scoreB: v })}
        disabled={readOnly}
        side="B"
      />

      {side('B')}

      {readOnly ? (
        <span
          className={cx(
            'grid h-10 w-10 shrink-0 place-items-center rounded-lg',
            match.done ? 'bg-brand-600 text-white' : 'text-transparent'
          )}
          aria-label={match.done ? t('finishGame') : undefined}
        >
          {match.done && check}
        </span>
      ) : (
        <button
          onClick={() => onToggleDone(match.id)}
          aria-label={t(match.done ? 'reopen' : 'finishGame')}
          title={t(match.done ? 'reopen' : 'finishGame')}
          className={cx(
            'grid h-10 w-10 shrink-0 place-items-center rounded-lg text-xs font-bold transition active:scale-95',
            match.done
              ? 'bg-brand-600 text-white'
              : 'border border-slate-300 text-slate-600 hover:border-brand-500 hover:text-brand-700 dark:border-slate-700 dark:text-slate-300'
          )}
        >
          {match.done ? check : t('finishShort')}
        </button>
      )}
    </div>
  )
}
