import { useId, useMemo, useRef, useState } from 'react'
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
import { GenderDot, LevelPips, levelLabel, levelTone } from './PlayerBits'
import RosterSheet from './RosterSheet'
import Icon from './Icon'
import {
  Avatar,
  Button,
  Card,
  Empty,
  Input,
  ScreenTitle,
  Segmented,
  Sheet,
  StatTile,
  askConfirm,
  cx,
} from './ui'

const SORTS = ['added', 'name', 'level', 'games']
const SORT_LABEL = { added: 'sortAdded', name: 'sortName', level: 'sortLevel', games: 'sortGames' }

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

const STATUS_LABEL = { ready: 'playing', resting: 'resting', absent: 'absent' }
const STATUS_STYLE = {
  ready: 'bg-brand-100 text-brand-800 dark:bg-brand-900/70 dark:text-brand-100',
  resting: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  absent:
    'border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400',
}
const STATUS_DOT = {
  ready: 'bg-brand-600 dark:bg-brand-300',
  resting: 'bg-amber-500',
  absent: 'bg-slate-400 dark:bg-slate-600',
}

// a quiet chip on the ink hero: outlined, lights up on hover, lime focus ring
const INK_CHIP =
  'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-300'
const INK_CHIP_CALM = 'border-slate-700 text-slate-100 hover:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700'

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 dark:focus-visible:outline-brand-300'

