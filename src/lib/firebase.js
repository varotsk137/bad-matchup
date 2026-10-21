/**
 * Firebase, set up once. Only roomRemote.js imports this, and that file is
 * loaded on demand, so the SDK stays out of the main bundle.
 *
 * The project's web config comes from VITE_FIREBASE_* variables (see
 * .env.example): `.env.local` on a developer's machine, repository secrets
 * in the deploy workflow. These values only say which project to talk to —
 * they end up in the public bundle either way, and what protects the data is
 * firestore.rules — but keeping them out of the repository keeps it free of
 * anything that looks like a key.
 */

import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const env = import.meta.env

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

// A build without the config still works offline; opening or watching a room
// fails here, and the app says it could not reach the room.
if (!config.apiKey || !config.projectId) {
  throw new Error(
    'Firebase config missing: set the VITE_FIREBASE_* variables (see .env.example)'
  )
}

const app = initializeApp(config)

export const auth = getAuth(app)

// The cache lives in IndexedDB: a room opened once still shows with no
// signal, and writes made offline go out by themselves when it returns.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

// `npm run dev:emulator` works against `npm run emulators` (see .env.emulator)
if (env.VITE_FIREBASE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
