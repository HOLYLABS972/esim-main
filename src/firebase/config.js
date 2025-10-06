import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAl456JTQntXJItbXSv8hx1oQ9KW4BGci4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "esim-f0e3e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "esim-f0e3e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "esim-f0e3e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "482450515497",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:482450515497:web:08533fb9536c8e6aa39e38",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-T0YBW024Z8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');
// Initialize Analytics only if supported
export let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
    console.log('✅ Firebase Analytics initialized');
  } else {
    console.log('⚠️ Firebase Analytics not supported in this environment');
  }
}).catch((error) => {
  console.log('⚠️ Firebase Analytics initialization failed:', error);
});

// Configure emulators for local development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Only connect to emulators in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Connecting to Firebase emulators...');
    
    // Uncomment these lines if you want to use Firebase emulators
    // import { connectAuthEmulator } from 'firebase/auth';
    // import { connectFirestoreEmulator } from 'firebase/firestore';
    // import { connectFunctionsEmulator } from 'firebase/functions';
    // import { connectStorageEmulator } from 'firebase/storage';
    
    // connectAuthEmulator(auth, 'http://localhost:9099');
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectFunctionsEmulator(functions, 'localhost', 5001);
    // connectStorageEmulator(storage, 'localhost', 9199);
  }
}

export default app;
