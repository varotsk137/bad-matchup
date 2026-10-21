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
import { loadState, saveState } from './storage'

export function createLocalStore(initial = loadState()) {
  let state = initial
  let saveQueued = false
  const listeners = new Set()

  // several dispatches in one tick (a swap followed by its toast, say) are
  // written to localStorage once
  const save = () => {
    saveQueued = false
    saveState(state)
  }

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
