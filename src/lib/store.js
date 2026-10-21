/**
 * Where the app's data lives.
 *
 * A store has three parts: `getState`, `subscribe` (the pair React's
 * useSyncExternalStore wants) and `dispatch(opName, ...args)`, which runs one
 * of the named changes in ops.js. Screens only ever talk to that surface, so
 * the local store below can later sit next to one that keeps a session in a
 * shared room, without the screens changing.
 */

import { ops } from './ops'
import { STATE_KEY, loadState, saveState } from './storage'

/**
 * @param {object} [initial]
 * @param {EventTarget} [events] where another tab's saves are announced
 *   (`window`'s `storage` events in the app; leave it out to ignore them)
 */
export function createLocalStore(initial = loadState(), events = null) {
  let state = initial
  let saveQueued = false
  const listeners = new Set()

  // several dispatches in one tick (a swap followed by its toast, say) are
  // written to localStorage once
  const save = () => {
    saveQueued = false
    saveState(state)
  }

  // The app open in two tabs shares one localStorage but would otherwise keep
  // two copies in memory, and the staler one would win the next save — or,
  // running a live room, push an old schedule over the new one. So a save in
  // another tab becomes this tab's state too.
  events?.addEventListener('storage', (e) => {
    if (e.key !== STATE_KEY) return
    state = loadState()
    for (const listener of listeners) listener()
  })

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    dispatch(name, ...args) {
      const op = ops[name]
      if (!op) throw new Error(`Unknown op: ${name}`)
      const next = op(state, ...args)
      if (next === state) return
      state = next
      if (!saveQueued) {
        saveQueued = true
        queueMicrotask(save)
      }
      for (const listener of listeners) listener()
    },
  }
}
