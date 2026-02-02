import { db } from '../firebase/config';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

export async function getAllApiClients() {
  try {
    const clients = [];
    try {
      const clientsRef = collection(db, 'api_clients');
      const q = query(clientsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => {
        const data = d.data();
        clients.push({
          id: d.id,
          businessName: data.businessName,
          contactEmail: data.contactEmail,
          contactName: data.contactName,
          balance: data.balance || 0,
          status: data.status,
          tier: data.tier || 'business',
          totalRequests: data.totalRequests || 0,
          usageLimit: data.usageLimit,
          apiKey: data.apiKey || 'N/A',
          apiMode: data.apiMode || 'production',
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
          lastRequestAt: data.lastRequestAt?.toDate?.() || null,
          lastTransactionAt: data.lastTransactionAt?.toDate?.() || null,
          source: 'api_clients'
        });
      });
    } catch (error) {
      console.log('No api_clients collection or error:', error.message);
    }
    try {
      const businessUsersRef = collection(db, 'business_users');
      const q2 = query(businessUsersRef, orderBy('createdAt', 'desc'));
      const snapshot2 = await getDocs(q2);
      snapshot2.forEach((d) => {
        const data = d.data();
        clients.push({
          id: d.id,
          businessName: data.companyName,
          contactEmail: data.email,
          contactName: data.kycData?.fullName || data.companyName,
          balance: data.balance || 0,
          status: data.emailVerified ? 'active' : 'pending',
          tier: data.kycStatus === 'approved' ? 'verified' : 'basic',
          totalRequests: data.totalApiRequests || 0,
          usageLimit: null,
          apiKey: data.apiCredentials?.apiKey || 'N/A',
          apiMode: data.apiCredentials?.mode || 'sandbox',
          kycStatus: data.kycStatus,
          commissionPercentage: data.commissionPercentage ?? 50,
          kycData: data.kycData ? {
            fullName: data.kycData.fullName,
            phoneNumber: data.kycData.phoneNumber,
            country: data.kycData.country,
            dateOfBirth: data.kycData.dateOfBirth,
            documentUrl: data.kycData.documentUrl,
            submittedAt: data.kycData.submittedAt?.toDate?.() || null
          } : null,
          kycApprovedAt: data.kycApprovedAt?.toDate?.() || null,
          kycRejectedAt: data.kycRejectedAt?.toDate?.() || null,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          lastRequestAt: data.lastTransactionAt?.toDate?.() || null,
          lastTransactionAt: data.lastTransactionAt?.toDate?.() || null,
          source: 'business_users'
        });
      });
    } catch (error) {
      console.log('No business_users collection or error:', error.message);
    }
    clients.sort((a, b) => b.createdAt - a.createdAt);
    return clients;
  } catch (error) {
    console.error('Error getting API clients:', error);
    throw error;
  }
}

