import { DEFAULT_OPTIONS, DEFAULT_WEIGHTS, uid } from './matchmaker'
import { DEFAULT_SKIN, isSkin } from './skins'

const KEY = 'bad-matchup:v1'

/**
 * Shape of the saved data. Bump it together with an entry in MIGRATIONS
 * whenever a change would misread data saved by an older version.
 */
export const SCHEMA_VERSION = 1

/**
 * Upgrades, keyed by the version they upgrade *from*: `MIGRATIONS[1]` turns a
 * version 1 save into version 2. They run in order, so a save several versions
 * behind walks every step. Each one takes the raw saved object and returns it
 * in the next shape; filling in missing fields is left to `hydrate`.
 */
const MIGRATIONS = {}

/**
 * Which part of the state is the session itself (who plays, where, and the
 * schedule) and which part belongs to this device alone. A shared room only
 * ever carries the first group; language, looks and saved lists stay put.
 */
export const SESSION_KEYS = ['players', 'courts', 'rounds', 'options', 'weights']
export const DEVICE_KEYS = ['lang', 'theme', 'skin', 'rosters', 'presets']

/**
 * The system preference decides the *initial* theme and nothing after that.
 * Once someone has a stored preference the app stops following the OS, so
 * flipping the phone into night mode never overrides a deliberate choice.
 */
export function systemTheme() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function defaultState() {
  return {
    version: SCHEMA_VERSION,
    lang: 'th',
    theme: systemTheme(),
    skin: DEFAULT_SKIN,
    players: [],
    courts: [
      { id: uid(), name: '1', type: 'doubles', enabled: true },
      { id: uid(), name: '2', type: 'doubles', enabled: true },
    ],
    rounds: [],
    // named player lists, so a regular group is one tap away next week
    rosters: [],
    // named settings + courts, e.g. "Tuesday, 2 courts, flexible rests"
    presets: [],
    weights: { ...DEFAULT_WEIGHTS },
    options: { ...DEFAULT_OPTIONS },
  }
}

/** Settings from older versions that no longer exist get a sensible stand-in. */
function migrateOptions(options) {
  // v2 dropped rotation mode — balanced covers what it did, and more
  return options.mode === 'rotation' ? { ...options, mode: 'balanced' } : options
}

/** Runs every migration between the save's version and this one. */
function migrate(saved) {
  let data = saved
  let from = Number.isInteger(data.version) ? data.version : 1
  while (from < SCHEMA_VERSION) {
    const step = MIGRATIONS[from]
    if (step) data = step(data)
    from += 1
  }
  // data from a newer app keeps its version, so that app does not upgrade it twice
  return { ...data, version: Math.max(from, SCHEMA_VERSION) }
}

/**
 * Turns anything that was saved — by this version, an older one, or an
 * imported backup — into a complete, current state. Missing or malformed
 * parts fall back to the defaults instead of breaking the app.
 */
export function hydrate(saved) {
  const base = defaultState()
  if (!saved || typeof saved !== 'object') return base
  const data = migrate(saved)
  return {
    ...base,
    ...data,
    // older saves could hold 'system' — pin it to whatever that means now
    theme: data.theme === 'light' || data.theme === 'dark' ? data.theme : systemTheme(),
    skin: isSkin(data.skin) ? data.skin : DEFAULT_SKIN,
    weights: { ...base.weights, ...(data.weights || {}) },
    options: migrateOptions({ ...base.options, ...(data.options || {}) }),
    players: Array.isArray(data.players) ? data.players : base.players,
    courts: Array.isArray(data.courts) && data.courts.length ? data.courts : base.courts,
    rounds: Array.isArray(data.rounds) ? data.rounds : [],
    rosters: Array.isArray(data.rosters) ? data.rosters : [],
    presets: Array.isArray(data.presets) ? data.presets : [],
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    return hydrate(raw ? JSON.parse(raw) : null)
  } catch {
    return defaultState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    return true
  } catch {
    // quota full or private mode — the app keeps working, just not persisted
    return false
  }
}

export function clearState() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
  const a = document.createElement('a')
  a.href = url
  a.download = `bad-matchup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function importState(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (!data || typeof data !== 'object' || !Array.isArray(data.players))
          throw new Error('bad file')
        resolve(hydrate(data))
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
