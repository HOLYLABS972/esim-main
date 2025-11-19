/**
 * Script to fix country codes for existing orders in Firebase
 * Extracts correct country from Airalo package_id
 */

const admin = require('firebase-admin');
const path = require('path');

// Use the existing service account key from docker folder
const serviceAccountPath = path.join(__dirname, '../docker/sdk/esim-f0e3e-firebase-adminsdk-fbsvc-cc27060e04.json');
const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Comprehensive operator to country mapping (extracted from your Dashboard.jsx)
const operatorCountryMap = {
  // A
  'sohbat-mobile': { code: 'AF', name: 'Afghanistan' },
  'hej-telecom': { code: 'AL', name: 'Albania' },
  'algecom': { code: 'DZ', name: 'Algeria' },
  'handi': { code: 'AD', name: 'Andorra' },
  'dolphin-mobile': { code: 'AI', name: 'Anguilla' },
  '17-miles': { code: 'AG', name: 'Antigua And Barbuda' },
  '17miles': { code: 'AG', name: 'Antigua And Barbuda' },
  'saba-mobile': { code: 'AN', name: 'Antilles' },
  'abrazo': { code: 'AR', name: 'Argentina' },
  'arpi-telecom': { code: 'AM', name: 'Armenia' },
  'noord-communications-in': { code: 'AW', name: 'Aruba' },
  'yes-go': { code: 'AU', name: 'Australia' },
  'viennetz-mobil': { code: 'AT', name: 'Austria' },
  'yaxsi-mobile': { code: 'AZ', name: 'Azerbaijan' },
  'pico': { code: 'PT', name: 'Azores' },
  'jitney-mobile': { code: 'BS', name: 'Bahamas' },
  'saar-mobile': { code: 'BH', name: 'Bahrain' },
  'fatafati-in': { code: 'BD', name: 'Bangladesh' },
  'barbnet': { code: 'BB', name: 'Barbados' },
  'norach-telecom': { code: 'BY', name: 'Belarus' },
  'belganet': { code: 'BE', name: 'Belgium' },
  'cho': { code: 'BZ', name: 'Belize' },
  'cotton-mobile': { code: 'BJ', name: 'Benin' },
  'bermy-mobile': { code: 'BM', name: 'Bermuda' },
  'paro': { code: 'BT', name: 'Bhutan' },
  'wa-mobile': { code: 'BO', name: 'Bolivia' },
  // ... Add more as needed
  
  // Egypt (your specific case)
  'giza-mobile': { code: 'EG', name: 'Egypt' },
  'nile-mobile': { code: 'EG', name: 'Egypt' },
  
  // Common ones
  'change': { code: 'US', name: 'United States' },
  'kargi': { code: 'GE', name: 'Georgia' },
  'roamify': { code: 'AE', name: 'United Arab Emirates' },
  'turk-telecom': { code: 'TR', name: 'Turkey' },
};

// Extract operator slug from package_id
function getOperatorFromPackageId(packageId) {
  if (!packageId) return null;
  
  // Most Airalo package IDs follow pattern: "operator-duration-data"
  // e.g., "giza-mobile-15days-2gb" -> "giza-mobile"
  const parts = packageId.split('-');
  
  // Try 2-word operator first (e.g., "giza-mobile")
  if (parts.length >= 2) {
    const twoWord = `${parts[0]}-${parts[1]}`;
    if (operatorCountryMap[twoWord]) {
      return twoWord;
    }
  }
  
  // Try 1-word operator (e.g., "change", "roamify")
  if (parts.length >= 1 && operatorCountryMap[parts[0]]) {
    return parts[0];
  }
  
  return null;
}

// Get country from package_id
function getCountryFromPackageId(packageId) {
  const operator = getOperatorFromPackageId(packageId);
  if (operator && operatorCountryMap[operator]) {
    return operatorCountryMap[operator];
  }
  return null;
}

