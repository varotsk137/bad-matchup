import { useState } from 'react'
import Icon from './Icon'
import { Button, Card, Input, askConfirm } from './ui'

/**
 * Saved settings sets: everything in Settings plus the courts, under a name
 * like "Tuesday · 2 courts". One tap brings a regular session's setup back.
 * The heading is Settings' own (it groups this with the other sections).
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
    <Card className="px-4">
      {presets.length > 0 && (
        <ul className="divide-y divide-slate-100 border-b border-slate-100 dark:divide-slate-800 dark:border-slate-800">
          {presets.map((p) => (
            <li key={p.id} className="flex items-center gap-2 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.9375rem] font-medium">{p.name}</span>
                <span className="mt-0.5 block text-xs text-slate-600 dark:text-slate-400">
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
                onClick={() => {
                  actions.applyPreset(p.id)
                  setToast?.(t('presetApplied', { name: p.name }))
                }}
              >
                {t('presetUse')}
              </Button>
              <button
                type="button"
                onClick={async () => {
                  const ok = await askConfirm({
                    message: t('presetDeleteConfirm', { name: p.name }),
                    confirmLabel: t('cfDeleteName', { name: p.name }),
                  })
                  if (ok) actions.deletePreset(p.id)
                }}
                aria-label={t('delete')}
                className="-mr-2 grid h-11 w-11 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none dark:text-slate-400 dark:hover:bg-slate-800"
              >
                <Icon name="trash" className="h-5 w-5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <label htmlFor="preset-name" className="block pt-4 pb-1.5 text-sm font-medium">
        {t('v4PresetName')}
      </label>
      <div className="flex gap-2 pb-4">
        <Input
          id="preset-name"
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
  )
}
