import { useEffect, useState } from 'react'
import { buildRoomUrl } from '../lib/room'
import { buildShareUrl } from '../lib/share'
import { Button, Sheet, cx } from './ui'

/** Chat apps start mangling links well before the browser cares. */
const LONG_LINK = 2500

/**
 * `room` is this device's live room, if it runs one; `onOpenRoom` and
 * `onCloseRoom` start and end it (see App.jsx). The other two modes are the
 * snapshot links, which need no server at all.
 */
export default function ShareSheet({
  open,
  onClose,
  state,
  t,
  setToast,
  room = null,
  roomStatus = null,
  onOpenRoom,
  onCloseRoom,
}) {
  const [mode, setMode] = useState(room ? 'live' : 'view')
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [opening, setOpening] = useState(false)
  const live = mode === 'live'

  useEffect(() => {
    if (!open) return
    setCopied(false)
    if (live) {
      setUrl(room ? buildRoomUrl(room.id) : '')
      return
    }
    let alive = true
    buildShareUrl(state, mode)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(''))
    return () => {
      alive = false
    }
  }, [open, mode, live, room, state])

  if (!open) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setToast?.(t('copyFailed'), 'error')
    }
  }

  const openRoom = async () => {
    setOpening(true)
    try {
      await onOpenRoom()
    } catch {
      setToast?.(t('roomFailed'), 'error')
    } finally {
      setOpening(false)
    }
  }

  const nativeShare = async () => {
    try {
      await navigator.share({ title: t('imageTitle'), url })
    } catch {
      /* dismissed — nothing to report */
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('shareTitle')}>
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-medium">{t('shareMode')}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              ['live', 'shareModeLive'],
              ['view', 'shareModeView'],
              ['edit', 'shareModeEdit'],
            ].map(([v, key]) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className={cx(
                  'rounded-xl border px-1.5 py-2.5 text-sm font-semibold transition',
                  mode === v
                    ? 'border-brand-500 bg-brand-50 text-brand-800 dark:bg-brand-900/40 dark:text-brand-100'
                    : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                )}
              >
                {t(key)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t(live ? 'roomHint' : mode === 'view' ? 'shareModeViewHint' : 'shareModeEditHint')}
          </p>
        </div>

        {live && !room ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={openRoom}
            disabled={opening || !onOpenRoom}
          >
            {opening ? t('roomOpening') : `🔴 ${t('roomOpen')}`}
          </Button>
        ) : (
          <>
            <div>
              <textarea
                readOnly
                value={url}
                rows={3}
                onFocus={(e) => e.target.select()}
                className="w-full resize-none rounded-xl border border-slate-300 bg-slate-100 p-2.5 font-mono text-[11px] break-all dark:border-slate-700 dark:bg-slate-950"
              />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                {live ? (
                  <RoomStatus status={roomStatus} t={t} />
                ) : (
                  <>
                    {url.length.toLocaleString()} {t('charsUnit')}
                    {url.length > LONG_LINK && ` · ${t('shareLinkLong')}`}
                  </>
                )}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="primary" className="flex-1" onClick={copy} disabled={!url}>
                {copied ? `✓ ${t('copied')}` : t('copyLink')}
              </Button>
              {typeof navigator.share === 'function' && (
                <Button onClick={nativeShare} disabled={!url}>
                  {t('shareVia')}
                </Button>
              )}
            </div>

            {live && (
              <Button variant="danger" size="sm" className="w-full" onClick={onCloseRoom}>
                {t('roomClose')}
              </Button>
            )}
          </>
        )}

        <p className="rounded-xl bg-slate-100 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          {t(live ? 'roomNote' : 'shareLinkNote')}
        </p>
      </div>
    </Sheet>
  )
}

/** A dot and a word: is the room keeping up with this device? */
export function RoomStatus({ status, t }) {
  const [dot, key] =
    status === 'error'
      ? ['bg-rose-500', 'roomError']
      : status === 'sending' || !status
        ? ['bg-amber-400', 'roomSending']
        : ['bg-emerald-500', 'roomSynced']
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cx('inline-block h-1.5 w-1.5 rounded-full', dot)} aria-hidden />
      {t(key)}
    </span>
  )
}
