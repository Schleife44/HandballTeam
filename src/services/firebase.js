import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import { 
  initializeAuth, 
  indexedDBLocalPersistence, 
  browserLocalPersistence, 
  getAuth, 
  browserPopupRedirectResolver 
} from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.storageBucket) {
  console.warn('[Firebase] Warning: VITE_FIREBASE_STORAGE_BUCKET is missing. Profile picture uploads will hang!');
}

const app = initializeApp(firebaseConfig);

// Detect if running in Electron using our secure bridge flag
const isElectron = window.electronAPI?.isElectron === true;

// Enable persistence for offline support and massive read reduction
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    // Explicitly set a smaller cache size to prevent QuotaExceededErrors in some browsers
    cacheSizeBytes: 10 * 1024 * 1024 
  })
});

// For Electron, we use initializeAuth with a combination of persistence layers
export const auth = isElectron 
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver
    })
  : getAuth(app);

export const storage = getStorage(app);

export default app;
