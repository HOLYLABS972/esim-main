/**
 * Firebase Admin for API routes (server-side).
 * Uses dynamic import so firebase-admin is not loaded at build time (Vercel).
 * Set FIREBASE_SERVICE_ACCOUNT_KEY to a JSON string of your service account key.
 */
let auth = null;
let firestore = null;

async function getFirebaseAdmin() {
  if (auth && firestore) {
    return { auth, firestore };
  }
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');

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
  auth = getAuth();
  firestore = getFirestore();
  return { auth, firestore };
}

export async function getFirebaseAuth() {
  const admin = await getFirebaseAdmin();
  return admin.auth;
}

export async function getFirebaseFirestore() {
  const admin = await getFirebaseAdmin();
  return admin.firestore;
}
