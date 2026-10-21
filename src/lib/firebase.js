/**
 * Firebase, set up once. Only roomRemote.js imports this, and that file is
 * loaded on demand, so the SDK stays out of the main bundle.
 *
 * These values identify the project; they are not secrets. What protects the
 * data is firestore.rules.
 */

import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const app = initializeApp({
  apiKey: 'AIzaSyCcewpIsay-B0iOH-jkL2IcUeEZK8uXTyY',
  authDomain: 'bad-matchup.firebaseapp.com',
  projectId: 'bad-matchup',
  storageBucket: 'bad-matchup.firebasestorage.app',
  messagingSenderId: '659297827263',
  appId: '1:659297827263:web:3fd58341aaf8be7871c90a',
})

export const auth = getAuth(app)

// The cache lives in IndexedDB: a room opened once still shows with no
// signal, and writes made offline go out by themselves when it returns.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})

// `VITE_FIREBASE_EMULATOR=1 npm run dev` works against `firebase emulators:start`
if (import.meta.env.VITE_FIREBASE_EMULATOR) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
