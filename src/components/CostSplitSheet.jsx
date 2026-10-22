import { useMemo, useState } from 'react'
import {
  loadPaid,
  loadPayment,
  loadSplitView,
  savePaid,
  savePayment,
  saveSplitView,
} from '../lib/payment'
import { formatPromptPayId, parsePromptPayId, promptPayPayload } from '../lib/promptpay'
import { exactShare, formatBaht, splitBill, toAmount, toSatang } from '../lib/split'
import { renderBillPng } from '../lib/splitImage'
import ImageSheet from './ImageSheet'
import QrCode from './QrCode'
import { Button, Input, Segmented, Sheet, cx } from './ui'

const ROUNDINGS = [
  ['cents', 'roundCents'],
  ['baht', 'roundBaht'],
  ['five', 'roundFive'],
]

/**
 * Who shares the bill: everyone still in the session, plus anyone who played
 * a match and has since gone home — leaving early does not get you off.
 */
function sessionPlayers(state) {
  const played = new Set()
  for (const r of state.rounds)
    for (const m of r.matches) for (const id of [...m.teamA, ...m.teamB]) if (id) played.add(id)
  return state.players.filter((p) => played.has(p.id) || (p.active !== false && !p.deleted))
}

/**
 * Splits tonight's court and shuttle bill equally and collects it. Mounted
 * fresh each time it opens, so the prices always start blank.
 */
