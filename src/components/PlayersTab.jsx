import { useMemo, useState } from 'react'
import { LEVEL_META } from '../lib/matchmaker'
import {
  MAX_NAME,
  PLAYER_MAX,
  PLAYER_WARN,
  checkBatch,
  cleanName,
  clipName,
  nameLength,
  nameProblem,
} from '../lib/names'
import { Avatar, GenderDot, LevelBadge, levelLabel } from './PlayerBits'
import RosterSheet from './RosterSheet'
import Icon from './Icon'
import { Button, Card, Empty, Input, Sheet, askConfirm, cx } from './ui'

const SORTS = ['added', 'name', 'level', 'games']

/** พร้อมเล่น → ขอพัก → ยังไม่มา → พร้อมเล่น */
function nextStatus(p) {
  if (p.active === false) return { active: true, resting: false }
  if (p.resting) return { active: false, resting: false }
  return { active: true, resting: true }
}

function statusOf(p) {
  if (p.active === false) return 'absent'
  if (p.resting) return 'resting'
  return 'ready'
}

const STATUS_STYLE = {
  ready: 'bg-brand-100 text-brand-800 dark:bg-brand-900/60 dark:text-brand-200',
  resting: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  absent: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

export default function PlayersTab({ state, stats, t, lang, actions, setToast }) {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [sort, setSort] = useState('added')
  const [rosterOpen, setRosterOpen] = useState(false)

  const players = useMemo(() => {
    const list = state.players.map((p, i) => ({ ...p, _i: i })).filter((p) => !p.deleted)
    const g = (p) => stats[p.id]?.games ?? 0
    const cmp = {
      added: (a, b) => a._i - b._i,
      name: (a, b) => a.name.localeCompare(b.name, lang === 'th' ? 'th' : 'en'),
      level: (a, b) => b.level - a.level || a.name.localeCompare(b.name),
      games: (a, b) => g(b) - g(a) || a.name.localeCompare(b.name),
    }[sort]
    return list.sort(cmp)
  }, [state.players, stats, sort, lang])

  const visible = state.players.filter((p) => !p.deleted)
  const readyCount = visible.filter((p) => p.active !== false && !p.resting).length

  /**
   * Deleting a name that has never been on court is almost always a typo fix,
   * so it goes straight through; anyone with games behind them gets a prompt.
   */
  const removePlayer = async (p) => {
    const played = (stats[p.id]?.games ?? 0) > 0
    if (
      played &&
      !(await askConfirm({
        message: t('deletePlayerConfirm', { name: p.name }),
        confirmLabel: t('cfDeleteName', { name: p.name }),
      }))
    )
      return
    actions.removePlayer(p.id)
  }

  const taken = visible.map((p) => p.name)
  const full = visible.length >= PLAYER_MAX
  // empty is shown by the disabled button, not as an error
  const draftProblem = draft.trim() ? nameProblem(draft, taken) : null

  const submitQuick = (e) => {
    e.preventDefault()
    if (full || !draft.trim() || draftProblem) return
    actions.addPlayers([cleanName(draft)])
    setDraft('')
  }

  // every pasted name must pass before any is added, so none is dropped quietly
  const [bulkCheck, setBulkCheck] = useState(null)
  const submitBulk = () => {
    const check = checkBatch(bulkText.split(/[\n,]/), taken)
    if (check.problems.length || check.over) {
      setBulkCheck(check)
      return
    }
    if (check.names.length) actions.addPlayers(check.names)
    setBulkText('')
    setBulkCheck(null)
    setBulkOpen(false)
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={submitQuick} className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Input
              value={draft}
              onChange={(e) => setDraft(clipName(e.target.value))}
              placeholder={full ? t('playersFull', { max: PLAYER_MAX }) : t('playerNamePh')}
              aria-label={t('addPlayer')}
              aria-invalid={Boolean(draftProblem)}
              disabled={full}
              enterKeyHint="done"
              className={cx(
                'pr-12',
                draftProblem && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30'
              )}
            />
            {draft && <NameCount name={draft} />}
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={full || !draft.trim() || Boolean(draftProblem)}
            className="px-5"
          >
            {t('add')}
          </Button>
        </form>
        {draftProblem && (
          <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400" role="alert">
            {t(`name_${draftProblem}`, { name: cleanName(draft), max: MAX_NAME })}
          </p>
        )}
        {visible.length >= PLAYER_WARN && (
          <p
            className={cx(
              'mt-2 rounded-lg px-2.5 py-1.5 text-xs',
              full
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
            )}
          >
            {full
              ? t('playersMaxReached', { max: PLAYER_MAX })
              : t('playersMany', { n: visible.length, max: PLAYER_MAX })}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button disabled={full} onClick={() => setBulkOpen(true)}>
            + {t('bulkAdd')}
          </Button>
          <Button onClick={() => setRosterOpen(true)}>
            <Icon name="book" />
            {t('rosterOpen')}
            {state.rosters?.length ? ` · ${state.rosters.length}` : ''}
          </Button>
        </div>
        {/* check-in on the left with its count; clearing everyone is pushed to the far end */}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
          {visible.length > 0 && (
            <Button onClick={actions.markAllPresent}>{t('markAllPresent')}</Button>
          )}
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {t('available')} <b className="text-brand-700 dark:text-brand-300">{readyCount}</b>{' '}
            / {visible.length}
          </span>
          {visible.length > 0 && (
            <button
              onClick={async () => {
                const ok = await askConfirm({
                  message: t('clearPlayersConfirm', { n: visible.length }),
                  confirmLabel: t('cfClearPlayers', { n: visible.length }),
                })
                if (ok) actions.clearPlayers()
              }}
              className="ml-auto h-11 rounded-xl px-2 text-sm text-rose-700 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              {t('clearPlayers')}
            </button>
          )}
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <Empty icon="users" title={t('noPlayers')} hint={t('noPlayersHint')} />
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-slate-600 dark:text-slate-400">{t('sortBy')}</span>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {SORTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={cx(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition',
                    sort === s
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-200/70 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {t(
                    {
                      added: 'sortAdded',
                      name: 'sortName',
                      level: 'sortLevel',
                      games: 'sortGames',
                    }[s]
                  )}
                </button>
              ))}
            </div>
          </div>

          <Card className="divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
            {players.map((p) => {
              const st = statusOf(p)
              const s = stats[p.id]
              return (
                <div key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    onClick={() => setEditing(p)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <Avatar name={p.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <GenderDot gender={p.gender} />
                        <span
                          className={cx(
                            'truncate font-medium',
                            st === 'absent' && 'text-slate-400 dark:text-slate-500'
                          )}
                        >
                          {p.name}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <LevelBadge level={p.level} />
                        {s && s.games > 0 && (
                          <span className="tabular-nums">
                            {s.games} {t('games')}
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={() => actions.updatePlayer(p.id, nextStatus(p))}
                    className={cx(
                      'shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition active:scale-95',
                      STATUS_STYLE[st]
                    )}
                  >
                    {t(st === 'ready' ? 'playing' : st === 'resting' ? 'resting' : 'absent')}
                  </button>
                  <button
                    onClick={() => removePlayer(p)}
                    aria-label={t('removePlayer')}
                    title={t('removePlayer')}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-100 hover:text-rose-600 active:scale-95 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                    >
                      <path
                        d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L15 6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              )
            })}
          </Card>
        </>
      )}

      <Sheet
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title={t('bulkAdd')}
        footer={
          <Button variant="primary" size="lg" className="w-full" onClick={submitBulk}>
            {t('add')}
          </Button>
        }
      >
        <p className="mb-2 text-sm text-slate-500 dark:text-slate-400">
          {t('bulkAddHint')}{' '}
          {t('bulkAddRules', { max: MAX_NAME, room: PLAYER_MAX - visible.length })}
        </p>
        <textarea
          value={bulkText}
          onChange={(e) => {
            setBulkText(e.target.value)
            setBulkCheck(null)
          }}
          rows={8}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-base focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none dark:border-slate-700 dark:bg-slate-950"
          placeholder={'สมชาย\nปุ๊ก\nเอก\nนิด'}
        />
        {bulkCheck && (
          <div
            className="mt-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
            role="alert"
          >
            <p className="font-semibold">{t('bulkFix')}</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {bulkCheck.problems.map((p, i) => (
                <li key={i}>{t(`name_${p.problem}`, { name: p.name, max: MAX_NAME })}</li>
              ))}
              {bulkCheck.over > 0 && (
                <li>{t('bulkOver', { n: bulkCheck.over, max: PLAYER_MAX })}</li>
              )}
            </ul>
          </div>
        )}
      </Sheet>

      <RosterSheet
        open={rosterOpen}
        onClose={() => setRosterOpen(false)}
        state={state}
        t={t}
        actions={actions}
        setToast={setToast}
      />

      <PlayerEditor
        player={editing}
        onClose={() => setEditing(null)}
        t={t}
        lang={lang}
        actions={actions}
        taken={editing ? taken.filter((_, i) => visible[i].id !== editing.id) : taken}
      />
    </div>
  )
}

/** "5/12" inside the end of a name field, red once the limit is reached. */
function NameCount({ name }) {
  const n = nameLength(name)
  return (
    <span
      className={cx(
        'pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs tabular-nums',
        n >= MAX_NAME ? 'text-rose-500' : 'text-slate-400'
      )}
      aria-hidden
    >
      {n}/{MAX_NAME}
    </span>
  )
}

function PlayerEditor({ player, onClose, t, lang, actions, taken }) {
  const [form, setForm] = useState(null)
  const current = form && player && form.id === player.id ? form : player
  if (!player) return null

  const set = (patch) => setForm({ ...current, ...patch })
  // a name saved before the limit existed may stay as it is, unless it is edited
  const touched = current.name !== player.name
  const problem = touched ? nameProblem(current.name, taken) : null

  const save = () => {
    const name = touched ? cleanName(current.name) : player.name
    if (problem || !name) return
    actions.updatePlayer(player.id, {
      name,
      level: current.level,
      gender: current.gender,
      active: current.active,
      resting: current.resting,
    })
    setForm(null)
    onClose()
  }

  const remove = async () => {
    const ok = await askConfirm({
      message: t('deletePlayerConfirm', { name: player.name }),
      confirmLabel: t('cfDeleteName', { name: player.name }),
    })
    if (!ok) return
    actions.removePlayer(player.id)
    setForm(null)
    onClose()
  }

  return (
    <Sheet
      open={!!player}
      onClose={() => {
        setForm(null)
        onClose()
      }}
      title={player.name}
      footer={
        <div className="flex gap-2">
          <Button variant="danger" onClick={remove}>
            {t('delete')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={save}
            disabled={Boolean(problem)}
          >
            {t('save')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">{t('name')}</span>
          <span className="relative block">
            <Input
              value={current.name}
              onChange={(e) => set({ name: clipName(e.target.value) })}
              aria-invalid={Boolean(problem)}
              className={cx(
                'pr-12',
                problem && 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30'
              )}
            />
            <NameCount name={current.name} />
          </span>
          {problem && (
            <span
              className="mt-1.5 block text-xs text-rose-600 dark:text-rose-400"
              role="alert"
            >
              {t(`name_${problem}`, { name: cleanName(current.name), max: MAX_NAME })}
            </span>
          )}
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium">{t('level')}</span>
          <div className="grid grid-cols-5 gap-1.5">
            {LEVEL_META.map((l) => (
              <button
                key={l.value}
                onClick={() => set({ level: l.value })}
                className={cx(
                  'rounded-xl border px-1 py-2 text-center transition',
                  current.level === l.value
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              >
                <span className="block text-base leading-none" aria-hidden>
                  {l.emoji}
                </span>
                <span className="mt-1 block text-sm font-bold">{l.code}</span>
                <span className="mt-0.5 block text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                  {lang === 'en' ? l.en : l.th}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {levelLabel(current.level, lang)}
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">{t('gender')}</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { v: 'M', label: t('male') },
              { v: 'F', label: t('female') },
              { v: '-', label: t('unspecified') },
            ].map((o) => (
              <button
                key={o.v}
                onClick={() => set({ gender: o.v })}
                className={cx(
                  'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition',
                  (current.gender || '-') === o.v
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40'
                    : 'border-slate-200 dark:border-slate-700'
                )}
              >
                <GenderDot gender={o.v} />
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">{t('present')}</span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              {
                key: 'ready',
                label: t('playing'),
                patch: { active: true, resting: false },
              },
              {
                key: 'resting',
                label: t('resting'),
                patch: { active: true, resting: true },
              },
              {
                key: 'absent',
                label: t('absent'),
                patch: { active: false, resting: false },
              },
            ].map((o) => {
              const active =
                (current.active === false
                  ? 'absent'
                  : current.resting
                    ? 'resting'
                    : 'ready') === o.key
              return (
                <button
                  key={o.key}
                  onClick={() => set(o.patch)}
                  className={cx(
                    'rounded-xl border py-2.5 text-sm font-medium transition',
                    active
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/40'
                      : 'border-slate-200 dark:border-slate-700'
                  )}
                >
                  {o.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Sheet>
  )
}
