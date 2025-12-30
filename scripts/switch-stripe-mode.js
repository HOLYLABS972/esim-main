/**
 * Script to switch Stripe mode between sandbox/test and production
 * 
 * Usage:
 *   node scripts/switch-stripe-mode.js production
 *   node scripts/switch-stripe-mode.js sandbox
 *   node scripts/switch-stripe-mode.js test
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, doc, setDoc } = require('firebase-admin/firestore');

// Get mode from command line argument
const mode = process.argv[2];

if (!mode) {
  console.error('❌ Please provide a mode: production, sandbox, or test');
  console.log('Usage: node scripts/switch-stripe-mode.js <mode>');
  process.exit(1);
}

const validModes = ['production', 'live', 'sandbox', 'test'];
if (!validModes.includes(mode.toLowerCase())) {
  console.error(`❌ Invalid mode: ${mode}`);
  console.log('Valid modes: production, live, sandbox, test');
  process.exit(1);
}

// Normalize mode
const normalizedMode = mode.toLowerCase() === 'live' ? 'production' : mode.toLowerCase();

async function switchMode() {
  try {
    // Initialize Firebase Admin
    let app;
    try {
      app = initializeApp();
    } catch (error) {
      // App might already be initialized
      if (error.code !== 'app/already-initialized') {
        // Try with service account if available
        const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        if (serviceAccountKey) {
          const serviceAccount = JSON.parse(serviceAccountKey);
          app = initializeApp({
            credential: cert(serviceAccount)
          });
        } else {
          // Use default credentials (for Vercel/Cloud Run)
          app = initializeApp();
        }
      }
    }

    const db = getFirestore();
    const configRef = doc(db, 'config', 'stripe');

    // Get current config to preserve other fields
    const currentDoc = await configRef.get();
    const currentData = currentDoc.exists() ? currentDoc.data() : {};

    // Update mode
    const updatedData = {
      ...currentData,
      mode: normalizedMode,
      updatedAt: new Date().toISOString()
    };

    await setDoc(configRef, updatedData, { merge: true });

    console.log(`✅ Successfully switched Stripe mode to: ${normalizedMode}`);
    console.log(`📝 Updated Firestore document: config/stripe`);
    console.log(`\nCurrent configuration:`);
    console.log(JSON.stringify(updatedData, null, 2));
    
    console.log(`\n⚠️  Note: You may need to refresh your browser to see the changes.`);
    console.log(`   The app will reload Stripe with the new mode on next page load.`);

  } catch (error) {
    console.error('❌ Error switching mode:', error);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set in environment variables');
    console.error('2. Or ensure you have Firebase Admin SDK credentials configured');
    console.error('3. Check that you have write permissions to Firestore');
    process.exit(1);
  }
}

switchMode();

