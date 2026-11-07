import { useRef, useState } from 'react'
import { isAvailable, totalCapacity } from '../lib/matchmaker'
import { MAX_COURT_NAME, cleanName, clipName } from '../lib/names'
import Icon from './Icon'
import { Button, Card, Empty, Input, ScreenTitle, Segmented, StatTile, Toggle, courtTone, cx } from './ui'

/*
 * A badminton court from above, 13.4 × 6.1 m drawn 1 unit = 10 cm, on the
 * court's own colour with its lines in currentColor. The dots are the players
 * it holds: two a side for doubles, and when it turns singles one of each pair
 * slides into the middle and fades, while the doubles alleys dim.
 */
const SIDE = [
  // [doubles position, singles position] for each of the four players
  [[33.5, 17], [33.5, 30.5]],
  [[33.5, 44], [33.5, 30.5]],
  [[100.5, 17], [100.5, 30.5]],
  [[100.5, 44], [100.5, 30.5]],
]

function CourtDrawing({ type, on, tone }) {
  const singles = type === 'singles'
  const line = { vectorEffect: 'non-scaling-stroke' }
  const move = 'transition-[transform,opacity] duration-300 ease-snap motion-reduce:transition-none'
  return (
    <div
      className={cx(
        'overflow-hidden rounded-xl transition-colors duration-300',
        on ? tone : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
      )}
    >
      <svg viewBox="-6 -6 146 73" className="block h-auto w-full" aria-hidden>
        {/* the doubles alleys go quiet in singles */}
        <g className={cx('transition-opacity duration-300', singles ? 'opacity-100' : 'opacity-0')}>
          <rect x="0" y="0" width="134" height="4.6" fill="currentColor" opacity="0.18" />
          <rect x="0" y="56.4" width="134" height="4.6" fill="currentColor" opacity="0.18" />
        </g>
        <g fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.9">
          <rect x="0" y="0" width="134" height="61" style={line} />
          <path d="M0 4.6H134M0 56.4H134" style={line} />
          <path d="M7.6 0V61M126.4 0V61" style={line} />
          <path d="M47.2 0V61M86.8 0V61" style={line} />
          <path d="M0 30.5H47.2M86.8 30.5H134" style={line} />
        </g>
        {/* the net and its posts */}
        <path d="M67 -3V64" stroke="currentColor" strokeWidth="3" style={line} />
        <circle cx="67" cy="-3" r="1.8" fill="currentColor" />
        <circle cx="67" cy="64" r="1.8" fill="currentColor" />
        {on &&
          SIDE.map(([d, s], i) => {
            const [x, y] = singles ? s : d
            const ghost = singles && i % 2 === 1
            return (
              <circle
                key={i}
                cx="0"
                cy="0"
                r="4.2"
                fill="currentColor"
                className={move}
                style={{ transform: `translate(${x}px, ${y}px)`, opacity: ghost ? 0 : 1 }}
              />
            )
          })}
      </svg>
    </div>
  )
}

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function CourtsTab({ state, t, actions }) {
  const capacity = totalCapacity(state.courts)
  const ready = state.players.filter(isAvailable).length
  const bench = Math.max(0, ready - capacity)

  // courts here when the screen opened stay still; a new one rises in, a removed one sinks out
  const firstIds = useRef(null)
  if (!firstIds.current) firstIds.current = new Set(state.courts.map((c) => c.id))
  const [leaving, setLeaving] = useState(null)
  const remove = (id) => {
    if (leaving) return
    if (reduceMotion()) return actions.removeCourt(id)
    setLeaving(id)
    setTimeout(() => {
      actions.removeCourt(id)
      setLeaving(null)
    }, 180)
  }

  const addButton = (
    <Button variant="accent" onClick={actions.addCourt}>
      + {t('addCourt')}
    </Button>
  )

  return (
    <div>
      <ScreenTitle
        title={t('tabCourts')}
      />

      <Card tone="ink" className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="num text-5xl text-accent-300">{capacity}</div>
            <div className="mt-1.5 text-xs font-medium text-slate-300">{t('v4OnCourt')}</div>
          </div>
          {addButton}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-50/15 pt-4">
          <StatTile ink value={ready} label={t('available')} />
          <StatTile
            ink
            value={<span className={cx(bench > 0 && 'text-amber-300')}>{bench}</span>}
            label={t('bench')}
          />
        </div>
      </Card>

      {state.courts.length === 0 ? (
        <Card className="mt-6">
          <Empty
            icon="court"
            title={t('noCourts')}
            action={
              <Button variant="primary" onClick={actions.addCourt}>
                + {t('addCourt')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {state.courts.map((c, i) => {
            const on = c.enabled !== false
            const blank = !cleanName(c.name)
            const label = cleanName(c.name) || String(i + 1)
            return (
              <Card
                key={c.id}
                className={cx(
                  'p-3 transition-[transform,opacity] duration-200 ease-snap',
                  !firstIds.current.has(c.id) && 'animate-pop',
                  leaving === c.id && 'scale-95 opacity-0'
                )}
              >
                <CourtDrawing type={c.type} on={on} tone={courtTone(i)} />

                <div className="mt-3 flex items-start gap-3 px-1">
                  <div className="min-w-0 flex-1">
                    <Input
                      value={c.name}
                      onChange={(e) =>
                        actions.updateCourt(c.id, {
                          name: clipName(e.target.value, MAX_COURT_NAME),
                        })
                      }
                      // a court is never left nameless: an emptied field goes back to its number
                      onBlur={() =>
                        actions.updateCourt(c.id, { name: cleanName(c.name) || String(i + 1) })
                      }
                      aria-label={t('v4CourtNameN', { n: i + 1 })}
                      aria-invalid={blank}
                      className={cx('font-display', blank && 'border-rose-400')}
                    />
                    {blank && (
                      <p className="mt-1 text-xs text-rose-700 dark:text-rose-300" role="alert">
                        {t('courtNameEmpty', { n: i + 1 })}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 -mt-1">
                    <Toggle
                      checked={on}
                      onChange={(v) => actions.updateCourt(c.id, { enabled: v })}
                      label={t('courtOn')}
                    />
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2 px-1 pb-1">
                  <Segmented
                    className="min-w-0 flex-1"
                    value={c.type}
                    onChange={(v) => actions.updateCourt(c.id, { type: v })}
                    options={[
                      { value: 'doubles', label: t('doubles') },
                      { value: 'singles', label: t('singles') },
                    ]}
                  />
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    aria-label={t('v4DeleteCourt', { name: label })}
                    title={t('delete')}
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-rose-700 transition hover:bg-rose-50 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:text-rose-300 dark:hover:bg-rose-950/50 dark:focus-visible:outline-brand-300"
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
