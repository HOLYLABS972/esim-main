import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Submit affiliate program application
 * @param {Object} applicationData - Affiliate application data
 * @returns {Promise<string>} - Application ID
 */
export async function submitAffiliateApplication(applicationData) {
  try {
    // Check if email already has a pending or approved application
    const existingQuery = query(
      collection(db, 'affiliate_applications'),
      where('email', '==', applicationData.email)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      // Check if there's already a pending or approved application
      const existingApp = existingSnapshot.docs.find(doc => {
        const status = doc.data().status;
        return status === 'pending' || status === 'approved';
      });

      if (existingApp) {
        throw new Error('You already have an application in progress or approved.');
      }
    }

    // Create new application
    const docRef = await addDoc(collection(db, 'affiliate_applications'), {
      ...applicationData,
      status: 'pending', // pending, approved, rejected
      submittedAt: serverTimestamp(),
      reviewedAt: null,
      reviewedBy: null,
      notes: '',
      affiliateCode: null, // Will be generated upon approval
    });

    return docRef.id;
  } catch (error) {
    console.error('Error submitting affiliate application:', error);
    throw error;
  }
}

/**
 * Get all affiliate applications (admin only)
 * @param {string} status - Filter by status (optional)
 * @returns {Promise<Array>} - Array of applications
 */
export async function getAffiliateApplications(status = null) {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, 'affiliate_applications'),
        where('status', '==', status)
      );
    } else {
      q = query(collection(db, 'affiliate_applications'));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching affiliate applications:', error);
    throw error;
  }
}

/**
 * Check if user has an existing application
 * @param {string} email - User email
 * @returns {Promise<Object|null>} - Existing application or null
 */
export async function checkExistingApplication(email) {
  try {
    const q = query(
      collection(db, 'affiliate_applications'),
      where('email', '==', email)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }

    return null;
  } catch (error) {
    console.error('Error checking existing application:', error);
    throw error;
  }
}
