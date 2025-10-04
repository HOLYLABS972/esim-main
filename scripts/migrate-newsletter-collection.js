/**
 * Migration script to move newsletter subscriptions from 'newsletter' to 'newsletter_subscriptions' collection
 * Run this script once to migrate existing data and ensure consistency
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  where,
  serverTimestamp 
} = require('firebase/firestore');

// Firebase configuration - you may need to adjust this based on your setup
const firebaseConfig = {
  // Add your Firebase config here
  // This should match your existing Firebase configuration
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateNewsletterSubscriptions() {
  console.log('🚀 Starting newsletter collection migration...');
  
  try {
    // Get all documents from the old 'newsletter' collection
    const oldNewsletterRef = collection(db, 'newsletter');
    const oldNewsletterSnapshot = await getDocs(oldNewsletterRef);
    
    console.log(`📊 Found ${oldNewsletterSnapshot.size} documents in old 'newsletter' collection`);
    
    if (oldNewsletterSnapshot.size === 0) {
      console.log('✅ No documents to migrate. Migration complete.');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    
    // Process each document
    for (const doc of oldNewsletterSnapshot.docs) {
      const oldData = doc.data();
      const email = oldData.email;
      
      if (!email) {
        console.log(`⚠️ Skipping document ${doc.id} - no email field`);
        skippedCount++;
        continue;
      }
      
      // Check if email already exists in new collection
      const newCollectionRef = collection(db, 'newsletter_subscriptions');
      const existingQuery = query(newCollectionRef, where('email', '==', email));
      const existingSnapshot = await getDocs(existingQuery);
      
      if (existingSnapshot.size > 0) {
        console.log(`📧 Email ${email} already exists in new collection, skipping...`);
        skippedCount++;
        continue;
      }
      
      // Create new document in newsletter_subscriptions collection
      const newDocumentData = {
        email: email,
        status: 'active',
        source: 'migration', // Mark as migrated
        subscribedAt: oldData.timestamp || serverTimestamp(),
        updatedAt: serverTimestamp(),
        unsubscribedAt: null,
        tags: []
      };
      
      await addDoc(newCollectionRef, newDocumentData);
      console.log(`✅ Migrated: ${email}`);
      migratedCount++;
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`✅ Successfully migrated: ${migratedCount} subscriptions`);
    console.log(`⏭️ Skipped (already exists): ${skippedCount} subscriptions`);
    console.log(`📊 Total processed: ${migratedCount + skippedCount} subscriptions`);
    
    if (migratedCount > 0) {
      console.log('\n⚠️ IMPORTANT: After verifying the migration, you can safely delete the old "newsletter" collection.');
      console.log('💡 To delete the old collection, run: deleteOldNewsletterCollection()');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

async function deleteOldNewsletterCollection() {
  console.log('🗑️ Deleting old newsletter collection...');
  
  try {
    const oldNewsletterRef = collection(db, 'newsletter');
    const oldNewsletterSnapshot = await getDocs(oldNewsletterRef);
    
    console.log(`📊 Found ${oldNewsletterSnapshot.size} documents to delete`);
    
    // Note: You'll need to delete documents individually
    // This is a placeholder - you may want to use Firebase Admin SDK for bulk deletion
    console.log('⚠️ Manual deletion required. Use Firebase Admin SDK or Firebase Console to delete the old "newsletter" collection.');
    
  } catch (error) {
    console.error('❌ Error accessing old collection:', error);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateNewsletterSubscriptions()
    .then(() => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = {
  migrateNewsletterSubscriptions,
  deleteOldNewsletterCollection
};
