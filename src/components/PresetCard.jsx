import { useState } from 'react'
import { Button, Card, Input, SectionTitle, askConfirm } from './ui'

/**
 * Saved settings sets: everything in Settings plus the courts, under a name
 * like "Tuesday · 2 courts". One tap brings a regular session's setup back.
 */
export default function PresetCard({ state, t, actions, setToast }) {
  const [name, setName] = useState('')
  const presets = state.presets || []

  const save = () => {
    const n = name.trim()
    if (!n) return
    actions.savePreset(n)
    setName('')
    setToast?.(t('presetSaved', { name: n }))
  }

  return (
    <div>
      <SectionTitle hint={t('presetsHint')}>{t('presetsTitle')}</SectionTitle>
      <Card className="space-y-3 p-4">
        {presets.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {presets.map((p) => (
              <li key={p.id} className="flex items-center gap-2 py-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.name}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                    {t('presetSummary', {
                      courts: p.courts.filter((c) => c.enabled !== false).length,
                      mode: t(
                        p.options.useStamina === false
                          ? 'staminaOffShort'
                          : `rest${p.options.restMode[0].toUpperCase()}${p.options.restMode.slice(1)}`
                      ),
                    })}
                  </span>
                </span>
                <Button
                  className="h-9"
                  onClick={() => {
                    actions.applyPreset(p.id)
                    setToast?.(t('presetApplied', { name: p.name }))
                  }}
                >
                  {t('presetUse')}
                </Button>
                <button
                  onClick={async () => {
                    const ok = await askConfirm({
                      message: t('presetDeleteConfirm', { name: p.name }),
                      confirmLabel: t('cfDeleteName', { name: p.name }),
                    })
                    if (ok) actions.deletePreset(p.id)
                  }}
                  aria-label={t('delete')}
                  className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-rose-600 dark:hover:bg-slate-800"
                >
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      d="M4 6h12M8 6V4h4v2m-6 0 1 10h6l1-10"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder={t('presetNamePh')}
            className="flex-1"
          />
          <Button variant="primary" disabled={!name.trim()} onClick={save}>
            {t('save')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
