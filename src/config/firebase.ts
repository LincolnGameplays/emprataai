/**
 * 🔥 Firebase Configuration with Offline Persistence
 * 
 * ENTERPRISE FEATURES:
 * - Persistent local cache (works offline)
 * - Multi-tab synchronization
 * - Auto-sync when connection restores
 * 
 * This allows the app to continue working even without internet.
 * All writes are cached locally and pushed to cloud when online.
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ═══════════════════════════════════════════════════════════════════════════
// OFFLINE-FIRST: Firestore with Persistent Cache
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Initialize Firestore with persistent local cache.
 * 
 * BENEFITS:
 * - Reads work offline (cached data)
 * - Writes are queued locally when offline
 * - Auto-syncs when connection restores
 * - Multi-tab support (all tabs stay in sync)
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

// Log offline mode status
if (typeof window !== 'undefined') {
  console.log('🔥 [Firebase] Offline persistence enabled');
  
  // Track pending writes
  window.addEventListener('online', () => {
    console.log('🟢 [Firebase] Online - syncing pending writes...');
  });
  
  window.addEventListener('offline', () => {
    console.log('🔴 [Firebase] Offline - writes will be cached locally');
  });
}

// Initialize other services
export const auth = getAuth(app);
export const functions = getFunctions(app, 'southamerica-east1');

export default app;
