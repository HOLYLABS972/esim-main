/**
 * Firebase Admin Auth only (for token verification).
 * Optional: FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) and/or FIREBASE_PROJECT_ID.
 * If neither is set, getFirebaseAuth returns null until you configure them.
 */
let auth = null;
let projectId = null;
let initialized = false;

async function getFirebaseAdmin() {
  if (initialized) {
    return { auth, projectId };
  }
  initialized = true;

  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  let pid = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;

  if (!key && !pid) {
    return { auth: null, projectId: null };
  }

  const { initializeApp, getApps, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');

  if (getApps().length === 0) {
    if (key) {
      try {
        const serviceAccount = typeof key === 'string' ? JSON.parse(key) : key;
        pid = pid || serviceAccount.project_id || null;
        if (pid) {
          initializeApp({
            credential: cert(serviceAccount),
            projectId: pid,
          });
          projectId = pid;
        }
      } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
        return { auth: null, projectId: null };
      }
    }
    if (!getApps().length && pid) {
      try {
        initializeApp({ projectId: pid });
        projectId = pid;
      } catch (e) {
        console.error('Firebase Admin init failed:', e.message);
        return { auth: null, projectId: null };
      }
    }
  }

  if (getApps().length > 0) {
    auth = getAuth();
    if (!projectId) {
      projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || null;
    }
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
