import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};


// const firebaseConfig = {
//   apiKey: "AIzaSyBg7o5TWmKdELQq53Ji8******",
//   authDomain: "little-lions-2cae7.firebaseapp.com",
//   projectId: "little-lions-2cae7",
//   storageBucket: "little-lions-2cae7.firebasestorage.app",
//   messagingSenderId: "1033644878508",
//   appId: "1:1033644878508:web:448b1c68247e9136410d09"
// };


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

export { firebaseConfig };

