// src/config/firebase.js
// STRATEGY 5: Firestore Offline Persistence
// This enables local caching so repeat visits don't cost reads

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate config
const validateConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId'];
  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    console.error('❌ Missing Firebase config fields:', missingFields);
    console.error('Please check your environment variables.');
    // In development, show a helpful message
    if (import.meta.env.DEV || process.env.NODE_ENV === 'development') {
      console.warn(`
        Create a .env file in your project root with:
        
        VITE_FIREBASE_API_KEY=your_api_key
        VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
        VITE_FIREBASE_PROJECT_ID=your-project-id
        VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
        VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
        VITE_FIREBASE_APP_ID=your-app-id
      `);
    }
  }
};

validateConfig();

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
export const auth = getAuth(app);

// Initialize Firestore with persistence settings
// Using the newer API for better multi-tab support
let db;

try {
  // Modern approach (Firebase v9.8+): Use persistentLocalCache
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    }),
    experimentalAutoDetectLongPolling: true
  });
  console.log('✅ Firestore initialized with persistent cache (multi-tab)');
} catch (error) {
  // Fallback: Already initialized or older approach needed
  if (error.code === 'failed-precondition') {
    // Multiple tabs might be open - fall back to basic Firestore
    db = getFirestore(app);
    console.warn('⚠️ Firestore persistence limited - multiple tabs detected');
  } else if (error.code === 'unimplemented') {
    // Browser doesn't support persistence
    db = getFirestore(app);
    console.warn('⚠️ Firestore persistence not supported in this browser');
  } else {
    // Already initialized, just get the instance
    db = getFirestore(app);
    
    // Try legacy persistence method
    enableIndexedDbPersistence(db, { forceOwnership: false })
      .then(() => console.log('✅ Firestore offline persistence enabled (legacy)'))
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('⚠️ Persistence failed: Multiple tabs open');
        } else if (err.code === 'unimplemented') {
          console.warn('⚠️ Persistence not supported in this browser');
        } else {
          console.error('❌ Persistence error:', err);
        }
      });
  }
}

export { db };

// Initialize Storage
export const storage = getStorage(app);

// Export the app and config
export default app;
export { firebaseConfig };

/**
 * Utility: Check if we're reading from cache or server
 * Useful for debugging during development
 */
export const isFromCache = (snapshot) => {
  if (snapshot.metadata) {
    return snapshot.metadata.fromCache;
  }
  return false;
};

/**
 * Utility: Force fresh data from server (use sparingly!)
 * This bypasses cache when absolutely necessary
 */
export const getServerTimestamp = () => {
  const { serverTimestamp } = require('firebase/firestore');
  return serverTimestamp();
};