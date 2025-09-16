#!/usr/bin/env node

/**
 * Script to create the first super admin user
 * Usage: node scripts/create-super-admin.js <email>
 * 
 * This script should be run after a user has registered normally
 * to promote them to super admin status.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase config (you may need to adjust this based on your setup)
const firebaseConfig = {
  // Add your Firebase config here
  // This should match your src/firebase/config.js
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createSuperAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Check if user already exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('❌ User not found. Please make sure the user has registered first.');
      console.log('💡 Tip: User should register normally first, then run this script to promote them to super admin.');
      return false;
    }

    // Get the user document
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`👤 Found user: ${userData.displayName} (${userData.email})`);
    console.log(`🆔 User ID: ${userId}`);
    console.log(`📊 Current role: ${userData.role || 'customer'}`);

    // Update user role to super_admin
    await updateDoc(doc(db, 'users', userId), {
      role: 'super_admin',
      isSuperAdmin: true,
      adminPermissions: {
        canManageUsers: true,
        canManagePlans: true,
        canManageOrders: true,
        canViewAnalytics: true,
        canManageSettings: true
      },
      updatedAt: new Date()
    });

    console.log('✅ Super admin created successfully!');
    console.log('🎉 User can now access the admin panel at /admin');
    return true;
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    return false;
  }
}

// Main execution
async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('❌ Please provide an email address');
    console.log('Usage: node scripts/create-super-admin.js <email>');
    console.log('Example: node scripts/create-super-admin.js admin@example.com');
    process.exit(1);
  }

  console.log('🚀 Creating super admin...');
  const success = await createSuperAdmin(email);
  
  if (success) {
    console.log('🎊 Super admin setup complete!');
  } else {
    console.log('💥 Super admin setup failed!');
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