async function fixCountries() {
  try {
    console.log('🚀 Starting country fix for all orders...\n');
    
    let totalOrders = 0;
    let updatedOrders = 0;
    let skippedOrders = 0;
    let failedOrders = 0;
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`📊 Found ${usersSnapshot.size} users\n`);
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n👤 Processing user: ${userId}`);
      
      // Get all esims for this user
      const esimsSnapshot = await db.collection('users').doc(userId).collection('esims').get();
      
      console.log(`  📱 Found ${esimsSnapshot.size} eSIMs`);
      
      for (const esimDoc of esimsSnapshot.docs) {
        totalOrders++;
        const esimId = esimDoc.id;
        const esimData = esimDoc.data();
        
        const currentCountry = esimData.countryCode;
        const packageId = esimData.planId || esimData.package_id || esimData.airaloOrderData?.package_id;
        
        console.log(`\n  📦 Order: ${esimId}`);
        console.log(`     Package: ${packageId}`);
        console.log(`     Current country: ${currentCountry} (${esimData.countryName})`);
        
        if (!packageId) {
          console.log(`     ⚠️  No package_id found, skipping`);
          skippedOrders++;
          continue;
        }
        
        // Try to get correct country
        const correctCountry = getCountryFromPackageId(packageId);
        
        if (!correctCountry) {
          console.log(`     ⚠️  Could not determine country from package_id, skipping`);
          skippedOrders++;
          continue;
        }
        
        // Check if update is needed
        if (currentCountry === correctCountry.code && esimData.countryName === correctCountry.name) {
          console.log(`     ✅ Country already correct, skipping`);
          skippedOrders++;
          continue;
        }
        
        // Update the order
        try {
          await db.collection('users').doc(userId).collection('esims').doc(esimId).update({
            countryCode: correctCountry.code,
            countryName: correctCountry.name,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            countryFixedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          
          console.log(`     ✅ Updated: ${currentCountry} → ${correctCountry.code} (${correctCountry.name})`);
          updatedOrders++;
        } catch (error) {
          console.log(`     ❌ Failed to update: ${error.message}`);
          failedOrders++;
        }
      }
    }
    
    // Also fix global orders collection
    console.log('\n\n📦 Fixing global orders collection...\n');
    const globalOrdersSnapshot = await db.collection('orders').get();
    console.log(`📊 Found ${globalOrdersSnapshot.size} global orders\n`);
    
    for (const orderDoc of globalOrdersSnapshot.docs) {
      totalOrders++;
      const orderId = orderDoc.id;
      const orderData = orderDoc.data();
      
      const currentCountry = orderData.countryCode;
      const packageId = orderData.planId || orderData.package_id || orderData.airaloOrderData?.package_id;
      
      console.log(`\n📦 Order: ${orderId}`);
      console.log(`   Package: ${packageId}`);
      console.log(`   Current country: ${currentCountry} (${orderData.countryName})`);
      
      if (!packageId) {
        console.log(`   ⚠️  No package_id found, skipping`);
        skippedOrders++;
        continue;
      }
      
      const correctCountry = getCountryFromPackageId(packageId);
      
      if (!correctCountry) {
        console.log(`   ⚠️  Could not determine country from package_id, skipping`);
        skippedOrders++;
        continue;
      }
      
      if (currentCountry === correctCountry.code && orderData.countryName === correctCountry.name) {
        console.log(`   ✅ Country already correct, skipping`);
        skippedOrders++;
        continue;
      }
      
      try {
        await db.collection('orders').doc(orderId).update({
          countryCode: correctCountry.code,
          countryName: correctCountry.name,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          countryFixedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`   ✅ Updated: ${currentCountry} → ${correctCountry.code} (${correctCountry.name})`);
        updatedOrders++;
      } catch (error) {
        console.log(`   ❌ Failed to update: ${error.message}`);
        failedOrders++;
      }
    }
    
    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total orders processed: ${totalOrders}`);
    console.log(`✅ Updated: ${updatedOrders}`);
    console.log(`⚠️  Skipped: ${skippedOrders}`);
    console.log(`❌ Failed: ${failedOrders}`);
    console.log('='.repeat(80));
    console.log('\n✅ Country fix complete!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing countries:', error);
    process.exit(1);
  }
}

// Run the fix
fixCountries();

