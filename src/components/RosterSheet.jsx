import { useState } from 'react'
import { Button, Empty, Input, Sheet, cx } from './ui'

/**
 * Named player lists. A group that plays every Tuesday should not have to
 * retype twelve names every Tuesday.
 */
export default function RosterSheet({ open, onClose, state, t, actions, setToast }) {
  const [name, setName] = useState('')
  const [renaming, setRenaming] = useState(null)
  const [renameText, setRenameText] = useState('')

  if (!open) return null

  const current = state.players.filter((p) => !p.deleted)
  const rosters = state.rosters ?? []

  const save = (e) => {
    e?.preventDefault()
    const label = name.trim()
    if (!label || !current.length) return
    actions.saveRoster(label)
    setName('')
    setToast?.(t('rosterSaved'))
  }

  const load = (roster, mode) => {
    if (mode === 'replace') {
      const risky = current.length > 0 || state.rounds.length > 0
      if (risky && !confirm(t('rosterLoadConfirm', { name: roster.name }))) return
    }
    actions.loadRoster(roster.id, mode)
    setToast?.(t(mode === 'append' ? 'rosterAppended' : 'rosterLoaded'))
    onClose()
  }

  const commitRename = (roster) => {
    const label = renameText.trim()
    if (label) actions.renameRoster(roster.id, label)
    setRenaming(null)
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('rosters')}>
      <div className="space-y-4">
        <form onSubmit={save}>
          <label className="mb-1.5 block text-sm font-medium">{t('rosterSaveCurrent')}</label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('rosterNamePh')}
              enterKeyHint="done"
            />
            <Button
              type="submit"
              variant="primary"
              className="px-4"
              disabled={!name.trim() || !current.length}
            >
              {t('save')}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {current.length ? t('rosterSaveHint', { n: current.length }) : t('rosterSaveEmpty')}
          </p>
        </form>

        <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
          {rosters.length === 0 ? (
            <Empty emoji="📒" title={t('rosterNone')} hint={t('rosterNoneHint')} />
          ) : (
            <ul className="space-y-2">
              {rosters.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  {renaming === r.id ? (
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && commitRename(r)}
                      />
                      <Button
                        variant="primary"
                        className="px-3"
                        onClick={() => commitRename(r)}
                      >
                        {t('save')}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate font-semibold">{r.name}</span>
                        <span className="shrink-0 text-[11px] text-slate-400 tabular-nums">
                          {r.players.length} {t('playersUnit')}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-slate-500">
                        {r.players
                          .slice(0, 6)
                          .map((p) => p.name)
                          .join(', ')}
                        {r.players.length > 6 && ' …'}
                      </p>

                      <div className="mt-2.5 flex gap-1.5">
                        <Button
                          size="sm"
                          variant="primary"
                          className="flex-1"
                          onClick={() => load(r, 'replace')}
                        >
                          {t('rosterLoad')}
                        </Button>
                        <Button size="sm" onClick={() => load(r, 'append')}>
                          {t('rosterAppend')}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setRenaming(r.id)
                            setRenameText(r.name)
                          }}
                          aria-label={t('rename')}
                          title={t('rename')}
                          className="px-2.5"
                        >
                          ✎
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          className={cx('px-2.5')}
                          aria-label={t('delete')}
                          title={t('delete')}
                          onClick={() => {
                            if (confirm(t('rosterDeleteConfirm', { name: r.name })))
                              actions.deleteRoster(r.id)
                          }}
                        >
                          🗑
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Sheet>
  )
}
