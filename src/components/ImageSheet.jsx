import { useEffect, useState } from 'react'
import { canSharePng, downloadPng, sharePng } from '../lib/exportImage'
import { Button, Sheet } from './ui'

/**
 * Shows the rendered schedule before anything happens to it. The <img> is a
 * real image, so on a phone a long-press gives the browser's own
 * "Save to Photos" / "Download image" — the one route that reaches the gallery
 * on every phone. The buttons cover a file download and the share sheet.
 */
export default function ImageSheet({ png, onClose, t, setToast }) {
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (!png) return
    const u = URL.createObjectURL(png.blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [png])

  if (!png) return null

  const share = async () => {
    try {
      await sharePng(png)
    } catch {
      setToast?.(t('exportFailed'), 'error')
    }
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('imageReady')}
      footer={
        <div className="flex gap-2">
          <Button
            variant="primary"
            className="h-11 flex-1"
            onClick={() => {
              downloadPng(png)
              setToast?.(t('exportDone'))
            }}
          >
            {t('saveToDevice')}
          </Button>
          {canSharePng(png) && (
            <Button className="h-11 flex-1" onClick={share}>
              {t('shareImage')}
            </Button>
          )}
        </div>
      }
    >
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{t('longPressHint')}</p>
      {url && (
        <img
          src={url}
          alt={t('imageTitle')}
          className="w-full rounded-xl border border-slate-200 dark:border-slate-800"
        />
      )}
    </Sheet>
  )
}
