import { db } from '../firebase/config';
import { collection, doc, getDoc, setDoc, updateDoc, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, increment, writeBatch } from 'firebase/firestore';

// Process referral when a user signs up with a referral code
export const processReferralUsage = async (referralCode, newUserId) => {
  try {
    console.log('🎁 Processing referral usage for code:', referralCode);
    
    // Check if user has already used a referral code
    const userDoc = await getDoc(doc(db, 'users', newUserId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.referralCodeUsed) {
        console.log('❌ User has already used a referral code');
        return { success: false, error: 'You have already used a referral code' };
      }
    }
    
    // Get the referral code document
    const referralDoc = await getDoc(doc(db, 'referralCodes', referralCode));
    
    if (!referralDoc.exists()) {
      console.log('❌ Referral code not found:', referralCode);
      return { success: false, error: 'Referral code not found' };
    }
    
    const referralData = referralDoc.data();
    const referrerId = referralData.ownerId;
    
    if (!referrerId) {
      console.log('❌ No owner found for referral code:', referralCode);
      return { success: false, error: 'Invalid referral code' };
    }
    
    // Check if code is active
    if (!referralData.isActive) {
      console.log('❌ Referral code is not active:', referralCode);
      return { success: false, error: 'Referral code is not active' };
    }
    
    // Check if code has expired
    const expiryDate = referralData.expiryDate;
    if (expiryDate && expiryDate.toDate() < new Date()) {
      console.log('❌ Referral code has expired:', referralCode);
      return { success: false, error: 'Referral code has expired' };
    }
    
    // Don't allow self-referral
    if (referrerId === newUserId) {
      console.log('❌ Self-referral not allowed');
      return { success: false, error: 'Self-referral not allowed' };
    }
    
    // Use a transaction to ensure atomicity
    const batch = writeBatch(db);
    
    console.log('💰 Creating transaction for referrer:', referrerId, 'amount: $1.00');
    
    // Update referral code stats
    const referralCodeRef = doc(db, 'referralCodes', referralCode);
    batch.update(referralCodeRef, {
      usageCount: increment(1),
      lastUsed: serverTimestamp(),
    });
    
    // Create transaction for referral usage (like mobile app - subcollection)
    const transactionRef = doc(collection(db, 'users', referrerId, 'transactions'));
    batch.set(transactionRef, {
      type: 'deposit', // Positive transaction like mobile app
      amount: 1.0, // $1 per referral
      description: `Referral earnings from code ${referralCode}`,
      status: 'completed',
      method: 'referral',
      referralCode: referralCode,
      referredUserId: newUserId,
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    
    console.log('💳 Committing batch transaction...');
    await batch.commit();
    console.log('✅ Batch transaction committed successfully');
    
    console.log('✅ Referral usage processed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error processing referral usage:', error);
    return { success: false, error: error.message };
  }
};

// Get referral statistics for a user
export const getReferralStats = async (userId) => {
  try {
    // Get user's referral code
    const userDoc = await getDoc(doc(db, 'users', userId));
    const referralCode = userDoc.data()?.referralCode;
    
    if (!referralCode) {
      return {
        referralCode: null,
        usageCount: 0,
        recentUsages: [],
        totalEarnings: 0,
        expiryDate: null,
      };
    }
    
    // Get referral code stats
    const referralDoc = await getDoc(doc(db, 'referralCodes', referralCode));
    
    if (!referralDoc.exists()) {
      return {
        referralCode: referralCode,
        usageCount: 0,
        recentUsages: [],
        totalEarnings: 0,
        expiryDate: null,
      };
    }
    
    const referralData = referralDoc.data();
    
    // Get recent earnings from transactions (subcollection like mobile app)
    const earningsSnapshot = await getDocs(
      query(
        collection(db, 'users', userId, 'transactions'),
        where('type', '==', 'deposit'),
        orderBy('timestamp', 'desc'),
        limit(10)
      )
    );
    
    const recentUsages = earningsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    }));
    
    // Calculate total earnings from transactions
    const totalEarnings = recentUsages.reduce((sum, usage) => sum + (usage.amount || 0), 0);
    
    return {
      referralCode: referralCode,
      usageCount: referralData.usageCount || 0,
      recentUsages: recentUsages,
      totalEarnings: totalEarnings,
      expiryDate: referralData.expiryDate?.toDate() || null,
      isActive: referralData.isActive || false,
    };
    
  } catch (error) {
    console.error('Error getting referral stats:', error);
    return {
      referralCode: null,
      usageCount: 0,
      recentUsages: [],
      totalEarnings: 0,
      expiryDate: null,
      error: error.message,
    };
  }
};

