import { useEffect, useId, useRef, useState } from 'react'
import { version } from '../../package.json'
import { DEFAULT_OPTIONS, DEFAULT_WEIGHTS } from '../lib/matchmaker'
import { BASE_SKINS, DEFAULT_SKIN, EXTRA_SKINS, SKINS, loadSkinFont } from '../lib/skins'
import { exportState, importState } from '../lib/storage'
import HelpSheet, { RestModeHelp } from './HelpSheet'
import Icon from './Icon'
import PaymentCard from './PaymentCard'
import PresetCard from './PresetCard'
import { InstallRow } from './PwaBits'
import {
  Button,
  Card,
  ScreenTitle,
  Segmented,
  Sheet,
  Slider,
  Toggle,
  askConfirm,
  cx,
} from './ui'

export default function SettingsTab({ state, t, actions, setToast }) {
  const fileRef = useRef(null)
  const [restHelp, setRestHelp] = useState(false)
  const [help, setHelp] = useState(false)
  const [moreSkins, setMoreSkins] = useState(false)
  const [advanced, setAdvanced] = useState(false)
  const activeSkin = state.skin || DEFAULT_SKIN
  const activeExtra = EXTRA_SKINS.find((s) => s.id === activeSkin)

  // the skin picker names each skin in its own font
  useEffect(() => SKINS.forEach(loadSkinFont), [])

  const onImport = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const next = await importState(file)
      actions.replaceState(next)
      setToast(t('importDone'))
    } catch {
      setToast(t('importFailed'), 'error')
    }
  }

  const w = state.weights
  const o = state.options
  const setW = (k) => (v) => actions.setWeight(k, v)

  return (
    <div className="space-y-8">
      <ScreenTitle title={t('tabSettings')} />

      {/* --------------------------------------------------- appearance */}
      <Group title={t('v4Appearance')}>
        <Card className="space-y-5 p-4">
          <Field label={t('language')}>
            <Segmented
              label={t('language')}
              value={state.lang}
              onChange={(v) => actions.set({ lang: v })}
              options={[
                { value: 'th', label: 'ไทย' },
                { value: 'en', label: 'English' },
              ]}
            />
          </Field>
          <Field label={t('theme')}>
            <Segmented
              label={t('theme')}
              value={state.theme}
              onChange={(v) => actions.set({ theme: v })}
              options={[
                { value: 'light', label: t('themeLight') },
                { value: 'dark', label: t('themeDark') },
              ]}
            />
          </Field>
          <Field label={t('skin')} hint={t('skinHint')}>
            <div
              className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
              role="radiogroup"
              aria-label={t('skin')}
            >
              {BASE_SKINS.map((s) => (
                <SkinTile
                  key={s.id}
                  skin={s}
                  on={activeSkin === s.id}
                  t={t}
                  onPick={() => actions.set({ skin: s.id })}
                />
              ))}
            </div>
            {/* the extras live in a sheet; this row says which one is on, if any */}
            <button
              type="button"
              onClick={() => setMoreSkins(true)}
              className={cx(
                'mt-2.5 flex min-h-14 w-full items-center gap-3 rounded-xl border-(length:--line-w) px-3 py-2 text-left transition active:scale-[0.99]',
                'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
                activeExtra
                  ? 'border-brand-600 ring-2 ring-brand-500/40'
                  : 'border-edge hover:border-slate-400'
              )}
            >
              <span aria-hidden className="flex shrink-0 -space-x-1.5">
                {(activeExtra ? [activeExtra] : EXTRA_SKINS.slice(0, 4)).map((s) => (
                  <span
                    key={s.id}
                    className="h-6 w-6 rounded-full ring-2 ring-slate-50 dark:ring-slate-900"
                    style={{ background: s.preview.brand || s.preview.accent }}
                  />
                ))}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-sm font-medium"
                  style={activeExtra && { fontFamily: activeExtra.font }}
                >
                  {activeExtra ? t(activeExtra.label) : t('skinMore')}
                </span>
                <span className="block text-xs text-slate-600 dark:text-slate-400">
                  {activeExtra ? t('skinMore') : t('skinMoreCount', { n: EXTRA_SKINS.length })}
                </span>
              </span>
              {activeExtra ? (
                <span className="shrink-0 text-sm font-semibold text-brand-700 dark:text-brand-300">
                  {t('skinMoreChange')}
                </span>
              ) : (
                <Chevron className="-rotate-90" />
              )}
            </button>
          </Field>
        </Card>
        <Sheet open={moreSkins} onClose={() => setMoreSkins(false)} title={t('skinMore')}>
          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{t('skinMoreHint')}</p>
          <div
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            role="radiogroup"
            aria-label={t('skinMore')}
          >
            {EXTRA_SKINS.map((s) => (
              <SkinTile
                key={s.id}
                skin={s}
                on={activeSkin === s.id}
                t={t}
                onPick={() => {
                  actions.set({ skin: s.id })
                  setMoreSkins(false)
                }}
              />
            ))}
          </div>
        </Sheet>
      </Group>

      {/* --------------------------------------------------- scheduling */}
      <Group title={t('v4Scheduling')}>
        <div className="space-y-3">
          <Card className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
            <Toggle
              label={t('useStamina')}
              hint={t('useStaminaHint')}
              checked={o.useStamina !== false}
              onChange={(v) => actions.setOption('useStamina', v)}
            />
            {o.useStamina !== false && (
              <>
                <Field label={t('maxConsecutive')} className="py-3">
                  <Segmented
                    label={t('maxConsecutive')}
                    value={o.maxConsecutive}
                    onChange={(n) => actions.setOption('maxConsecutive', n)}
                    options={[1, 2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
                  />
                </Field>
                <Toggle
                  label={t('enforceStamina')}
                  hint={t('enforceStaminaHint')}
                  checked={o.enforceStamina}
                  onChange={(v) => actions.setOption('enforceStamina', v)}
                />
                {o.enforceStamina && (
                  <Field
                    label={t('restMode')}
                    className="py-3"
                    aside={
                      <button
                        type="button"
                        onClick={() => setRestHelp(true)}
                        aria-label={t('help')}
                        title={t('help')}
                        className="-my-2.5 -mr-2 grid h-11 w-11 place-items-center rounded-xl focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          ?
                        </span>
                      </button>
                    }
                  >
                    <Segmented
                      label={t('restMode')}
                      value={o.restMode}
                      onChange={(v) => actions.setOption('restMode', v)}
                      options={[
                        { value: 'fill', label: t('restFill') },
                        { value: 'flex', label: t('restFlex') },
                        { value: 'strict', label: t('restStrict') },
                      ]}
                    />
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      {t(`rest${o.restMode[0].toUpperCase()}${o.restMode.slice(1)}Hint`)}
                    </p>
                  </Field>
                )}
              </>
            )}
            {/* about courts, not stamina — so they stay when stamina is off */}
            <Toggle
              label={t('allowDowngrade')}
              hint={t('allowDowngradeHint')}
              checked={o.allowDowngrade}
              onChange={(v) => actions.setOption('allowDowngrade', v)}
            />
            <Toggle
              label={t('fillIdleCourts')}
              hint={t('fillIdleCourtsHint')}
              checked={o.allowDowngrade && o.fillIdleCourts !== false}
              disabled={!o.allowDowngrade}
              onChange={(v) => actions.setOption('fillIdleCourts', v)}
            />
            <Field label={t('genderMode')} className="py-3">
              <Segmented
                label={t('genderMode')}
                value={o.genderMode}
                onChange={(v) => actions.setOption('genderMode', v)}
                options={[
                  { value: 'off', label: t('genderOff') },
                  { value: 'mixed', label: t('genderMixed') },
                  { value: 'same', label: t('genderSame') },
                ]}
              />
            </Field>
          </Card>
          <RestModeHelp open={restHelp} onClose={() => setRestHelp(false)} t={t} />

          {/* rarely touched: closed until asked for */}
          <Card className="overflow-hidden">
            <button
              type="button"
              aria-expanded={advanced}
              aria-controls="settings-advanced"
              onClick={() => setAdvanced((v) => !v)}
              className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left focus-visible:bg-slate-100 focus-visible:outline-none dark:focus-visible:bg-slate-800"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t('v4Advanced')}</span>
                <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
                  {t('v4AdvancedHint')}
                </span>
              </span>
              <Chevron
                className={cx(
                  'transition-transform duration-200 ease-snap motion-reduce:transition-none',
                  advanced && 'rotate-180'
                )}
              />
            </button>
            <div
              id="settings-advanced"
              inert={!advanced}
              className={cx(
                'grid transition-[grid-template-rows,opacity] duration-300 ease-snap motion-reduce:transition-none',
                advanced ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="divide-y divide-slate-100 border-t border-slate-100 px-4 dark:divide-slate-800 dark:border-slate-800">
                  <Field label={t('effort')} className="py-3">
                    <Segmented
                      label={t('effort')}
                      value={o.effort}
                      onChange={(v) => actions.setOption('effort', v)}
                      options={[
                        { value: 'fast', label: t('effortFast') },
                        { value: 'normal', label: t('effortNormal') },
                        { value: 'thorough', label: t('effortThorough') },
                      ]}
                    />
                  </Field>
                  <Toggle
                    label={t('fairestOfThree')}
                    hint={t('fairestOfThreeHint')}
                    checked={o.fairestOfThree !== false}
                    onChange={(v) => actions.setOption('fairestOfThree', v)}
                  />
                  <div className="py-3">
                    <p className="text-sm font-medium">{t('weightsTitle')}</p>
                    <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                      {t('weightsHint')}
                    </p>
                    <p className="mt-4 text-xs font-semibold text-brand-700 dark:text-brand-300">
                      {t('wSelection')}
                    </p>
                    <Slider label={t('wFewGames')} value={w.fewGames} onChange={setW('fewGames')} />
                    <Slider label={t('wWaiting')} value={w.waiting} onChange={setW('waiting')} />
                    <Slider label={t('wStamina')} value={w.stamina} onChange={setW('stamina')} />
                    <p className="mt-4 text-xs font-semibold text-brand-700 dark:text-brand-300">
                      {t('wArrangement')}
                    </p>
                    <Slider
                      label={t('wLevelBalance')}
                      value={w.levelBalance}
                      onChange={setW('levelBalance')}
                    />
                    <Slider
                      label={t('wLevelSpread')}
                      value={w.levelSpread}
                      onChange={setW('levelSpread')}
                    />
                    <Slider
                      label={t('wPartnerVariety')}
                      value={w.partnerVariety}
                      onChange={setW('partnerVariety')}
                    />
                    <Slider
                      label={t('wOpponentVariety')}
                      value={w.opponentVariety}
                      onChange={setW('opponentVariety')}
                    />
                    <Slider label={t('wGender')} value={w.gender} onChange={setW('gender')} />
                  </div>
                  <div className="py-4">
                    <Button
                      className="w-full"
                      onClick={() =>
                        actions.set({
                          weights: { ...DEFAULT_WEIGHTS },
                          options: { ...state.options, ...pickTuning(DEFAULT_OPTIONS) },
                        })
                      }
                    >
                      {t('restoreDefaults')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Group>

      {/* saving a setup comes after every setting it would save */}
      <Group title={t('presetsTitle')} hint={t('presetsHint')}>
        <PresetCard state={state} t={t} actions={actions} setToast={setToast} />
      </Group>

      <Group title={t('payTitle')} hint={t('payPrivate')}>
        <PaymentCard t={t} setToast={setToast} />
      </Group>

      {/* --------------------------------------------------- data */}
      <Group title={t('dataTitle')} hint={t('dataHint')}>
        <Card className="space-y-2.5 p-4">
          <div className="grid grid-cols-2 gap-2.5">
            <Button onClick={() => exportState(state)}>{t('exportData')}</Button>
            <Button onClick={() => fileRef.current?.click()}>{t('importData')}</Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImport}
          />
          <Button
            variant="danger"
            className="w-full"
            onClick={async () => {
              const ok = await askConfirm({
                message: t('resetAllConfirm'),
                confirmLabel: t('cfResetAll'),
              })
              if (ok) actions.resetAll()
            }}
          >
            {t('resetAll')}
          </Button>
        </Card>
      </Group>

      {/* --------------------------------------------------- about */}
      <Group title={t('about')}>
        <div className="space-y-3">
          <Card className="overflow-hidden">
            <button
              type="button"
              onClick={() => setHelp(true)}
              className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-100/70 focus-visible:bg-slate-100 focus-visible:outline-none dark:hover:bg-slate-800/50 dark:focus-visible:bg-slate-800"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                <Icon name="book" className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{t('help')}</span>
                <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
                  {t('helpTitle')}
                </span>
              </span>
              <Chevron className="-rotate-90" />
            </button>
          </Card>
          <HelpSheet open={help} onClose={() => setHelp(false)} t={t} />
          <InstallRow t={t} state={state} />
        </div>
        <p className="px-1 pt-5 text-center text-xs text-slate-600 dark:text-slate-400">
          {t('appName')} · v{version}
        </p>
      </Group>
    </div>
  )
}

/** A settings group: a heading that names it for assistive tech, and its cards. */
function Group({ title, hint, children }) {
  const id = useId()
  return (
    <section aria-labelledby={id}>
      <div className="mb-2.5 px-1">
        <h3 id={id} className="section-title">
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

/** One labelled setting inside a card; `aside` sits at the end of the label line. */
function Field({ label, hint, aside, className = '', children }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p id={id} className="text-sm font-medium">
            {label}
          </p>
          {hint && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{hint}</p>}
        </div>
        {aside}
      </div>
      {children}
    </div>
  )
}

function Chevron({ className = '' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={cx('h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5.5 8l4.5 4.5L14.5 8" />
    </svg>
  )
}

/** One skin in a picker: a live preview, its name in its own font, a tick when in use. */
function SkinTile({ skin: s, on, t, onPick }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onPick}
      className={cx(
        'rounded-xl border-(length:--line-w) p-1.5 text-left transition-[border-color,box-shadow,transform] duration-200 active:scale-[0.98]',
        'focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none',
        on ? 'border-brand-600 ring-2 ring-brand-500/40' : 'border-edge hover:border-slate-400'
      )}
    >
      <SkinSwatch preview={s.preview} font={s.font} t={t} />
      <span
        className="flex min-h-7 items-center justify-between gap-1 px-1 pt-1.5 text-sm"
        style={{ fontFamily: s.font }}
      >
        <span className="min-w-0 truncate">{t(s.label)}</span>
        {on && (
          <span className="animate-pop grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 10.5l3 3 7-7" />
            </svg>
          </span>
        )}
      </span>
    </button>
  )
}

/**
 * A skin's tile shows a real match row in that skin: its paper, its card, the
 * team colours and the way it marks the round on court, so people pick a look
 * rather than a strip of colour.
 */
function SkinSwatch({ preview: p, font, t }) {
  const live = p.live || {}
  return (
    <span
      className="block rounded-lg p-2"
      style={{
        background: p.page,
        backgroundImage: p.backdrop,
        backgroundSize: p.backdropSize,
        fontFamily: font,
      }}
      aria-hidden
    >
      <span
        className="block p-1.5"
        style={{
          background: p.card,
          border: p.line,
          boxShadow: p.shadow,
          borderRadius: p.radius === '9999px' ? '0.75rem' : p.radius,
        }}
      >
        <span
          className="inline-flex items-center gap-1 px-1.5 text-xs leading-5 font-bold"
          style={{
            background: live.bg || p.brand,
            color: live.ink || 'white',
            border: live.border,
            borderRadius: live.radius || '9999px',
            boxShadow: live.shadow,
            transform: live.tilt && `rotate(${live.tilt})`,
          }}
        >
          {live.dot && (
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: live.dot }} />
          )}
          {t('roundNow')}
        </span>
        <span className="mt-1 flex items-center justify-between gap-1 text-xs leading-5 font-semibold">
          <span className="truncate" style={{ color: p.ta || 'oklch(0.5 0.134 242.7)' }}>
            {t('skinSampleA')}
          </span>
          <span className="opacity-60" style={{ color: p.ink }}>
            vs
          </span>
          <span className="truncate" style={{ color: p.tb || 'oklch(0.514 0.222 16.9)' }}>
            {t('skinSampleB')}
          </span>
        </span>
      </span>
    </span>
  )
}

const pickTuning = ({
  maxConsecutive,
  useStamina,
  enforceStamina,
  restMode,
  allowDowngrade,
  fillIdleCourts,
  fairestOfThree,
  genderMode,
  effort,
}) => ({
  useStamina,
  maxConsecutive,
  enforceStamina,
  restMode,
  allowDowngrade,
  fillIdleCourts,
  fairestOfThree,
  genderMode,
  effort,
})
