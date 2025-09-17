import { db } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

// Debug function to check referral transactions
export const debugReferralTransactions = async (userId) => {
  try {
    console.log('🔍 Debugging referral transactions for user:', userId);
    
    // Get user profile
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    console.log('👤 User profile:', userData);
    
    // Get user's referral code
    const referralCode = userData?.referralCode;
    console.log('🎁 User referral code:', referralCode);
    
    // Get referral code document
    if (referralCode) {
      const referralDoc = await getDoc(doc(db, 'referralCodes', referralCode));
      const referralData = referralDoc.data();
      console.log('📋 Referral code data:', referralData);
    }
    
    // Get all transactions for this user
    const transactionsSnapshot = await getDocs(
      collection(db, 'users', userId, 'transactions')
    );
    
    const transactions = transactionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('💰 All transactions:', transactions);
    
    // Filter referral transactions
    const referralTransactions = transactions.filter(t => 
      t.method === 'referral' || 
      t.description?.includes('Referral earnings') ||
      t.description?.includes('referral')
    );
    
    console.log('🎁 Referral transactions:', referralTransactions);
    
    // Get users who used this referral code
    if (referralCode) {
      const usersSnapshot = await getDocs(
        query(
          collection(db, 'users'),
          where('referredBy', '==', referralCode)
        )
      );
      
      const referredUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('👥 Users who used this referral code:', referredUsers);
    }
    
    return {
      userProfile: userData,
      referralCode: referralCode,
      referralData: referralCode ? (await getDoc(doc(db, 'referralCodes', referralCode))).data() : null,
      allTransactions: transactions,
      referralTransactions: referralTransactions,
      referredUsers: referralCode ? (await getDocs(query(collection(db, 'users'), where('referredBy', '==', referralCode)))).docs.map(doc => ({ id: doc.id, ...doc.data() })) : []
    };
    
  } catch (error) {
    console.error('❌ Error debugging referral transactions:', error);
    return { error: error.message };
  }
};

// Debug function to check all referral codes and their usage
export const debugAllReferralCodes = async () => {
  try {
    console.log('🔍 Debugging all referral codes...');
    
    // Get all referral codes
    const referralCodesSnapshot = await getDocs(collection(db, 'referralCodes'));
    const referralCodes = referralCodesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📋 All referral codes:', referralCodes);
    
    // Get all users who used referral codes
    const usersSnapshot = await getDocs(
      query(
        collection(db, 'users'),
        where('referredBy', '!=', null)
      )
    );
    
    const referredUsers = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('👥 All referred users:', referredUsers);
    
    return {
      referralCodes: referralCodes,
      referredUsers: referredUsers
    };
    
  } catch (error) {
    console.error('❌ Error debugging all referral codes:', error);
    return { error: error.message };
  }
};