export default function PlayersTab({ state, stats, t, lang, actions, setToast }) {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [sort, setSort] = useState('added')
  const [rosterOpen, setRosterOpen] = useState(false)
  const bulkId = useId()

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
  const restingCount = visible.filter((p) => p.active !== false && p.resting).length
  const awayCount = visible.filter((p) => p.active === false).length

  // rows that were already here when the screen opened stay still; only new names rise in
  const firstIds = useRef(null)
  if (!firstIds.current) firstIds.current = new Set(visible.map((p) => p.id))

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
    <div>
      <ScreenTitle
        title={t('tabPlayers')}
        meta={t('v4PlayersMeta', { ready: readyCount, n: visible.length })}
      />

      {/* the hero: who is ready, and the bar that adds the next name */}
      <Card tone="ink" className="p-4 sm:p-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="num text-5xl text-accent-300">{readyCount}</span>
              <span className="num text-2xl text-slate-400">/ {visible.length}</span>
            </div>
            <div className="mt-1.5 text-xs font-medium text-slate-300">{t('v4ReadyNow')}</div>
          </div>
          <div className="flex gap-5 text-right">
            <StatTile ink value={restingCount} label={t('resting')} />
            <StatTile ink value={awayCount} label={t('absent')} />
          </div>
        </div>

        <form onSubmit={submitQuick} className="mt-5">
          <div
            className={cx(
              'flex items-center gap-1.5 rounded-2xl bg-slate-50 p-1.5 ring-2 transition-shadow dark:bg-slate-950',
              draftProblem ? 'ring-rose-400' : 'ring-transparent focus-within:ring-accent-300'
            )}
          >
            <div className="relative min-w-0 flex-1">
              <input
                value={draft}
                onChange={(e) => setDraft(clipName(e.target.value))}
                placeholder={full ? t('playersFull', { max: PLAYER_MAX }) : t('playerNamePh')}
                aria-label={t('addPlayer')}
                aria-invalid={Boolean(draftProblem)}
                disabled={full}
                enterKeyHint="done"
                className={cx(
                  'h-11 w-full bg-transparent pl-2.5 text-lg text-slate-900 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed dark:text-slate-50 dark:placeholder:text-slate-400',
                  draft && 'pr-12'
                )}
              />
              {draft && <NameCount name={draft} />}
            </div>
            <Button
              type="submit"
              variant="accent"
              disabled={full || !draft.trim() || Boolean(draftProblem)}
              className="px-5"
            >
              <svg
                viewBox="0 0 20 20"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M10 4v12M4 10h12" />
              </svg>
              {t('add')}
            </Button>
          </div>
        </form>
        {draftProblem && (
          <p className="mt-2 px-1 text-sm text-rose-300" role="alert">
            {t(`name_${draftProblem}`, { name: cleanName(draft), max: MAX_NAME })}
          </p>
        )}
        {visible.length >= PLAYER_WARN && (
          <p className={cx('mt-2 px-1 text-sm', full ? 'text-rose-300' : 'text-amber-300')}>
            {full
              ? t('playersMaxReached', { max: PLAYER_MAX })
              : t('playersMany', { n: visible.length, max: PLAYER_MAX })}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" disabled={full} onClick={() => setBulkOpen(true)} className={cx(INK_CHIP, INK_CHIP_CALM)}>
            {t('bulkAdd')}
          </button>
          <button type="button" onClick={() => setRosterOpen(true)} className={cx(INK_CHIP, INK_CHIP_CALM)}>
            <Icon name="book" />
            {t('rosterOpen')}
            {state.rosters?.length ? (
              <span className="text-slate-400 tabular-nums">{state.rosters.length}</span>
            ) : null}
          </button>
          {visible.length > 0 && (
            <button type="button" onClick={actions.markAllPresent} className={cx(INK_CHIP, INK_CHIP_CALM)}>
              {t('markAllPresent')}
            </button>
          )}
          {visible.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                const ok = await askConfirm({
                  message: t('clearPlayersConfirm', { n: visible.length }),
                  confirmLabel: t('cfClearPlayers', { n: visible.length }),
                })
                if (ok) actions.clearPlayers()
              }}
              className={cx(INK_CHIP, 'ml-auto border-transparent text-rose-300 hover:bg-rose-950/60')}
            >
              {t('clearPlayers')}
            </button>
          )}
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card className="mt-6">
          <Empty icon="users" title={t('noPlayers')} hint={t('noPlayersHint')} />
        </Card>
      ) : (
        <>
          <div className="mt-6 mb-2 px-1">
            <span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
              {t('sortBy')}
            </span>
            <Segmented
              size="sm"
              value={sort}
              onChange={setSort}
              options={SORTS.map((s) => ({ value: s, label: t(SORT_LABEL[s]) }))}
            />
          </div>

          <Card className="overflow-hidden">
            <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {players.map((p) => {
                const st = statusOf(p)
                const games = stats[p.id]?.games ?? 0
                return (
                  <li
                    key={p.id}
                    className={cx(
                      'flex items-center gap-1 py-1.5 pr-1.5 pl-3',
                      !firstIds.current.has(p.id) && 'animate-pop'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setEditing(p)}
                      className={cx('flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-xl pr-2 text-left', FOCUS)}
                    >
                      <Avatar
                        name={p.name}
                        tone={levelTone(p.level)}
                        className={cx('transition-opacity duration-200', st === 'absent' && 'opacity-45')}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <GenderDot gender={p.gender} />
                          <span
                            className={cx(
                              'truncate text-base font-medium transition-colors duration-200',
                              st === 'absent'
                                ? 'text-slate-500 dark:text-slate-400'
                                : 'text-slate-900 dark:text-slate-50'
                            )}
                          >
                            {p.name}
                          </span>
                        </span>
                        <span className="mt-1 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <LevelPips level={p.level} />
                          {games > 0 && (
                            <span className="tabular-nums">
                              · {games} {t('games')}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => actions.updatePlayer(p.id, nextStatus(p))}
                      aria-label={t('v4StatusFor', { name: p.name, status: t(STATUS_LABEL[st]) })}
                      className={cx('group grid h-11 shrink-0 place-items-center rounded-full', FOCUS)}
                    >
                      <span
                        className={cx(
                          'flex h-8 min-w-[5.75rem] items-center justify-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors duration-200 group-active:scale-95',
                          STATUS_STYLE[st]
                        )}
                      >
                        <span className={cx('h-1.5 w-1.5 rounded-full transition-colors duration-200', STATUS_DOT[st])} />
                        {t(STATUS_LABEL[st])}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removePlayer(p)}
                      aria-label={t('v4DeleteName', { name: p.name })}
                      title={t('removePlayer')}
                      className={cx(
                        'grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-rose-100 hover:text-rose-700 active:scale-95 dark:text-slate-400 dark:hover:bg-rose-950/60 dark:hover:text-rose-300',
                        FOCUS
                      )}
                    >
                      <Icon name="trash" />
                    </button>
                  </li>
                )
              })}
            </ul>
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
        <label htmlFor={bulkId} className="mb-1 block text-sm font-medium">
          {t('bulkAddHint')}
        </label>
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-400">
          {t('bulkAddRules', { max: MAX_NAME, room: PLAYER_MAX - visible.length })}
        </p>
        <textarea
          id={bulkId}
          value={bulkText}
          onChange={(e) => {
            setBulkText(e.target.value)
            setBulkCheck(null)
          }}
          rows={8}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-base focus:border-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 dark:border-slate-700 dark:bg-slate-950 dark:focus:border-brand-300 dark:focus-visible:ring-brand-300"
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
        n >= MAX_NAME ? 'text-rose-700 dark:text-rose-300' : 'text-slate-600 dark:text-slate-400'
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

  const STATUS_PATCH = {
    ready: { active: true, resting: false },
    resting: { active: true, resting: true },
    absent: { active: false, resting: false },
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
      <div className="space-y-6">
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
              className="mt-1.5 block text-xs text-rose-700 dark:text-rose-300"
              role="alert"
            >
              {t(`name_${problem}`, { name: cleanName(current.name), max: MAX_NAME })}
            </span>
          )}
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium">{t('level')}</span>
          <div className="grid grid-cols-5 gap-1.5">
            {LEVEL_META.map((l) => {
              const picked = current.level === l.value
              return (
                <button
                  key={l.value}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => set({ level: l.value })}
                  className={cx(
                    'flex flex-col items-center rounded-xl border-(length:--line-w) px-1 pt-2.5 pb-2 text-center transition-colors duration-200',
                    FOCUS,
                    picked
                      ? 'border-transparent bg-pick text-pick-ink shadow-[var(--shadow-pick)]'
                      : 'border-edge text-slate-900 dark:text-slate-100'
                  )}
                >
                  <span className="flex gap-0.5" aria-hidden>
                    {LEVEL_META.map((x) => (
                      <span
                        key={x.value}
                        className={cx(
                          'h-1.5 w-1.5 rounded-full',
                          x.value <= l.value ? 'bg-current' : 'bg-current opacity-25'
                        )}
                      />
                    ))}
                  </span>
                  <span className="num mt-1.5 block text-lg">{l.code}</span>
                  <span className="mt-0.5 block text-xs leading-tight opacity-80">
                    {lang === 'en' ? l.en : l.th}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
            {levelLabel(current.level, lang)}
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">{t('gender')}</span>
          <Segmented
            value={current.gender === 'M' || current.gender === 'F' ? current.gender : '-'}
            onChange={(v) => set({ gender: v })}
            options={[
              {
                value: 'M',
                label: (
                  <span className="inline-flex items-center gap-2">
                    <GenderDot gender="M" />
                    {t('male')}
                  </span>
                ),
              },
              {
                value: 'F',
                label: (
                  <span className="inline-flex items-center gap-2">
                    <GenderDot gender="F" />
                    {t('female')}
                  </span>
                ),
              },
              { value: '-', label: t('unspecified') },
            ]}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">{t('present')}</span>
          <Segmented
            value={statusOf(current)}
            onChange={(v) => set(STATUS_PATCH[v])}
            options={['ready', 'resting', 'absent'].map((k) => ({
              value: k,
              label: t(STATUS_LABEL[k]),
            }))}
          />
        </div>
      </div>
    </Sheet>
  )
}
