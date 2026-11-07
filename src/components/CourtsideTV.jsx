import { useEffect, useId, useRef } from 'react'
import Icon from './Icon'
import { courtTone, cx } from './ui'

const isArchived = (r) => r.matches.length > 0 && r.matches.every((m) => m.done)

/**
 * Court-side TV: the round on court, full screen, for a phone propped by the
 * court, a tablet or a mirrored TV, read from a few metres away. Always ink,
 * whatever the skin's light or dark mode. The number and the court rows rise in
 * only when a new round takes the courts, never on open or on a tick.
 */
export default function CourtsideTV({ state, playersById, t, onClose, onMatchDone }) {
  const total = state.rounds.length
  const active = state.rounds
    .map((round, i) => ({ round, number: i + 1 }))
    .filter((x) => !isArchived(x.round))
  const now = active[0]
  const next = active[1]
  const courtOrder = new Map(state.courts.map((c, i) => [c.id, i]))
  const name = (id) => (id && playersById.get(id)?.name) || '—'
  const team = (ids) => ids.map(name).join(' + ')

  const roundKey = now?.round.id ?? 'done'
  const firstKey = useRef(roundKey)
  const rise = roundKey !== firstKey.current
  const riseAt = (i) =>
    rise ? { animationDelay: `${i * 60}ms`, animationFillMode: 'backwards' } : undefined

  const panel = useRef(null)
  const headingId = useId()

  // focus in, focus back out
  useEffect(() => {
    const back = document.activeElement
    panel.current?.focus({ preventScroll: true })
    return () => {
      if (back?.isConnected) back.focus({ preventScroll: true })
    }
  }, [])

  // full screen where the browser allows it (not iPhone Safari), left on close
  useEffect(() => {
    let entered = false
    if (document.fullscreenEnabled && !document.fullscreenElement)
      document.documentElement
        .requestFullscreen?.()
        .then(() => (entered = true))
        .catch(() => {})
    return () => {
      if (entered && document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    }
  }, [])

  // keep the screen on; the browser drops the lock when the tab hides
  useEffect(() => {
    let lock = null
    let gone = false
    const grab = async () => {
      if (!navigator.wakeLock || document.visibilityState !== 'visible') return
      try {
        const l = await navigator.wakeLock.request('screen')
        if (gone) l.release().catch(() => {})
        else lock = l
      } catch {
        // low battery or not allowed: the screen may sleep
      }
    }
    grab()
    document.addEventListener('visibilitychange', grab)
    return () => {
      gone = true
      document.removeEventListener('visibilitychange', grab)
      lock?.release().catch(() => {})
    }
  }, [])

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
    } else if (e.key === 'Tab') {
      const f = panel.current.querySelectorAll('button:not([disabled])')
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      const at = document.activeElement
      if (e.shiftKey && (at === first || at === panel.current)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && at === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  const matches = now?.round.matches ?? []
  const one = matches.length < 2
  const benched = (now?.round.benched ?? [])
    .map((id) => playersById.get(id)?.name)
    .filter(Boolean)

  const side = (ids, blue, done) => (
    <span
      className={cx(
        'min-w-0 flex-1 font-semibold leading-[1.3] transition-opacity duration-200',
        done && 'opacity-50',
        blue ? 'text-sky-200' : cx('text-rose-200', !one && 'landscape:text-right')
      )}
    >
      {ids.map((id, i) => (
        <span key={i} className="block truncate">
          {name(id)}
        </span>
      ))}
    </span>
  )

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className={cx(
        'fixed inset-0 z-[55] flex flex-col gap-[2.5vmin] overflow-hidden bg-slate-950 text-slate-50 outline-none',
        'p-[max(3vmin,env(safe-area-inset-top))_max(3vmin,env(safe-area-inset-right))_max(3vmin,env(safe-area-inset-bottom))_max(3vmin,env(safe-area-inset-left))]',
        // names: the tallest that still fits two lines a side; one court stacks its sides
        one
          ? 'landscape:[--name:clamp(1rem,min(11dvh,5.5vw),7rem)] portrait:[--name:clamp(1rem,min(6.5dvh,9.5vw),5rem)]'
          : 'landscape:[--name:clamp(1rem,min(10dvh,3.9vw),5.5rem)] portrait:[--name:clamp(1rem,min(4.2dvh,8.5vw),4rem)]'
      )}
    >
      <div className="flex min-h-0 flex-1 gap-[3vmin] portrait:flex-col">
        {/* the round, huge */}
        <div className="flex shrink-0 items-start justify-between gap-3 landscape:w-[24vw] landscape:flex-col landscape:justify-start">
          <div className="min-w-0">
            <h2
              id={headingId}
              aria-live="polite"
              aria-atomic="true"
              className="text-[clamp(0.875rem,min(3.4dvh,5vw),2rem)] font-medium text-slate-300"
            >
              {t('round')}{' '}
              <span className="sr-only">
                {now ? `${now.number} / ${total}` : `${total} / ${total} · ${t('v4AllDone')}`}
              </span>
            </h2>
            <p className="mt-[1vmin] flex items-baseline gap-[0.15em]" aria-hidden>
              <span
                key={roundKey}
                className={cx(
                  'num inline-block text-slate-50',
                  'text-[clamp(4rem,min(30dvh,13vw),16rem)] portrait:text-[clamp(4rem,min(13dvh,26vw),12rem)]',
                  rise && 'animate-pop'
                )}
                style={riseAt(0)}
              >
                {now ? now.number : total}
              </span>
              <span className="num text-[clamp(1.25rem,min(8dvh,4vw),4rem)] text-slate-400 portrait:text-[clamp(1.25rem,min(4dvh,8vw),3rem)]">
                / {total}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3 landscape:mt-auto landscape:order-last">
            {now && (
              <span className="live-badge text-[clamp(0.75rem,min(2.6dvh,3.4vw),1.25rem)] font-bold">
                <span className="live-dot" aria-hidden />
                {t('roundNow')}
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-50/10 text-slate-100 hover:bg-slate-50/20 focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* one big row per court */}
        {now ? (
          <ul key={roundKey} className="flex min-h-0 min-w-0 flex-1 flex-col gap-[2.5vmin]">
            {matches.map((m, i) => (
              <li
                key={m.id}
                className={cx(
                  'flex min-h-0 flex-1 items-center gap-[2.5vmin] rounded-3xl bg-slate-50/[0.07] p-[2.5vmin] text-[length:var(--name)]',
                  rise && 'animate-pop'
                )}
                style={riseAt(i + 1)}
              >
                <span
                  className={cx(
                    'font-display grid h-[1.6em] max-w-[4.5em] min-w-[1.6em] shrink-0 place-items-center truncate rounded-[var(--radius-pill)] px-[0.35em] text-[0.7em]',
                    courtTone(courtOrder.get(m.courtId) ?? 0)
                  )}
                  aria-hidden
                >
                  {m.courtName}
                </span>
                <span className="sr-only">
                  {t('v4MatchCtx', { n: now.number, court: m.courtName })}
                </span>
                <span
                  className={cx(
                    'flex min-w-0 flex-1 gap-x-[0.6em] gap-y-[0.1em]',
                    one ? 'flex-col' : 'landscape:items-center portrait:flex-col'
                  )}
                >
                  {side(m.teamA, true, m.done)}
                  <span className="shrink-0 text-[0.55em] text-slate-400">{t('vs')}</span>
                  {side(m.teamB, false, m.done)}
                </span>
                {onMatchDone && (
                  <button
                    type="button"
                    onClick={() => onMatchDone(now.round, m.id)}
                    aria-pressed={m.done}
                    aria-label={t(m.done ? 'v4ReopenCourt' : 'v4FinishCourt', {
                      court: m.courtName,
                    })}
                    className={cx(
                      'press grid size-[clamp(2.75rem,min(12dvh,12vw),5rem)] shrink-0 place-items-center rounded-full text-[clamp(0.875rem,min(3.4dvh,4vw),1.5rem)] font-bold',
                      'focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:outline-none',
                      m.done
                        ? 'bg-accent-500 text-on-accent'
                        : 'border-2 border-accent-400 text-accent-300 hover:bg-accent-400/15'
                    )}
                  >
                    {m.done ? (
                      <svg
                        viewBox="0 0 20 20"
                        className="size-1/2"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        aria-hidden
                      >
                        <path
                          d="m5 10.5 3.5 3.5L15 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      t('finishShort')
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div
            key={roundKey}
            className={cx(
              'flex min-h-0 flex-1 flex-col items-center justify-center text-center text-accent-300',
              rise && 'animate-pop'
            )}
            style={riseAt(1)}
            aria-hidden
          >
            <p className="num text-[clamp(4rem,min(32dvh,20vw),18rem)]">✓</p>
            <p className="font-display text-[clamp(1.5rem,min(10dvh,6vw),6rem)] leading-[1.3]">
              {t('v4AllDone')}
            </p>
          </div>
        )}
      </div>

      {/* next round and who sits out */}
      {(next || benched.length > 0) && (
        <div className="flex shrink-0 gap-x-[4vmin] gap-y-[1vmin] border-t border-slate-50/10 pt-[2vmin] text-[clamp(0.8rem,min(4.2dvh,2.2vw),1.75rem)] portrait:flex-col portrait:text-[clamp(0.8rem,min(2.1dvh,4.2vw),1.5rem)]">
          {next && (
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-accent-300">
                {t('v4NextRoundN', { n: next.number })}
              </p>
              <ul className="flex min-w-0 gap-x-[3vmin] landscape:flex-row portrait:flex-col">
                {next.round.matches.map((m) => (
                  <li key={m.id} className="flex min-w-0 items-center gap-[0.4em]">
                    <span
                      className={cx(
                        'font-display grid h-[1.4em] min-w-[1.4em] max-w-[4em] shrink-0 place-items-center truncate rounded-[var(--radius-pill)] px-[0.3em] text-[0.75em]',
                        courtTone(courtOrder.get(m.courtId) ?? 0)
                      )}
                      aria-hidden
                    >
                      {m.courtName}
                    </span>
                    <span className="truncate text-slate-100">
                      {team(m.teamA)} <span className="text-slate-400">{t('vs')}</span>{' '}
                      {team(m.teamB)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {benched.length > 0 && (
            <p className="min-w-0 text-slate-300 landscape:max-w-[34%]">
              <span className="font-semibold">{t('bench')}</span>{' '}
              <span className="text-slate-100">{benched.join(', ')}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