export default function CostSplitSheet({ state, t, setToast, goTo, onClose }) {
  const courts = useMemo(() => state.courts.filter((c) => c.enabled !== false), [state.courts])
  const people = useMemo(() => sessionPlayers(state), [state])
  const [costs, setCosts] = useState(() => courts.map(() => ({ price: '', hours: '' })))
  const [shuttlePrice, setShuttlePrice] = useState('')
  const [shuttles, setShuttles] = useState(0)
  const [rounding, setRounding] = useState('cents')
  const [step, setStep] = useState('costs')
  const [view, setView] = useState(loadSplitView)
  const [qrOpen, setQrOpen] = useState(false)
  const [payment, setPayment] = useState(loadPayment)
  const session = state.rounds[0]?.id || ''
  const [paid, setPaid] = useState(() => loadPaid(session))
  const [png, setPng] = useState(null)
  const [busy, setBusy] = useState(false)

  const bill = splitBill({
    courts: costs,
    shuttlePrice,
    shuttles,
    people: people.length,
    rounding,
  })
  // two places while the satang matter; whole numbers once rounded to baht
  const money = (satang) => formatBaht(satang, rounding === 'cents' ? 2 : 0)
  const amount = money(bill.each)

  // ---- getting paid ------------------------------------------------------
  const promptpayId = parsePromptPayId(payment.promptpay) ? payment.promptpay : ''
  const methods = [promptpayId && 'promptpay', payment.bankQr && 'image'].filter(Boolean)
  const method = methods.includes(payment.method) ? payment.method : methods[0] || null
  const pickMethod = (m) => {
    const next = { ...payment, method: m }
    savePayment(next)
    setPayment(next)
  }
  const payload = method === 'promptpay' ? promptPayPayload(promptpayId, bill.each) : ''

  const pickView = (v) => {
    setView(v)
    saveSplitView(v)
    setQrOpen(false)
  }

  const togglePaid = (id) => {
    const next = new Set(paid)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    savePaid(session, next)
    setPaid(next)
  }
  const paidCount = people.filter((p) => paid.has(p.id)).length

  const toSettings = () => {
    onClose()
    goTo('settings')
  }

  const working = [
    t('splitTotalOver', { total: formatBaht(bill.total), n: people.length }),
    bill.surplus > 0 && t('splitSurplus', { amount: money(bill.surplus) }),
  ]
    .filter(Boolean)
    .join(' · ')

  const onImage = async () => {
    setBusy(true)
    try {
      const rows = courts
        .map((c, i) => ({ c, cost: bill.courtCosts[i], ...costs[i] }))
        .filter((x) => x.cost > 0)
        .map((x) => ({
          label: `${t('courtLabel')} ${x.c.name} · ${formatBaht(toSatang(x.price))} × ${toAmount(x.hours)} ${t('hoursUnit')}`,
          value: formatBaht(x.cost),
        }))
      if (bill.shuttleCost > 0)
        rows.push({
          label: t('splitShuttlesLine', {
            n: shuttles,
            price: formatBaht(toSatang(shuttlePrice)),
          }),
          value: formatBaht(bill.shuttleCost),
        })
      const headline = t('splitEachAmount', { amount })
      setPng(
        await renderBillPng({
          title: t('splitImageTitle'),
          subtitle: new Date().toLocaleDateString(state.lang === 'en' ? 'en-GB' : 'th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          rows,
          total: {
            label: t('splitTotal'),
            value: `${formatBaht(bill.total)} ${t('bahtUnit')}`,
          },
          headline,
          working,
          people:
            view === 'each'
              ? people.map((p) => ({ name: p.name, paid: paid.has(p.id) }))
              : null,
          amount,
          paidLabel: t('paid'),
          pay:
            method === 'promptpay'
              ? {
                  qr: payload,
                  lines: [
                    t('qrPromptPayLine', { id: formatPromptPayId(promptpayId) }),
                    payment.name,
                    t('qrScanHint', { amount }),
                  ],
                }
              : method === 'image'
                ? {
                    imageSrc: payment.bankQr,
                    lines: [headline, payment.name, t('qrTypeAmount')],
                  }
                : null,
          footer: t('appName'),
        })
      )
    } catch {
      setToast(t('exportFailed'), 'error')
    } finally {
      setBusy(false)
    }
  }

  if (png)
    return (
      <ImageSheet
        png={png}
        onClose={() => setPng(null)}
        t={t}
        setToast={setToast}
        title={t('splitImageReady')}
      />
    )

  const payCard = (
    <div className="space-y-3 text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400">{working}</p>
      <p className="font-display text-3xl font-bold tabular-nums">
        {t('splitEachAmount', { amount })}
      </p>
      {method === 'promptpay' && (
        <>
          <QrCode text={payload} label={t('payPromptPay')} className="mx-auto w-56" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('qrScanHint', { amount })}
            <br />
            {[t('qrPromptPayLine', { id: formatPromptPayId(promptpayId) }), payment.name]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </>
      )}
      {method === 'image' && (
        <>
          <img
            src={payment.bankQr}
            alt={t('payImage')}
            className="mx-auto max-h-64 w-56 rounded-lg bg-white object-contain"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {[payment.name, t('qrTypeAmount')].filter(Boolean).join(' · ')}
          </p>
        </>
      )}
      {!method && (
        <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <p>{t('qrNotSet')}</p>
          <Button size="sm" variant="primary" className="mt-2" onClick={toSettings}>
            {t('qrSetUp')}
          </Button>
        </div>
      )}
      {methods.length > 1 && (
        <div className="text-left">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            {t('payVia')}
          </span>
          <Segmented
            size="sm"
            value={method}
            onChange={pickMethod}
            options={[
              { value: 'promptpay', label: t('payPromptPay') },
              { value: 'image', label: t('payImage') },
            ]}
          />
        </div>
      )}
    </div>
  )

  // ---------------------------------------------------------------- costs
  if (step === 'costs')
    return (
      <Sheet
        open
        onClose={onClose}
        title={t('splitTitle')}
        footer={
          <Button
            variant="primary"
            className="w-full"
            disabled={bill.each === 0}
            onClick={() => setStep('result')}
          >
            {t('splitSeeResult')}
          </Button>
        }
      >
        <div className="space-y-5">
          <section>
            <h4 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('splitCourts')}
            </h4>
            <div className="space-y-2">
              {courts.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {t('courtLabel')} {c.name}
                  </span>
                  <MoneyInput
                    className="w-24"
                    placeholder={t('splitPricePh')}
                    aria-label={`${t('courtLabel')} ${c.name} ${t('splitPricePh')}`}
                    value={costs[i].price}
                    onChange={(v) =>
                      setCosts((all) => all.map((x, j) => (j === i ? { ...x, price: v } : x)))
                    }
                  />
                  <span className="text-xs text-slate-400">×</span>
                  <MoneyInput
                    className="w-16"
                    placeholder={t('splitHoursPh')}
                    aria-label={`${t('courtLabel')} ${c.name} ${t('splitHoursPh')}`}
                    value={costs[i].hours}
                    onChange={(v) =>
                      setCosts((all) => all.map((x, j) => (j === i ? { ...x, hours: v } : x)))
                    }
                  />
                </div>
              ))}
            </div>
            {bill.courtTotal > 0 && (
              <Working>
                {bill.courtCosts.filter((x) => x > 0).length > 1
                  ? t('splitSum', {
                      parts: bill.courtCosts
                        .filter((x) => x > 0)
                        .map((x) => formatBaht(x))
                        .join(' + '),
                      total: formatBaht(bill.courtTotal),
                    })
                  : `${formatBaht(bill.courtTotal)} ${t('bahtUnit')}`}
              </Working>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('splitShuttles')}
            </h4>
            <div className="flex items-center gap-2">
              <MoneyInput
                className="w-24"
                placeholder={t('splitPricePh')}
                aria-label={`${t('splitShuttles')} ${t('splitPricePh')}`}
                value={shuttlePrice}
                onChange={setShuttlePrice}
              />
              <span className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                {t('splitPerShuttle')}
              </span>
              <div className="flex h-10 items-center overflow-hidden rounded-xl border border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  aria-label="−"
                  onClick={() => setShuttles((n) => Math.max(0, n - 1))}
                  className="h-full w-10 text-lg font-bold text-slate-600 active:bg-slate-200 dark:text-slate-300 dark:active:bg-slate-800"
                >
                  −
                </button>
                <input
                  inputMode="numeric"
                  aria-label={t('splitShuttles')}
                  value={shuttles}
                  onChange={(e) =>
                    setShuttles(Math.min(999, Number(e.target.value.replace(/\D/g, '')) || 0))
                  }
                  className="h-full w-11 border-x border-slate-300 bg-transparent text-center text-base font-semibold tabular-nums focus:outline-none dark:border-slate-700"
                />
                <button
                  type="button"
                  aria-label="+"
                  onClick={() => setShuttles((n) => Math.min(999, n + 1))}
                  className="h-full w-10 text-lg font-bold text-slate-600 active:bg-slate-200 dark:text-slate-300 dark:active:bg-slate-800"
                >
                  +
                </button>
              </div>
            </div>
            {bill.shuttleCost > 0 && (
              <Working>
                {t('splitShuttleSum', { n: shuttles, cost: formatBaht(bill.shuttleCost) })}
              </Working>
            )}
          </section>

          <section>
            <h4 className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('splitRounding')}
            </h4>
            <Segmented
              size="sm"
              value={rounding}
              onChange={setRounding}
              options={ROUNDINGS.map(([value, key]) => ({ value, label: t(key) }))}
            />
            {bill.each > 0 && (
              <Working>
                {/* the rounded share is the number that matters — set it in bold */}
                {t('splitWorking', {
                  total: formatBaht(bill.total),
                  n: people.length,
                  exact: exactShare(bill.total, people.length),
                  each: '\u0000',
                })
                  .split('\u0000')
                  .flatMap((part, i) =>
                    i === 0
                      ? [part]
                      : [
                          <b key={i} className="text-slate-900 dark:text-slate-100">
                            {amount}
                          </b>,
                          part,
                        ]
                  )}
              </Working>
            )}
          </section>
        </div>
      </Sheet>
    )

  // --------------------------------------------------------------- result
  return (
    <Sheet
      open
      onClose={onClose}
      title={t('splitTitle')}
      footer={
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setStep('costs')}>
            {t('editCosts')}
          </Button>
          <Button className="flex-1" onClick={onImage} disabled={busy}>
            {busy ? t('exporting') : t('exportImage')}
          </Button>
          {view === 'each' && !qrOpen && (
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => (method ? setQrOpen(true) : toSettings())}
            >
              {t('showQr')}
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        <Segmented
          value={view}
          onChange={pickView}
          options={[
            { value: 'equal', label: t('splitEqual') },
            { value: 'each', label: t('splitEach') },
          ]}
        />

        {view === 'equal' || qrOpen ? (
          <>
            {payCard}
            {qrOpen && (
              <Button variant="ghost" className="w-full" onClick={() => setQrOpen(false)}>
                ← {t('backToList')}
              </Button>
            )}
          </>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-lg font-bold tabular-nums">
                {t('splitEachAmount', { amount })}
              </p>
              {bill.surplus > 0 && (
                <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                  {t('splitSurplus', { amount: money(bill.surplus) })}
                </span>
              )}
            </div>
            <div>
              <div className="mb-1 flex justify-between gap-3 text-xs text-slate-600 tabular-nums dark:text-slate-300">
                <span>
                  {t('splitCollected', {
                    a: money(bill.each * paidCount),
                    b: money(bill.collected),
                  })}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {t('splitPaidCount', { a: paidCount, b: people.length })}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-brand-600 transition-all"
                  style={{ width: `${(paidCount / Math.max(1, people.length)) * 100}%` }}
                />
              </div>
            </div>
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {people.map((p) => {
                const on = paid.has(p.id)
                return (
                  <li key={p.id} className="flex items-center gap-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {p.name}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{amount}</span>
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => togglePaid(p.id)}
                      className={cx(
                        'h-8 w-24 shrink-0 rounded-full text-xs font-semibold transition active:scale-95',
                        on
                          ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-200'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      )}
                    >
                      {on ? `✓ ${t('paid')}` : t('unpaid')}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  )
}

/** A short number box for prices and hours; blank means "not filled in". */
function MoneyInput({ className, onChange, ...rest }) {
  return (
    <div className={className}>
      <Input
        inputMode="decimal"
        autoComplete="off"
        className="h-10 px-2 text-right tabular-nums"
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
        {...rest}
      />
    </div>
  )
}

function Working({ children }) {
  return (
    <p className="mt-1.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">{children}</p>
  )
}
