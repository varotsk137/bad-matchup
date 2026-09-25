import { courtSize, isAvailable, totalCapacity } from '../lib/matchmaker'
import { Button, Card, Empty, Input, Segmented, cx } from './ui'

function CourtIcon({ type, on }) {
  return (
    <div
      className={cx(
        'relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border-2 transition',
        on
          ? 'border-brand-500/70 bg-brand-50 dark:bg-brand-900/30'
          : 'border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
      )}
    >
      <div
        className={cx('h-6 w-px', on ? 'bg-brand-500/70' : 'bg-slate-400 dark:bg-slate-600')}
      />
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="grid place-items-center text-[9px] font-bold text-slate-500 dark:text-slate-400">
          {type === 'singles' ? '1' : '2'}
        </div>
        <div className="grid place-items-center text-[9px] font-bold text-slate-500 dark:text-slate-400">
          {type === 'singles' ? '1' : '2'}
        </div>
      </div>
    </div>
  )
}

export default function CourtsTab({ state, t, actions }) {
  const enabled = state.courts.filter((c) => c.enabled !== false)
  const capacity = totalCapacity(state.courts)
  const ready = state.players.filter(isAvailable).length

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('capacity')}</p>
            <p className="text-2xl font-bold tabular-nums">
              {capacity}
              <span className="ml-1.5 text-sm font-normal text-slate-500 dark:text-slate-400">
                {t('playersUnit')} {t('perRound')}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {enabled.length} {t('courtLabel')} · {ready} {t('available')}
              {ready > capacity && (
                <span className="ml-1 text-amber-600 dark:text-amber-400">
                  (+{ready - capacity} {t('bench')})
                </span>
              )}
            </p>
          </div>
          <Button variant="primary" onClick={actions.addCourt}>
            + {t('addCourt')}
          </Button>
        </div>
      </Card>

      {state.courts.length === 0 ? (
        <Card>
          <Empty
            emoji="🏟️"
            title={t('noCourts')}
            action={
              <Button variant="primary" onClick={actions.addCourt}>
                + {t('addCourt')}
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {state.courts.map((c) => {
            const on = c.enabled !== false
            return (
              <Card key={c.id} className={cx('p-3.5', !on && 'opacity-60')}>
                <div className="flex items-center gap-3">
                  <CourtIcon type={c.type} on={on} />
                  <div className="min-w-0 flex-1">
                    <Input
                      value={c.name}
                      onChange={(e) => actions.updateCourt(c.id, { name: e.target.value })}
                      aria-label={t('courtName')}
                      className="h-9 font-semibold"
                    />
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {t(c.type === 'singles' ? 'singles' : 'doubles')} · {courtSize(c)}{' '}
                      {t('playersUnit')}
                    </p>
                  </div>
                  <button
                    onClick={() => actions.updateCourt(c.id, { enabled: !on })}
                    className={cx(
                      'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition active:scale-95',
                      on
                        ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    )}
                  >
                    {t(on ? 'courtOn' : 'courtOff')}
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Segmented
                    size="sm"
                    value={c.type}
                    onChange={(v) => actions.updateCourt(c.id, { type: v })}
                    options={[
                      { value: 'doubles', label: t('doubles') },
                      { value: 'singles', label: t('singles') },
                    ]}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => actions.removeCourt(c.id)}
                    aria-label={t('delete')}
                    className="shrink-0 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path
                        d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L15 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