// Check if a referral code is valid
export const isValidReferralCode = async (code) => {
  try {
    const docRef = await getDoc(doc(db, 'referralCodes', code.toUpperCase()));
    
    if (!docRef.exists()) return false;
    
    const data = docRef.data();
    const isActive = data.isActive || false;
    
    // Check if code has expired
    const expiryDate = data.expiryDate;
    const isNotExpired = !expiryDate || expiryDate.toDate() > new Date();
    
    return isActive && isNotExpired;
  } catch (error) {
    console.error('Error checking referral code validity:', error);
    return false;
  }
};

// Check if user has already used a referral code
export const hasUserUsedReferralCode = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) return false;
    
    const userData = userDoc.data();
    return userData.referralCodeUsed || false;
  } catch (error) {
    console.error('Error checking if user has used referral code:', error);
    return false;
  }
};

// Generate a unique referral code
export const generateUniqueReferralCode = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  let attempts = 0;
  
  do {
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[(Date.now() + i + attempts) % chars.length];
    }
    
    // Check if code already exists
    const existing = await getDoc(doc(db, 'referralCodes', code));
    isUnique = !existing.exists();
    attempts++;
    
    if (attempts > 10) {
      // Fallback to timestamp-based code
      code = `REF${Date.now() % 100000000}`;
      break;
    }
  } while (!isUnique);
  
  return code;
};

// Create a new referral code for a user
export const createReferralCode = async (userId, userEmail) => {
  try {
    // Generate new referral code
    const referralCode = await generateUniqueReferralCode();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 2); // Exactly 2 months
    
    // Create referral code document
    await setDoc(doc(db, 'referralCodes', referralCode), {
      code: referralCode,
      ownerId: userId,
      ownerEmail: userEmail,
      createdAt: serverTimestamp(),
      expiryDate: expiryDate,
      isActive: true,
      usageCount: 0,
      totalEarnings: 0.0,
    });
    
    // Update user document with new code
    await updateDoc(doc(db, 'users', userId), {
      referralCode: referralCode,
      referralCodeExpiryDate: expiryDate,
      updatedAt: serverTimestamp(),
    });
    
    console.log('✅ Generated new referral code:', referralCode, '(expires:', expiryDate.toString(), ')');
    return { success: true, referralCode, expiryDate };
  } catch (error) {
    console.error('Error creating referral code:', error);
    return { success: false, error: error.message };
  }
};

// Update referral earnings (called when referred user makes a purchase)
export const updateReferralEarnings = async (referralCode, amount = 1.0) => {
  try {
    const referralCodeRef = doc(db, 'referralCodes', referralCode);
    await updateDoc(referralCodeRef, {
      totalEarnings: increment(amount),
      lastEarning: serverTimestamp(),
    });
    
    console.log('✅ Updated referral earnings for code:', referralCode, 'amount:', amount);
    return { success: true };
  } catch (error) {
    console.error('Error updating referral earnings:', error);
    return { success: false, error: error.message };
  }
};

// Get all referral codes (for admin)
export const getAllReferralCodes = async () => {
  try {
    const snapshot = await getDocs(
      query(
        collection(db, 'referralCodes'),
        orderBy('createdAt', 'desc')
      )
    );
    
    const referralCodes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      expiryDate: doc.data().expiryDate?.toDate() || null,
    }));
    
    return { success: true, referralCodes };
  } catch (error) {
    console.error('Error getting all referral codes:', error);
    return { success: false, error: error.message };
  }
};

// Get referral usage statistics (for admin)
export const getReferralUsageStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'referralUsages'));
    const usages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    }));
    
    const totalUsages = usages.length;
    const uniqueReferrers = new Set(usages.map(u => u.referrerId)).size;
    const totalEarnings = usages.reduce((sum, usage) => sum + (usage.earnings || 0), 0);
    
    return {
      success: true,
      stats: {
        totalUsages,
        uniqueReferrers,
        totalEarnings,
        recentUsages: usages.slice(0, 10), // Last 10 usages
      }
    };
  } catch (error) {
    console.error('Error getting referral usage stats:', error);
    return { success: false, error: error.message };
  }
};
