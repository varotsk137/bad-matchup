import { useRef, useState } from 'react'
import { loadPayment, savePayment, shrinkImage } from '../lib/payment'
import { parsePromptPayId } from '../lib/promptpay'
import { Button, Card, Input, SectionTitle } from './ui'

/**
 * Where the organiser gets paid: a PromptPay ID (the QR then carries the
 * amount too) and/or a QR image saved from a banking app. Kept on this device
 * under its own key, never in the app state that live rooms copy.
 */
export default function PaymentCard({ t, setToast }) {
  const [payment, setPayment] = useState(loadPayment)
  // complain about a half-typed number only once they have moved on
  const [touched, setTouched] = useState(false)
  const fileRef = useRef(null)

  const update = (patch) => {
    const next = { ...payment, ...patch }
    if (!savePayment(next)) {
      setToast(t('paySaveFailed'), 'error')
      return
    }
    setPayment(next)
  }

  const onPick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      update({ bankQr: await shrinkImage(file) })
    } catch {
      setToast(t('payImageFailed'), 'error')
    }
  }

  const idBad =
    touched && payment.promptpay.trim() !== '' && !parsePromptPayId(payment.promptpay)

  return (
    <div>
      <SectionTitle hint={t('payPrivate')}>{t('payTitle')}</SectionTitle>
      <Card className="space-y-4 p-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{t('payIdLabel')}</span>
          <Input
            inputMode="numeric"
            autoComplete="off"
            placeholder="08x-xxx-xxxx"
            value={payment.promptpay}
            onChange={(e) => update({ promptpay: e.target.value })}
            onBlur={() => setTouched(true)}
            aria-invalid={idBad}
            className="tabular-nums"
          />
          {idBad && (
            <span className="mt-1 block text-xs text-rose-600 dark:text-rose-400">
              {t('payIdBad')}
            </span>
          )}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{t('payNameLabel')}</span>
          <Input
            placeholder={t('payNamePh')}
            value={payment.name}
            maxLength={40}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>
        <div className="flex items-center gap-3">
          {payment.bankQr && (
            <img
              src={payment.bankQr}
              alt={t('payImage')}
              className="h-16 w-16 shrink-0 rounded-lg border border-slate-200 bg-white object-contain dark:border-slate-700"
            />
          )}
          <span className="min-w-0 flex-1 text-xs text-slate-500 dark:text-slate-400">
            {t('payImageLabel')}
          </span>
          {payment.bankQr ? (
            <Button size="sm" variant="ghost" onClick={() => update({ bankQr: '' })}>
              {t('payRemoveImage')}
            </Button>
          ) : (
            <Button size="sm" onClick={() => fileRef.current?.click()}>
              {t('payPickImage')}
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPick}
          />
        </div>
      </Card>
    </div>
  )
}
