import { useRef } from 'react'
import { DEFAULT_OPTIONS, DEFAULT_WEIGHTS } from '../lib/matchmaker'
import { exportState, importState } from '../lib/storage'
import { Button, Card, SectionTitle, Segmented, Slider, Toggle, cx } from './ui'

export default function SettingsTab({ state, t, actions, setToast }) {
  const fileRef = useRef(null)

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
      </Card>

      {/* --------------------------------------------------- stamina */}
      <div>
        <SectionTitle>{t('staminaTitle')}</SectionTitle>
        <Card className="divide-y divide-slate-100 px-4 dark:divide-slate-800">
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
          <Toggle
            label={t('allowDowngrade')}
            hint={t('allowDowngradeHint')}
            checked={o.allowDowngrade}
            onChange={(v) => actions.setOption('allowDowngrade', v)}
          />
        </Card>
      </div>

      {/* --------------------------------------------------- gender + effort */}
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
      </Card>

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
        🏸 {t('appName')} · v1.0
      </p>
    </div>
  )
}

const pickTuning = ({
  maxConsecutive,
  enforceStamina,
  allowDowngrade,
  genderMode,
  effort,
}) => ({
  maxConsecutive,
  enforceStamina,
  allowDowngrade,
  genderMode,
  effort,
})
