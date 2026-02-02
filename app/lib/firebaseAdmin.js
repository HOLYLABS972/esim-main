/**
 * Firebase Admin SDK initialization for API routes.
 * Supports FIREBASE_SERVICE_ACCOUNT_KEY (JSON) or separate env vars.
 */
import admin from 'firebase-admin';

let _db = null;

function initFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // Try FIREBASE_SERVICE_ACCOUNT_KEY first (JSON string)
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const serviceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      return admin.app();
    } catch (e) {
      console.error('Firebase Admin: Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON:', e.message);
    }
  }

  // Fallback to separate env vars
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'esim-f0e3e';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      return admin.app();
    } catch (e) {
      console.error('Firebase Admin: Init with cert failed:', e.message);
    }
  }

  // Try application default (GOOGLE_APPLICATION_CREDENTIALS)
  try {
    admin.initializeApp();
    return admin.app();
  } catch (e) {
    console.error('Firebase Admin: No credentials available:', e.message);
    return null;
  }
}

/**
 * Get Firestore instance. Returns null if Firebase Admin is not configured.
 */
export function getFirestore() {
  if (_db) return _db;
  const app = initFirebaseAdmin();
  if (!app) return null;
  _db = admin.firestore();
  return _db;
}

/**
 * Get Firebase Admin app.
 */
export function getAdminApp() {
  return admin.apps.length > 0 ? admin.app() : initFirebaseAdmin();
}

/**
 * Get Firebase Auth instance. Returns null if Firebase Admin is not configured.
 */
export function getAuth() {
  const app = getAdminApp();
  return app ? admin.auth() : null;
}
