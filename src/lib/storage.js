import { DEFAULT_OPTIONS, DEFAULT_WEIGHTS, uid } from './matchmaker'

const KEY = 'bad-matchup:v1'

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
    version: 1,
    lang: 'th',
    theme: systemTheme(),
    players: [],
    courts: [
      { id: uid(), name: '1', type: 'doubles', enabled: true },
      { id: uid(), name: '2', type: 'doubles', enabled: true },
    ],
    rounds: [],
    // named player lists, so a regular group is one tap away next week
    rosters: [],
    weights: { ...DEFAULT_WEIGHTS },
    options: { ...DEFAULT_OPTIONS },
  }
}

export function loadState() {
  const base = defaultState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const saved = JSON.parse(raw)
    return {
      ...base,
      ...saved,
      // older saves could hold 'system' — pin it to whatever that means now
      theme: saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : systemTheme(),
      weights: { ...base.weights, ...(saved.weights || {}) },
      options: { ...base.options, ...(saved.options || {}) },
      players: Array.isArray(saved.players) ? saved.players : base.players,
      courts: Array.isArray(saved.courts) && saved.courts.length ? saved.courts : base.courts,
      rounds: Array.isArray(saved.rounds) ? saved.rounds : [],
      rosters: Array.isArray(saved.rosters) ? saved.rosters : [],
    }
  } catch {
    return base
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
        const base = defaultState()
        resolve({
          ...base,
          ...data,
          weights: { ...base.weights, ...(data.weights || {}) },
          options: { ...base.options, ...(data.options || {}) },
        })
      } catch (e) {
        reject(e)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
