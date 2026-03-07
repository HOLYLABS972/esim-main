/**
 * Firebase Admin for API routes (server-side).
 * Used to verify Firebase ID tokens and access Firestore.
 * Set FIREBASE_SERVICE_ACCOUNT_KEY to a JSON string of your service account key.
 */
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let auth = null;
let firestore = null;

function getFirebaseAdmin() {
  if (getApps().length === 0) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (key) {
      try {
        const serviceAccount = typeof key === 'string' ? JSON.parse(key) : key;
        initializeApp({ credential: cert(serviceAccount) });
      } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY');
      }
    } else {
      initializeApp();
    }
  }
  return { auth: getAuth(), firestore: getFirestore() };
}

export function getFirebaseAuth() {
  if (!auth) ({ auth } = getFirebaseAdmin());
  return auth;
}

export function getFirebaseFirestore() {
  if (!firestore) ({ firestore } = getFirebaseAdmin());
  return firestore;
}
