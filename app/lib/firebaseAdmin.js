/**
 * Firebase Admin Auth only (for token verification).
 * Does not load Firestore, so no @opentelemetry dependency in serverless.
 * Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or FIREBASE_PROJECT_ID.
 */
let auth = null;
let projectId = null;

async function getFirebaseAdmin() {
  if (auth) {
    return { auth, projectId };
  }
  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');

  if (getApps().length === 0) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    let pid = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
    if (key) {
      try {
        const serviceAccount = typeof key === 'string' ? JSON.parse(key) : key;
        pid = pid || serviceAccount.project_id;
        if (!pid) {
          throw new Error('Project ID not found in FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID');
        }
        initializeApp({
          credential: cert(serviceAccount),
          projectId: pid,
        });
        projectId = pid;
      } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY');
      }
    } else {
      if (!pid) {
        throw new Error('Set FIREBASE_PROJECT_ID or use FIREBASE_SERVICE_ACCOUNT_KEY');
      }
      initializeApp({ projectId: pid });
      projectId = pid;
    }
  }
  auth = getAuth();
  if (!projectId && getApps().length > 0) {
    projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  }
  return { auth, projectId };
}

export async function getFirebaseAuth() {
  const admin = await getFirebaseAdmin();
  return admin.auth;
}

export async function getFirebaseProjectId() {
  const admin = await getFirebaseAdmin();
  return admin.projectId;
}