export async function getClientUsageStats(clientId, limitCount = 100) {
  try {
    const usageRef = collection(db, 'api_usage');
    const q1 = query(
      usageRef,
      where('clientId', '==', clientId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const q2 = query(
      usageRef,
      where('userId', '==', clientId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1).catch(() => ({ docs: [] })),
      getDocs(q2).catch(() => ({ docs: [] }))
    ]);
    const records = [];
    (snapshot1.docs || []).forEach((d) => {
      const data = d.data();
      records.push({
        id: d.id,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        metadata: data.metadata
      });
    });
    (snapshot2.docs || []).forEach((d) => {
      const data = d.data();
      records.push({
        id: d.id,
        endpoint: data.endpoint || data.packageName,
        method: data.method || 'POST',
        statusCode: data.status === 'completed' ? 200 : (data.status === 'failed' ? 500 : 202),
        responseTime: 0,
        timestamp: data.createdAt?.toDate?.() || new Date(),
        metadata: { mode: data.mode, amount: data.amount }
      });
    });
    const uniqueRecords = records.filter((record, index, self) =>
      index === self.findIndex((r) => r.id === record.id)
    );
    uniqueRecords.sort((a, b) => b.timestamp - a.timestamp);
    return uniqueRecords.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return [];
  }
}

export async function getClientTransactions(clientId, limitCount = 50) {
  try {
    const transactions = [];
    try {
      const transactionsRef = collection(db, 'api_transactions');
      const q = query(
        transactionsRef,
        where('clientId', '==', clientId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      snapshot.forEach((d) => {
        const data = d.data();
        transactions.push({
          id: d.id,
          type: data.type,
          amount: data.amount,
          previousBalance: data.previousBalance,
          newBalance: data.newBalance,
          metadata: data.metadata,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        });
      });
    } catch (error) {
      console.log('No api_transactions for this client');
    }
    try {
      const billingRef = collection(db, 'billing_transactions');
      const q2 = query(
        billingRef,
        where('userId', '==', clientId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot2 = await getDocs(q2);
      snapshot2.forEach((d) => {
        const data = d.data();
        transactions.push({
          id: d.id,
          type: data.type,
          amount: data.amount,
          previousBalance: data.previousBalance,
          newBalance: data.newBalance,
          metadata: data.metadata,
          description: data.description,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });
    } catch (error) {
      console.log('No billing_transactions for this user');
    }
    transactions.sort((a, b) => b.createdAt - a.createdAt);
    return transactions.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting transactions:', error);
    return [];
  }
}

export async function getAllUsageStats() {
  try {
    const usageRef = collection(db, 'api_usage');
    const q = query(usageRef, orderBy('timestamp', 'desc'), limit(1000));
    const snapshot = await getDocs(q);
    const stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      byClient: {},
      byEndpoint: {}
    };
    snapshot.forEach((d) => {
      const data = d.data();
      stats.totalRequests++;
      if (data.statusCode < 400) stats.successfulRequests++;
      else stats.failedRequests++;
      if (!stats.byClient[data.clientId]) {
        stats.byClient[data.clientId] = { total: 0, success: 0, failed: 0 };
      }
      stats.byClient[data.clientId].total++;
      if (data.statusCode < 400) stats.byClient[data.clientId].success++;
      else stats.byClient[data.clientId].failed++;
      const endpoint = data.endpoint || 'unknown';
      if (!stats.byEndpoint[endpoint]) stats.byEndpoint[endpoint] = 0;
      stats.byEndpoint[endpoint]++;
    });
    return stats;
  } catch (error) {
    console.error('Error getting all usage stats:', error);
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      byClient: {},
      byEndpoint: {}
    };
  }
}

export async function getAllTransactions(limitCount = 100) {
  try {
    const transactionsRef = collection(db, 'api_transactions');
    const q = query(transactionsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    const transactions = [];
    snapshot.forEach((d) => {
      const data = d.data();
      transactions.push({
        id: d.id,
        clientId: data.clientId,
        type: data.type,
        amount: data.amount,
        previousBalance: data.previousBalance,
        newBalance: data.newBalance,
        metadata: data.metadata,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
      });
    });
    return transactions;
  } catch (error) {
    console.error('Error getting all transactions:', error);
    return [];
  }
}

export async function getAllKycApplications() {
  try {
    const businessUsersRef = collection(db, 'business_users');
    const snapshot = await getDocs(businessUsersRef);
    const applications = [];
    snapshot.forEach((d) => {
      const data = d.data();
      if (data.kycData) {
        applications.push({
          id: d.id,
          userId: d.id,
          userEmail: data.email,
          fullName: data.kycData.fullName,
          country: data.kycData.country,
          phoneNumber: data.kycData.phoneNumber,
          dateOfBirth: data.kycData.dateOfBirth,
          documentUrl: data.kycData.documentUrl,
          status: data.kycStatus || 'pending',
          submittedAt: data.kycData.submittedAt?.toDate?.() || new Date(),
          businessName: data.companyName,
          apiKey: data.apiCredentials?.apiKey,
          apiMode: data.apiCredentials?.mode || 'sandbox',
          approvedAt: data.kycApprovedAt?.toDate?.() || null,
          rejectedAt: data.kycRejectedAt?.toDate?.() || null
        });
      }
    });
    applications.sort((a, b) => b.submittedAt - a.submittedAt);
    return applications;
  } catch (error) {
    console.error('Error getting KYC applications:', error);
    throw error;
  }
}

export async function approveKycApplication(userId) {
  try {
    const userRef = doc(db, 'business_users', userId);
    await updateDoc(userRef, {
      kycStatus: 'approved',
      kycApprovedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error approving KYC:', error);
    throw error;
  }
}

export async function rejectKycApplication(userId) {
  try {
    const userRef = doc(db, 'business_users', userId);
    await updateDoc(userRef, {
      kycStatus: 'rejected',
      kycRejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    throw error;
  }
}

export async function updateCommissionPercentage(userId, commissionPercentage) {
  try {
    if (commissionPercentage < 0 || commissionPercentage > 100) {
      throw new Error('Commission percentage must be between 0 and 100');
    }
    const userRef = doc(db, 'business_users', userId);
    await updateDoc(userRef, {
      commissionPercentage: Number(commissionPercentage),
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating commission percentage:', error);
    throw error;
  }
}
