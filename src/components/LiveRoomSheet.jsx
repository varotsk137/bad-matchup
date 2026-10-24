import { useState } from 'react'
import { buildRoomUrl } from '../lib/room'
import Icon, { LiveDot } from './Icon'
import { Button, Sheet, askConfirm, cx } from './ui'

/**
 * Everything about this device's live room in one place: open it, hand out
 * the two kinds of link, decide whether anyone may tick and score, close it.
 *
 * `room` is { id, openedAt, key? } (see App.jsx); `onSetScoring(true)` issues
 * a fresh edit key — also how a leaked link is replaced — and
 * `onSetScoring(false)` withdraws it.
 */
export default function LiveRoomSheet({
  open,
  onClose,
  t,
  lang,
  setToast,
  room = null,
  roomStatus = null,
  onOpenRoom,
  onCloseRoom,
  onSetScoring,
}) {
  const [busy, setBusy] = useState(null) // 'open' | 'scoring' | null

  if (!open) return null

  const run = async (what, fn) => {
    setBusy(what)
    try {
      await fn()
    } catch {
      setToast?.(t('roomFailed'), 'error')
    } finally {
      setBusy(null)
    }
  }

  const time = (ms) =>
    new Date(ms).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={
        <span className="inline-flex items-center gap-2">
          <LiveDot />
          {t('liveTitle')}
        </span>
      }
    >
      {!room ? (
        <div className="space-y-4">
          <ul className="space-y-2 text-sm leading-relaxed">
            {['liveIntro1', 'liveIntro2', 'liveIntro3'].map((k) => (
              <li key={k}>{t(k)}</li>
            ))}
          </ul>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => run('open', onOpenRoom)}
            disabled={busy === 'open'}
          >
            {busy === 'open' ? (
              t('roomOpening')
            ) : (
              <>
                <LiveDot />
                {t('roomOpen')}
              </>
            )}
          </Button>
          <Note>{t('roomNote')}</Note>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="flex flex-wrap items-center gap-x-2 text-sm">
            <RoomStatus status={roomStatus} t={t} />
            {room.openedAt && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                · {t('roomOpenedAt', { time: time(room.openedAt) })}
              </span>
            )}
          </p>

          <div>
            <p className="mb-2 text-sm font-medium">{t('roomWho')}</p>
            <div className="space-y-2.5">
              <LinkCard
                icon="eye"
                title={t('roomWatchTitle')}
                hint={t('roomWatchHint')}
                url={buildRoomUrl(room.id)}
                t={t}
                setToast={setToast}
              />

              <LinkCard
                icon="pencil"
                title={t('roomScoreTitle')}
                hint={t('roomScoreHint')}
                url={room.key ? buildRoomUrl(room.id, room.key) : null}
                t={t}
                setToast={setToast}
                toggle={{
                  on: Boolean(room.key),
                  busy: busy === 'scoring',
                  onChange: (on) => run('scoring', () => onSetScoring(on)),
                }}
                offHint={t('roomScoreOff')}
                extra={
                  room.key && (
                    <button
                      onClick={async () => {
                        const ok = await askConfirm({
                          message: t('roomNewKeyConfirm'),
                          confirmLabel: t('cfNewKey'),
                        })
                        if (ok) run('scoring', () => onSetScoring(true))
                      }}
                      disabled={busy === 'scoring'}
                      className="text-xs font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Icon name="refresh" className="h-3.5 w-3.5" />
                        {t('roomNewKey')}
                      </span>
                    </button>
                  )
                }
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
            <Button variant="danger" className="w-full" onClick={onCloseRoom}>
              {t('roomClose')}
            </Button>
            <p className="mt-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
              {t('roomCloseHint')}
            </p>
          </div>

          <Note>{t('liveIntro3')}</Note>
        </div>
      )}
    </Sheet>
  )
}

/* ------------------------------------------------------------- pieces */

function Note({ children }) {
  return (
    <p className="rounded-xl bg-slate-100 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
      {children}
    </p>
  )
}

/**
 * One kind of access: what it lets people do, and its link to copy or share.
 * With `toggle`, the access can be switched off (and then has no link).
 */
function LinkCard({ icon, title, hint, url, t, setToast, toggle = null, offHint, extra }) {
  const [copied, setCopied] = useState(false)
  const on = toggle ? toggle.on : true

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setToast?.(t('copyFailed'), 'error')
    }
  }

  const share = async () => {
    try {
      await navigator.share({ title, url })
    } catch {
      /* dismissed */
    }
  }

  return (
    <div
      className={cx(
        'rounded-2xl border-(length:--line-w) p-3 transition',
        on
          ? 'border-brand-500/60 bg-brand-50/60 dark:bg-brand-900/20'
          : 'border-edge bg-slate-50 dark:bg-slate-900'
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {hint}
          </p>
          {!on && offHint && (
            <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
              {offHint}
            </p>
          )}
        </div>
        {toggle && (
          <button
            type="button"
            role="switch"
            aria-checked={toggle.on}
            aria-label={t('roomScoreAllow')}
            disabled={toggle.busy}
            onClick={() => toggle.onChange(!toggle.on)}
            className={cx(
              'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60',
              toggle.on ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
            )}
          >
            <span
              className={cx(
                'absolute top-0.5 h-5 w-5 rounded-full bg-slate-50 shadow transition-all',
                toggle.on ? 'left-[22px]' : 'left-0.5'
              )}
            />
          </button>
        )}
      </div>

      {on && url && (
        <div className="mt-3 space-y-2">
          <p className="truncate rounded-lg bg-white/70 px-2 py-1.5 font-mono text-[11px] text-slate-500 dark:bg-slate-950/60 dark:text-slate-400">
            {url}
          </p>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" className="flex-1" onClick={copy}>
              {copied ? (
                `✓ ${t('copied')}`
              ) : (
                <>
                  <Icon name="copy" />
                  {t('copyLink')}
                </>
              )}
            </Button>
            {typeof navigator.share === 'function' && (
              <Button size="sm" onClick={share}>
                {t('shareVia')}
              </Button>
            )}
          </div>
          {extra && <div className="text-center">{extra}</div>}
        </div>
      )}
    </div>
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
