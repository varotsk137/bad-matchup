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
    !!selected &&
    !selected.bench &&
    selected.matchId === matchId &&
    selected.team === team &&
    selected.idx === idx

  const handle = () => onTap({ matchId, team, idx })
  const ring = isSelected && 'bg-accent-100 ring-2 ring-accent-500 dark:bg-accent-900/40'
  // a full 44px row per name: the whole name is the thing you tap to swap
  const base = cx(
    'flex h-11 w-full min-w-0 items-center rounded-lg px-1.5 transition',
    'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
    team === 'B' ? 'justify-end text-right' : 'text-left',
    !locked && 'active:scale-[0.98]',
    ring
  )

  if (!player) {
    return (
      <button
        type="button"
        disabled={locked}
        onClick={handle}
        aria-pressed={isSelected}
        className={cx(
          base,
          'border border-dashed border-slate-300 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-400'
        )}
      >
        <span className="truncate">+ {t('emptySlot')}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      disabled={locked}
      onClick={handle}
      title={player.name}
      aria-pressed={isSelected}
      className={cx(
        base,
        'text-[0.9375rem] leading-snug',
        TEAM_TEXT[team],
        winner ? 'font-bold' : 'font-medium'
      )}
    >
      <span className="truncate">{player.name}</span>
    </button>
  )
}

/** Optional: a match can be finished with both boxes left empty. `ink` draws it on the dark scoreboard. */
export function ScoreBox({ value, onChange, disabled, side, t, ink = false }) {
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
      aria-label={t(side === 'A' ? 'v4ScoreA' : 'v4ScoreB')}
      className={cx(
        'num h-11 w-11 shrink-0 rounded-xl border text-center text-lg',
        'focus:ring-2 focus:outline-none disabled:opacity-100',
        ink
          ? cx(
              'border-slate-50/25 bg-slate-50/5 focus:ring-accent-400 placeholder:text-slate-400',
              side === 'A' ? 'text-sky-200' : 'text-rose-200'
            )
          : cx('bg-slate-50 dark:bg-slate-950', SCORE_BOX[side])
      )}
    />
  )
}

const check = (
  <svg
    viewBox="0 0 20 20"
    className="h-5 w-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    aria-hidden
  >
    <path d="m5 10.5 3.5 3.5L15 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/**
 * One match on one row: the court, the blue side (players 1, 2), its score,
 * the red side's score and the red side (players 3, 4), then the finish
 * button. `context` ("Round 3 · court 1") describes the finish button, whose
 * name stays a plain "Finish".
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
  context,
}) {
  const winner =
    typeof match.scoreA === 'number' &&
    typeof match.scoreB === 'number' &&
    match.scoreA !== match.scoreB
      ? match.scoreA > match.scoreB
        ? 'A'
        : 'B'
      : null
  const ctxId = `ctx-${match.id}`

  const side = (team) => {
    const ids = team === 'A' ? match.teamA : match.teamB
    return (
      <div
        role="group"
        aria-label={t(team === 'A' ? 'v4TeamA' : 'v4TeamB')}
        className="min-w-0 flex-1"
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
            winner={winner === team}
            t={t}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={cx(
        // min-w-0: a grid item, so a long name truncates instead of
        // stretching the row past the round
        'flex min-w-0 items-center gap-1 rounded-2xl border-(length:--line-w) py-1 pr-1 pl-1.5 transition-colors',
        match.done
          ? 'border-transparent bg-slate-100 dark:bg-slate-800/60'
          : 'border-edge bg-slate-50 dark:bg-slate-900'
      )}
    >
      <span
        className={cx(
          'font-display grid h-7 min-w-7 max-w-12 shrink-0 place-items-center truncate rounded-[var(--radius-pill)] border-(length:--line-w) border-btn-edge px-1.5 text-xs',
          courtTone(courtIndex)
        )}
        title={match.courtName}
        aria-hidden
      >
        {match.courtName}
      </span>
      {context && (
        <span id={ctxId} className="sr-only">
          {context}
        </span>
      )}

      {side('A')}

      <ScoreBox
        value={match.scoreA}
        onChange={(v) => onScore(match.id, { scoreA: v })}
        disabled={readOnly}
        side="A"
        t={t}
      />
      <span
        className="w-1.5 shrink-0 text-center text-xs font-bold text-slate-600 dark:text-slate-400"
        aria-hidden
      >
        –
      </span>
      <ScoreBox
        value={match.scoreB}
        onChange={(v) => onScore(match.id, { scoreB: v })}
        disabled={readOnly}
        side="B"
        t={t}
      />

      {side('B')}

      {readOnly ? (
        match.done ? (
          <span
            role="img"
            aria-label={t('v4MatchFinished')}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100"
          >
            {check}
          </span>
        ) : (
          <span className="h-11 w-11 shrink-0" aria-hidden />
        )
      ) : (
        <button
          type="button"
          onClick={() => onToggleDone(match.id)}
          aria-label={t(match.done ? 'reopen' : 'finishGame')}
          aria-describedby={context ? ctxId : undefined}
          title={t(match.done ? 'reopen' : 'finishGame')}
          className={cx(
            'grid h-11 w-11 shrink-0 place-items-center rounded-full text-xs font-bold transition active:scale-95',
            'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none',
            match.done
              ? 'bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100'
              : 'border-2 border-slate-300 text-slate-700 hover:border-brand-500 hover:text-brand-700 dark:border-slate-600 dark:text-slate-200'
          )}
        >
          {match.done ? check : t('finishShort')}
        </button>
      )}
    </div>
  )
}
