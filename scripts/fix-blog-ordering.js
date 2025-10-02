#!/usr/bin/env node

/**
 * Script to fix blog post ordering by ensuring all published posts have a publishedAt field
 * This script should be run once to migrate existing data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, serverTimestamp } = require('firebase/firestore');

// Initialize Firebase (you may need to adjust this based on your config)
const firebaseConfig = {
  // Add your Firebase config here or import from your config file
  // This should match your existing Firebase configuration
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixMissingPublishedAt() {
  try {
    console.log('🔍 Checking for blog posts missing publishedAt field...');
    
    const q = query(
      collection(db, 'blog_posts'),
      where('status', '==', 'published'),
      where('publishedAt', '==', null)
    );
    
    const snapshot = await getDocs(q);
    console.log(`📊 Found ${snapshot.docs.length} posts missing publishedAt field`);
    
    if (snapshot.docs.length === 0) {
      console.log('✅ All published posts already have publishedAt field!');
      return;
    }
    
    const batch = [];
    
    snapshot.docs.forEach(doc => {
      const postData = doc.data();
      console.log(`📝 Fixing post: "${postData.title}"`);
      
      // Set publishedAt to createdAt if it exists, otherwise use current timestamp
      const publishedAt = postData.createdAt || serverTimestamp();
      batch.push(updateDoc(doc.ref, { publishedAt }));
    });
    
    if (batch.length > 0) {
      await Promise.all(batch);
      console.log(`✅ Fixed ${batch.length} posts with missing publishedAt field`);
      console.log('🎉 Blog ordering should now work correctly!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing missing publishedAt fields:', error);
    process.exit(1);
  }
}

// Run the fix
fixMissingPublishedAt()
  .then(() => {
    console.log('🏁 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
