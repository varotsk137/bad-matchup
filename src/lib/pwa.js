/**
 * The app as an installable web app: the service worker and its "new
 * version" signal, the browser's install prompt, the launch-time connection
 * check, and a few facts about where the page is open (LINE's in-app
 * browser, iOS, already installed).
 *
 * The prompt and the update signal arrive as events at any time, so they
 * live in one small store the screens follow with useSyncExternalStore.
 */
import { registerSW } from 'virtual:pwa-register'

const FLAGS_KEY = 'bad-matchup:pwa'
const HOUR = 60 * 60 * 1000

let state = { installPrompt: null, installed: false, updateReady: false }
const listeners = new Set()
const set = (patch) => {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export const pwaStore = {
  subscribe: (l) => {
    listeners.add(l)
    return () => listeners.delete(l)
  },
  getState: () => state,
}

let updateSW = null

/** Called once, before the app renders, so no early event is missed. */
export function startPwa(win = window) {
  win.addEventListener('beforeinstallprompt', (e) => {
    // keep it for the invite bar and the Settings row instead of the browser's own banner
    e.preventDefault()
    set({ installPrompt: e })
  })
  win.addEventListener('appinstalled', () => set({ installPrompt: null, installed: true }))
  dropExternalBrowserParam(win)

  // the dev server has no service worker; `npm run build && npm run preview` does
  if (!import.meta.env.PROD || !('serviceWorker' in win.navigator)) return
  updateSW = registerSW({
    // a new version waits for the user's tap — never a reload mid-game
    onNeedRefresh: () => set({ updateReady: true }),
    onRegisteredSW: (_url, reg) => {
      // an installed app can stay open for days
      if (reg) setInterval(() => reg.update().catch(() => {}), HOUR)
    },
  })
}

/** Swaps in the waiting version and reloads. */
export const applyUpdate = () => updateSW?.(true)

/** Shows the browser's install dialog; true when the user said yes. */
export async function promptInstall() {
  const e = state.installPrompt
  if (!e) return false
  // a prompt can be shown only once
  set({ installPrompt: null })
  await e.prompt()
  const { outcome } = await e.userChoice
  if (outcome === 'accepted') set({ installed: true })
  return outcome === 'accepted'
}

/* ------------------------------------------------------------ connection */

/**
 * Whether the app's own server answers, asked once at launch and again from
 * the "try again" button. `navigator.onLine` only knows about a network
 * interface, not whether anything is reachable through it, and a captive
 * portal answers with its own page — hence the body check.
 */
export async function checkOnline({
  fetchImpl = globalThis.fetch,
  timeout = 3000,
  url = `${import.meta.env.BASE_URL}ping.txt`,
} = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeout)
  try {
    const res = await fetchImpl(`${url}?t=${Date.now()}`, {
      cache: 'no-store',
      signal: ctrl.signal,
    })
    return res.ok && (await res.text()).trim() === 'ok'
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/* ------------------------------------------------------- where it is open */

/** LINE's in-app browser, which marks its user agent with `Line/`. */
export const inLine = (ua = navigator.userAgent) => ua.includes('Line/')

/** iPhone and iPad, including iPads that report a Mac. */
export const isIos = (nav = navigator) =>
  /iPad|iPhone|iPod/.test(nav.userAgent) ||
  (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)

/** Opened from the home screen rather than in a browser tab. */
export const isStandalone = (win = window) =>
  win.matchMedia?.('(display-mode: standalone)').matches || win.navigator.standalone === true

/**
 * How "install" works here: 'installed' (nothing to do), 'line' (open in a
 * browser first), 'prompt' (the browser's own dialog), 'ios' (Add to Home
 * Screen by hand) or 'manual' (the browser's menu, if it can at all).
 */
export function installKind(s = state, win = window) {
  if (s.installed || isStandalone(win)) return 'installed'
  if (inLine(win.navigator.userAgent)) return 'line'
  if (s.installPrompt) return 'prompt'
  if (isIos(win.navigator)) return 'ios'
  return 'manual'
}

/** LINE opens a link in the phone's browser when it carries this parameter. */
export function openInBrowser(win = window) {
  const url = new URL(win.location.href)
  url.searchParams.set('openExternalBrowser', '1')
  win.location.replace(url.href)
}

/** Once out of LINE the parameter has done its job; keep the address clean. */
function dropExternalBrowserParam(win) {
  const url = new URL(win.location.href)
  if (inLine(win.navigator.userAgent) || !url.searchParams.has('openExternalBrowser')) return
  url.searchParams.delete('openExternalBrowser')
  win.history.replaceState(win.history.state, '', url.href)
}

/* ------------------------------------------------------- once per device */

/** Remembers that an invite was shown or a bar dismissed, for good. */
export function readFlag(name, storage = globalThis.localStorage) {
  try {
    return JSON.parse(storage.getItem(FLAGS_KEY) || '{}')[name] === true
  } catch {
    return false
  }
}

export function setFlag(name, storage = globalThis.localStorage) {
  try {
    const flags = JSON.parse(storage.getItem(FLAGS_KEY) || '{}')
    storage.setItem(FLAGS_KEY, JSON.stringify({ ...flags, [name]: true }))
  } catch {
    /* private mode: it may show again, which is harmless */
  }
}
