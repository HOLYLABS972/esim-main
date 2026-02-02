import { collection, addDoc, serverTimestamp, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Submit affiliate program application - Auto-approves and generates link immediately
 * @param {Object} applicationData - Affiliate application data
 * @returns {Promise<Object>} - Application ID and affiliate link
 */
export async function submitAffiliateApplication(applicationData) {
  try {
    // Check if email already has an application
    const existingQuery = query(
      collection(db, 'affiliate_applications'),
      where('email', '==', applicationData.email)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      // Return existing application with its link
      const existingApp = existingSnapshot.docs[0];
      const existingData = existingApp.data();
      
      if (existingData.affiliateLink) {
        return {
          id: existingApp.id,
          affiliateLink: existingData.affiliateLink,
          isExisting: true
        };
      }
    }

    // Generate affiliate link with 25% discount
    const encodedEmail = encodeURIComponent(applicationData.email);
    const affiliateLink = `https://roamjet.onelink.me/Sc5I/1agbazop?utm_source=${encodedEmail}`;

    // Create new application - auto-approved
    const docRef = await addDoc(collection(db, 'affiliate_applications'), {
      ...applicationData,
      status: 'approved', // Auto-approve
      submittedAt: serverTimestamp(),
      reviewedAt: serverTimestamp(),
      reviewedBy: 'auto-approved',
      notes: 'Auto-approved on submission',
      affiliateCode: encodedEmail,
      affiliateLink: affiliateLink,
      discountPercent: 25,
    });

    return {
      id: docRef.id,
      affiliateLink: affiliateLink,
      isExisting: false
    };
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
 * Update application status
 */
export async function updateAffiliateApplicationStatus(applicationId, status, notes = '') {
  try {
    const appRef = doc(db, 'affiliate_applications', applicationId);
    await updateDoc(appRef, {
      status,
      reviewedAt: serverTimestamp(),
      notes
    });
    return true;
  } catch (error) {
    console.error('Error updating application status:', error);
    throw error;
  }
}

/**
 * Approve application and create AppsFlyer link
 */
export async function approveAffiliateApplication(application) {
  try {
    const encodedEmail = encodeURIComponent(application.email);
    const affiliateLink = `https://roamjet.onelink.me/Sc5I/1agbazop?utm_source=${encodedEmail}`;
    const appRef = doc(db, 'affiliate_applications', application.id);
    await updateDoc(appRef, {
      status: 'approved',
      reviewedAt: serverTimestamp(),
      affiliateLink: affiliateLink
    });
    return { success: true, affiliateLink };
  } catch (error) {
    console.error('Error approving application:', error);
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
