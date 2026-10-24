import { useState } from 'react'
import { loadOwnRoom } from '../lib/room'
import { clearHistory, forgetVisit, loadHistory, visitClosed } from '../lib/roomHistory'
import Icon from './Icon'
import { Sheet, askConfirm, cx } from './ui'

/**
 * Rooms this device has shared or watched, opened from the clock button in
 * the header. Tapping one opens it again through its link, exactly as if it
 * had been tapped in LINE; the room this device is sharing opens its share
 * sheet instead.
 */
export default function RoomHistorySheet({ open, onClose, t, lang, onOwnRoom }) {
  return (
    <Sheet open={open} onClose={onClose} title={t('historyTitle')}>
      {/* mounted only while open, so the list is read fresh every time */}
      {open && <HistoryList t={t} lang={lang} onClose={onClose} onOwnRoom={onOwnRoom} />}
    </Sheet>
  )
}

function HistoryList({ t, lang, onClose, onOwnRoom }) {
  const [list, setList] = useState(loadHistory)
  const ownId = loadOwnRoom()?.id

  const openVisit = (v) => {
    onClose()
    if (v.id === ownId) onOwnRoom?.()
    else location.hash = `room=${v.id}${v.key ? `&key=${v.key}` : ''}`
  }

  const when = (ms) =>
    new Date(ms).toLocaleString(lang === 'th' ? 'th-TH' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <div>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('historyHint')}</p>
        {list.length > 0 && (
          <button
            onClick={async () => {
              const ok = await askConfirm({
                message: t('historyClearConfirm'),
                confirmLabel: t('cfClearHistory'),
              })
              if (ok) setList(clearHistory())
            }}
            className="shrink-0 text-xs text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
          >
            {t('historyClear')}
          </button>
        )}
      </div>
      {list.length === 0 ? (
        <p className="rounded-xl bg-slate-100 px-3 py-4 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {t('historyEmpty')}
        </p>
      ) : (
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {list.map((v) => {
            const sharing = v.id === ownId
            const closed = visitClosed(v)
            const extra = v.players - v.names.length
            const title = v.names.length
              ? `${v.names.join(', ')}${extra > 0 ? ` +${extra}` : ''}`
              : t('historyUnnamed', { id: v.id.slice(0, 6) })
            return (
              <div key={v.id} className="flex items-center gap-2 py-2.5">
                <button onClick={() => openVisit(v)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">{title}</span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">{when(v.lastAt)}</span>
                    {v.rounds > 0 && <span>· {t('historyRounds', { n: v.rounds })}</span>}
                    <Chip>{t(`historyRole_${v.role}`)}</Chip>
                    <Chip tone={sharing ? 'live' : closed ? 'off' : 'on'}>
                      {t(sharing ? 'historySharing' : closed ? 'historyClosed' : 'historyOpen')}
                    </Chip>
                  </span>
                </button>
                <button
                  onClick={() => setList(forgetVisit(v.id))}
                  aria-label={t('historyRemove')}
                  title={t('historyRemove')}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <Icon name="close" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Chip({ tone, children }) {
  return (
    <span
      className={cx(
        'rounded-full px-1.5 py-px text-[11px] font-semibold',
        tone === 'on' && 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200',
        tone === 'live' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
        tone === 'off' &&
          'bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
        !tone && 'border border-edge text-slate-600 dark:text-slate-300'
      )}
    >
      {children}
    </span>
  )
}
