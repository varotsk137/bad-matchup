import { useEffect, useState } from 'react'
import { buildShareUrl } from '../lib/share'
import { Button, Sheet, cx } from './ui'

/** Chat apps start mangling links well before the browser cares. */
const LONG_LINK = 2500

export default function ShareSheet({ open, onClose, state, t, setToast }) {
  const [mode, setMode] = useState('view')
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    let alive = true
    setCopied(false)
    buildShareUrl(state, mode)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(''))
    return () => {
      alive = false
    }
  }, [open, mode, state])

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
          <div className="grid grid-cols-2 gap-1.5">
            {[
              ['view', 'shareModeView'],
              ['edit', 'shareModeEdit'],
            ].map(([v, key]) => (
              <button
                key={v}
                onClick={() => setMode(v)}
                className={cx(
                  'rounded-xl border px-2 py-2.5 text-sm font-semibold transition',
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
            {t(mode === 'view' ? 'shareModeViewHint' : 'shareModeEditHint')}
          </p>
        </div>

        <div>
          <textarea
            readOnly
            value={url}
            rows={3}
            onFocus={(e) => e.target.select()}
            className="w-full resize-none rounded-xl border border-slate-300 bg-slate-100 p-2.5 font-mono text-[11px] break-all dark:border-slate-700 dark:bg-slate-950"
          />
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            {url.length.toLocaleString()} {t('charsUnit')}
            {url.length > LONG_LINK && ` · ${t('shareLinkLong')}`}
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

        <p className="rounded-xl bg-slate-100 p-3 text-xs leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
          {t('shareLinkNote')}
        </p>
      </div>
    </Sheet>
  )
}
