// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAl456JTQntXJItbXSv8hx1oQ9KW4BGci4",
  authDomain: "esim-f0e3e.firebaseapp.com",
  projectId: "esim-f0e3e",
  storageBucket: "esim-f0e3e.firebasestorage.app",
  messagingSenderId: "482450515497",
  appId: "1:482450515497:web:5f15bfaf97b55221a39e38",
  measurementId: "G-SZDJF30GC8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Storage
export const storage = getStorage(app);

// Re-export all Firestore functions that services need
export {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  setDoc,
  Timestamp
} from 'firebase/firestore';

// Re-export Storage functions
export {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

