import { useEffect, useState, useSyncExternalStore } from 'react'
import {
  inLine,
  installKind,
  openInBrowser,
  promptInstall,
  pwaStore,
  readFlag,
  setFlag,
} from '../lib/pwa'
import { exportState } from '../lib/storage'
import Icon from './Icon'
import { Button, Card, Sheet, cx } from './ui'

/** How long the install invite stays up. */
export const INVITE_MS = 4000

/**
 * What "install" does on this device, and the how-to sheet for the devices
 * where the browser cannot do it for us.
 */
export function useInstall() {
  const pwa = useSyncExternalStore(pwaStore.subscribe, pwaStore.getState)
  const [sheet, setSheet] = useState(false)
  const kind = installKind(pwa)
  const install = () => (kind === 'prompt' ? promptInstall() : setSheet(true))
  return { kind, install, sheet, closeSheet: () => setSheet(false) }
}

/* ---------------------------------------------------------- under the header */

/**
 * Slim one-line bars under the header: matchmaking-only mode after a launch
 * with no internet, and the nudge out of LINE's in-app browser.
 */
export function TopBars({ t, offline, retrying, onRetry }) {
  const [lineBar, setLineBar] = useState(() => inLine() && !readFlag('lineDismissed'))

  if (offline)
    return (
      <div className="border-b border-accent-200 bg-accent-50 text-accent-900 dark:border-accent-900 dark:bg-accent-950/40 dark:text-accent-100">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate">{t('netOffline')}</span>
          <button
            onClick={onRetry}
            disabled={retrying}
            className="shrink-0 font-semibold underline underline-offset-2 disabled:no-underline disabled:opacity-60"
          >
            {t(retrying ? 'netRetrying' : 'netRetry')}
          </button>
        </div>
      </div>
    )

  if (!lineBar) return null
  return (
    <div className="border-b border-edge bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
      <div className="mx-auto flex max-w-3xl items-center gap-2 py-1 pr-1 pl-4 text-xs">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#06c755]" aria-hidden />
        <span className="min-w-0 flex-1 truncate">{t('lineBar')}</span>
        <button
          onClick={() => openInBrowser()}
          className="shrink-0 px-1 font-bold text-brand-700 dark:text-brand-300"
        >
          {t('lineOpen')}
        </button>
        <button
          onClick={() => {
            setFlag('lineDismissed')
            setLineBar(false)
          }}
          aria-label={t('close')}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ------------------------------------------------------- the install invite */

/**
 * One line just above the bottom tabs, shown once per device for a few
 * seconds; a thin line runs out while it is up. Gone afterwards whether it
 * was tapped or not.
 */
export function InstallInvite({ t, onInstall, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, INVITE_MS)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] z-40 px-3 md:bottom-6">
      <button
        onClick={() => {
          onDone()
          onInstall()
        }}
        className="animate-pop pointer-events-auto relative mx-auto flex w-full max-w-md items-center gap-2 overflow-hidden rounded-xl border-(length:--line-w) border-edge bg-slate-50 py-1.5 pr-1.5 pl-3 text-left text-sm shadow-[var(--shadow-card)] dark:bg-slate-900"
      >
        <Icon name="phone" className="h-5 w-5 text-brand-600 dark:text-brand-300" />
        <span className="min-w-0 flex-1 truncate">{t('installInvite')}</span>
        <span className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-bold text-white">
          {t('installButton')}
        </span>
        <span
          className="invite-countdown absolute inset-x-0 bottom-0 h-0.5 bg-brand-600"
          aria-hidden
        />
      </button>
    </div>
  )
}

/* -------------------------------------------------------- the how-to sheet */

export function InstallSheet({ open, onClose, kind, t, state }) {
  return (
    <Sheet open={open} onClose={onClose} title={t('installTitle')}>
      {kind === 'ios' ? (
        <div className="space-y-4">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li>{t('installIosStep1')}</li>
            <li>{t('installIosStep2')}</li>
            <li>{t('installIosStep3')}</li>
          </ol>
          <div className="space-y-3 rounded-xl bg-slate-100 p-3 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            <p>{t('installIosData')}</p>
            <Button size="sm" className="w-full" onClick={() => exportState(state)}>
              ⬇ {t('exportData')}
            </Button>
          </div>
        </div>
      ) : kind === 'line' ? (
        <div className="space-y-4">
          <p className="text-sm">{t('installLine')}</p>
          <Button variant="primary" className="w-full" onClick={() => openInBrowser()}>
            {t('installOpenBrowser')}
          </Button>
        </div>
      ) : (
        <p className="text-sm">{t(kind === 'installed' ? 'installDone' : 'installManual')}</p>
      )}
    </Sheet>
  )
}

/* ------------------------------------------------------------ Settings row */

/** "Install as an app" in Settings — there for good, unlike the invite. */
export function InstallRow({ t, state }) {
  const { kind, install, sheet, closeSheet } = useInstall()
  const installed = kind === 'installed'
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{t('installTitle')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t(installed ? 'installDone' : 'installHint')}
        </p>
      </div>
      {!installed && (
        <Button size="sm" onClick={install}>
          {t('installButton')}
        </Button>
      )}
      <InstallSheet open={sheet} onClose={closeSheet} kind={kind} t={t} state={state} />
    </Card>
  )
}

/* ------------------------------------------------------------ new version */

/** Stays until tapped: reloading is the user's call, never mid-game on its own. */
export function UpdateToast({ t, onReload }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-60 flex justify-center px-4 sm:bottom-8">
      <div
        className={cx(
          'animate-pop pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl py-1.5 pr-1.5 pl-4',
          'bg-slate-900 text-sm font-medium text-white shadow-lg dark:bg-slate-700'
        )}
      >
        <span className="min-w-0 flex-1">{t('updateReady')}</span>
        <button
          onClick={onReload}
          className="h-9 shrink-0 rounded-lg px-3 font-bold text-accent-300 transition hover:bg-white/10 active:scale-95"
        >
          {t('updateReload')}
        </button>
      </div>
    </div>
  )
}
