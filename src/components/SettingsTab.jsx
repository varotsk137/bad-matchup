import { useEffect, useRef, useState } from 'react'
import { version } from '../../package.json'
import { DEFAULT_OPTIONS, DEFAULT_WEIGHTS } from '../lib/matchmaker'
import { DEFAULT_SKIN, SKINS, loadSkinFont } from '../lib/skins'
import { exportState, importState } from '../lib/storage'
import { RestModeHelp } from './HelpSheet'
import PaymentCard from './PaymentCard'
import PresetCard from './PresetCard'
import { InstallRow } from './PwaBits'
import RoomHistoryCard from './RoomHistoryCard'
import { Button, Card, SectionTitle, Segmented, Slider, Toggle, cx } from './ui'

export default function SettingsTab({ state, t, actions, setToast }) {
  const fileRef = useRef(null)
  const [restHelp, setRestHelp] = useState(false)

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
    <div className="space-y-5">
      {/* --------------------------------------------------- appearance */}
      <Card className="p-4">
        <label className="mb-1.5 block text-sm font-medium">{t('language')}</label>
        <Segmented
          value={state.lang}
          onChange={(v) => actions.set({ lang: v })}
          options={[
            { value: 'th', label: 'ไทย' },
            { value: 'en', label: 'English' },
          ]}
        />
        <label className="mt-4 mb-1.5 block text-sm font-medium">{t('theme')}</label>
        <Segmented
          value={state.theme}
          onChange={(v) => actions.set({ theme: v })}
          options={[
            { value: 'light', label: t('themeLight') },
            { value: 'dark', label: t('themeDark') },
          ]}
        />
        <label className="mt-4 block text-sm font-medium">{t('skin')}</label>
        <p className="mb-1.5 text-xs text-slate-500 dark:text-slate-400">{t('skinHint')}</p>
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
          role="radiogroup"
          aria-label={t('skin')}
        >
          {SKINS.map((s) => {
            const on = (state.skin || DEFAULT_SKIN) === s.id
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => actions.set({ skin: s.id })}
                className={cx(
                  'rounded-xl border-(length:--line-w) p-1.5 text-left transition active:scale-[0.98]',
                  on
                    ? 'border-brand-600 ring-2 ring-brand-500/40'
                    : 'border-edge hover:border-slate-400'
                )}
              >
                <SkinSwatch preview={s.preview} />
                <span
                  className="flex items-center justify-between gap-1 px-1 pt-1.5 text-sm"
                  style={{ fontFamily: s.font }}
                >
                  {t(s.label)}
                  {on && (
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4 text-brand-600"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z"
                      />
                    </svg>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <PaymentCard t={t} setToast={setToast} />

      {/* --------------------------------------------------- stamina */}
      <div>
        <SectionTitle>{t('staminaTitle')}</SectionTitle>
        <Card className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
          <Toggle
            label={t('useStamina')}
            hint={t('useStaminaHint')}
            checked={o.useStamina !== false}
            onChange={(v) => actions.setOption('useStamina', v)}
          />
          {o.useStamina !== false && (
            <>
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm font-medium">{t('maxConsecutive')}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => actions.setOption('maxConsecutive', n)}
                      className={cx(
                        'h-9 w-9 rounded-lg text-sm font-semibold tabular-nums transition',
                        o.maxConsecutive === n
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <Toggle
                label={t('enforceStamina')}
                hint={t('enforceStaminaHint')}
                checked={o.enforceStamina}
                onChange={(v) => actions.setOption('enforceStamina', v)}
              />
              {o.enforceStamina && (
                <div className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{t('restMode')}</span>
                    <button
                      onClick={() => setRestHelp(true)}
                      aria-label={t('help')}
                      title={t('help')}
                      className="grid h-7 w-7 place-items-center rounded-lg bg-slate-200/70 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      ?
                    </button>
                  </div>
                  <Segmented
                    className="mt-2"
                    size="sm"
                    value={o.restMode}
                    onChange={(v) => actions.setOption('restMode', v)}
                    options={[
                      { value: 'fill', label: t('restFill') },
                      { value: 'flex', label: t('restFlex') },
                      { value: 'strict', label: t('restStrict') },
                    ]}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {t(`rest${o.restMode[0].toUpperCase()}${o.restMode.slice(1)}Hint`)}
                  </p>
                </div>
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
        </Card>
        <RestModeHelp open={restHelp} onClose={() => setRestHelp(false)} t={t} />
      </div>

      {/* --------------------------------------------------- gender + effort */}
      <div>
        <SectionTitle hint={t('matchingHint')}>{t('matchingTitle')}</SectionTitle>
        <Card className="p-4">
          <label className="mb-1.5 block text-sm font-medium">{t('genderMode')}</label>
          <Segmented
            size="sm"
            value={o.genderMode}
            onChange={(v) => actions.setOption('genderMode', v)}
            options={[
              { value: 'off', label: t('genderOff') },
              { value: 'mixed', label: t('genderMixed') },
              { value: 'same', label: t('genderSame') },
            ]}
          />
          <label className="mt-4 mb-1.5 block text-sm font-medium">{t('effort')}</label>
          <Segmented
            size="sm"
            value={o.effort}
            onChange={(v) => actions.setOption('effort', v)}
            options={[
              { value: 'fast', label: t('effortFast') },
              { value: 'normal', label: t('effortNormal') },
              { value: 'thorough', label: t('effortThorough') },
            ]}
          />
          <div className="mt-3 -mx-4 border-t border-slate-100 px-4 dark:border-slate-800">
            <Toggle
              label={t('fairestOfThree')}
              hint={t('fairestOfThreeHint')}
              checked={o.fairestOfThree !== false}
              onChange={(v) => actions.setOption('fairestOfThree', v)}
            />
          </div>
        </Card>
      </div>

      {/* --------------------------------------------------- weights */}
      <div>
        <SectionTitle hint={t('weightsHint')}>{t('weightsTitle')}</SectionTitle>
        <Card className="px-4 py-2">
          <p className="mt-1 mb-1 text-xs font-semibold tracking-wide text-brand-700 uppercase dark:text-brand-300">
            {t('wSelection')}
          </p>
          <Slider label={t('wFewGames')} value={w.fewGames} onChange={setW('fewGames')} />
          <Slider label={t('wWaiting')} value={w.waiting} onChange={setW('waiting')} />
          <Slider label={t('wStamina')} value={w.stamina} onChange={setW('stamina')} />

          <p className="mt-4 mb-1 border-t border-slate-100 pt-3 text-xs font-semibold tracking-wide text-brand-700 uppercase dark:border-slate-800 dark:text-brand-300">
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

          <div className="py-3">
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
        </Card>
      </div>

      {/* saving a setup comes after every setting it would save */}
      <PresetCard state={state} t={t} actions={actions} setToast={setToast} />

      <RoomHistoryCard t={t} lang={state.lang} />

      <InstallRow t={t} state={state} />

      {/* --------------------------------------------------- data */}
      <div>
        <SectionTitle hint={t('dataHint')}>{t('dataTitle')}</SectionTitle>
        <Card className="space-y-2 p-4">
          <Button className="w-full" onClick={() => exportState(state)}>
            ⬇ {t('exportData')}
          </Button>
          <Button className="w-full" onClick={() => fileRef.current?.click()}>
            ⬆ {t('importData')}
          </Button>
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
            onClick={() => {
              if (confirm(t('resetAllConfirm'))) actions.resetAll()
            }}
          >
            {t('resetAll')}
          </Button>
        </Card>
      </div>

      <p className="px-2 pb-2 text-center text-xs text-slate-400 dark:text-slate-600">
        🏸 {t('appName')} · v{version}
      </p>
    </div>
  )
}

/** A thumbnail of a skin: its page, a card with its outline, and its colours. */
function SkinSwatch({ preview: p }) {
  return (
    <span className="block rounded-lg p-2" style={{ background: p.page }} aria-hidden>
      <span
        className="flex items-center gap-1.5 rounded-md p-1.5"
        style={{ background: p.card, border: p.line, boxShadow: p.shadow }}
      >
        <span className="h-3 flex-1" style={{ background: p.brand, borderRadius: p.radius }} />
        <span className="h-3 w-5" style={{ background: p.accent, borderRadius: p.radius }} />
        <span
          className="h-3 w-3"
          style={{ background: p.pick, border: p.line, borderRadius: '9999px' }}
        />
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
