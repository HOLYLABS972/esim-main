import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getRemoteConfig } from 'firebase/remote-config';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAl456JTQntXJItbXSv8hx1oQ9KW4BGci4",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "esim-f0e3e.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "esim-f0e3e",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "esim-f0e3e.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "482450515497",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:482450515497:web:5f15bfaf97b55221a39e38",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-T0YBW024Z8"
};

// Debug Firebase configuration in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Firebase Config Debug:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'NOT SET',
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    hasEnvVars: {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    }
  });
}

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw new Error(`Firebase initialization failed: ${error.message}`);
}

// Initialize Firebase services with error handling
export let auth, db, storage, functions, remoteConfig;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  functions = getFunctions(app, 'us-central1');
  
  // Initialize Remote Config (client-side only)
  if (typeof window !== 'undefined') {
    remoteConfig = getRemoteConfig(app);
    remoteConfig.settings = {
      minimumFetchIntervalMillis: 3600000, // 1 hour
    };
    // Set default values
    remoteConfig.defaultConfig = {
      stripe_mode: 'production',
      stripe_live_publishable_key: '',
      stripe_live_secret_key: ''
    };
    console.log('✅ Firebase Remote Config initialized');
  }
  
  console.log('✅ Firebase services initialized successfully');
} catch (error) {
  console.error('❌ Firebase services initialization error:', error);
  throw new Error(`Firebase services initialization failed: ${error.message}`);
}
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
