'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useAdmin } from '../../../../src/contexts/AdminContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../../../../src/firebase/config';
import { getAllReferralCodes } from '../../../../src/services/referralService';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Gift, 
  DollarSign, 
  Activity, 
  CreditCard,
  RefreshCw,
  TrendingUp,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

const UserDetailsPage = () => {
  const { userId } = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { isAdmin, canManageAdmins } = useAdmin();
  
  // State Management
  const [user, setUser] = useState(null);
  const [referralCodes, setReferralCodes] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [bankAccount, setBankAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('referral-codes');
  
  // Redirect if not admin
  useEffect(() => {
    if (!isAdmin && !canManageAdmins) {
      router.push('/admin');
    }
  }, [isAdmin, canManageAdmins, router]);

  // Load user data
  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Load user document
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({
          id: userDoc.id,
          ...userData,
          createdAt: userData.createdAt?.toDate(),
        });
        
        // Load bank account if exists
        if (userData.bankAccount) {
          setBankAccount(userData.bankAccount);
        }
      }
      
      // Load referral codes for this user
      const codesResult = await getAllReferralCodes();
      if (codesResult.success) {
        const userCodes = codesResult.referralCodes.filter(code => code.ownerId === userId);
        setReferralCodes(userCodes);
      }
      
      // Load transactions for this user
      const transactionsSnapshot = await getDocs(
        query(
          collection(db, 'users', userId, 'transactions'),
          orderBy('timestamp', 'desc')
        )
      );
      
      const userTransactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      
      setTransactions(userTransactions);
      
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWithdrawalStatus = async (transactionId, newStatus) => {
    try {
      const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
      await updateDoc(transactionRef, {
        status: newStatus,
        processedAt: new Date(),
        processedBy: currentUser.email
      });
      
      toast.success(`Withdrawal request ${newStatus} successfully`);
      await loadUserData(); // Reload to show updated data
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      toast.error(`Error updating withdrawal status: ${error.message}`);
    }
  };

  const handleDeleteTransaction = async (transactionId, transactionDescription) => {
    if (!window.confirm(`Are you sure you want to delete this transaction?\n\n${transactionDescription}\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);
      await deleteDoc(transactionRef);
      
      toast.success('Transaction deleted successfully');
      await loadUserData(); // Reload to show updated data
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(`Error deleting transaction: ${error.message}`);
    }
  };

  if (!isAdmin && !canManageAdmins) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-4">The requested user could not be found.</p>
          <button
            onClick={() => router.push('/admin')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  // Sum all positive transactions (deposits and referral commissions)
  const totalEarnings = transactions
    .filter(t => t.type === 'deposit' || t.method === 'referral_commission')
    .reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const withdrawalRequests = transactions.filter(t => t.type === 'withdrawal' || t.method === 'withdrawal');
  const totalWithdrawals = withdrawalRequests.reduce((sum, request) => sum + (request.amount || 0), 0);
  const referralTransactions = transactions.filter(t => t.method === 'referral');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">User Details</h1>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.role === 'admin' || user.role === 'super_admin'
                  ? 'bg-red-100 text-red-800'
                  : user.role === 'moderator'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {user.role || 'user'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-2xl font-medium text-gray-700">
                {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-900">{user.email}</h2>
              <p className="text-gray-600">User ID: {user.id}</p>
              <p className="text-sm text-gray-500">
                Joined: {user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Referral Codes</p>
                <p className="text-2xl font-bold text-blue-600">{referralCodes.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Gift className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Withdrawn</p>
                <p className="text-2xl font-bold text-red-600">${totalWithdrawals.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'referral-codes', label: 'Referral Codes', icon: Gift },
                { id: 'transactions', label: 'Transactions', icon: Activity },
                { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
                { id: 'bank-details', label: 'Bank Details', icon: CreditCard }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Referral Codes Tab */}
            {activeTab === 'referral-codes' && (
              <div className="space-y-4">
                {referralCodes.length > 0 ? (
                  referralCodes.map((code, index) => (
                    <motion.div
                      key={code.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-sm font-medium text-blue-600 bg-white px-3 py-1 rounded-lg border border-gray-200">
                              {code.code}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              code.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {code.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>Created: {code.createdAt ? new Date(code.createdAt).toLocaleDateString() : 'N/A'}</div>
                          <div>Expires: {code.expiryDate ? new Date(code.expiryDate).toLocaleDateString() : 'Never'}</div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Referral Codes</h3>
                    <p className="text-gray-600">This user has not created any referral codes.</p>
                  </div>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {transactions.filter(t => t.type !== 'withdrawal' && t.method !== 'withdrawal').length > 0 ? (
                  transactions.filter(t => t.type !== 'withdrawal' && t.method !== 'withdrawal').map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === 'deposit' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.type}
                            </span>
                            <span className="text-sm text-gray-600">
                              {transaction.timestamp ? transaction.timestamp.toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Amount</p>
                              <p className={`text-lg font-semibold ${
                                transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.type === 'deposit' ? '+' : '-'}${transaction.amount?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>

                          {transaction.description && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Description</p>
                              <p className="text-sm text-gray-900">{transaction.description}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id, transaction.description || `${transaction.type} transaction`)}
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Transactions</h3>
                    <p className="text-gray-600">No transactions found for this user (excluding withdrawals).</p>
                  </div>
                )}
              </div>
            )}

            {/* Withdrawals Tab */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-4">
                {withdrawalRequests.length > 0 ? (
                  withdrawalRequests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              request.status === 'pending' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : request.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {request.status}
                            </span>
                            <span className="text-sm text-gray-600">
                              {request.timestamp ? request.timestamp.toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Withdrawal Amount</p>
                              <p className="text-lg font-semibold text-gray-900">${request.amount?.toFixed(2) || '0.00'}</p>
                            </div>
                          </div>

                          {request.description && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">Description</p>
                              <p className="text-sm text-gray-900">{request.description}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleUpdateWithdrawalStatus(request.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateWithdrawalStatus(request.id, 'rejected')}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {request.status !== 'pending' && (
                            <div className="text-sm text-gray-600">
                              {request.processedAt && <p>Processed: {new Date(request.processedAt).toLocaleDateString()}</p>}
                              {request.processedBy && <p>By: {request.processedBy}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Withdrawal Requests</h3>
                    <p className="text-gray-600">No withdrawal requests found for this user.</p>
                  </div>
                )}
              </div>
            )}

            {/* Bank Details Tab */}
            {activeTab === 'bank-details' && (
              <div>
                {bankAccount ? (
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Account Holder Name</p>
                        <p className="text-sm font-medium text-gray-900">{bankAccount.accountHolderName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Bank Name</p>
                        <p className="text-sm font-medium text-gray-900">{bankAccount.bankName || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Account Number</p>
                        <p className="text-sm font-medium text-gray-900">{bankAccount.accountNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Routing Number</p>
                        <p className="text-sm font-medium text-gray-900">{bankAccount.routingNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Branch Number</p>
                        <p className="text-sm font-medium text-gray-900">{bankAccount.branchNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Country</p>
                        <p className="text-sm font-medium text-gray-900">{bankAccount.country || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                        <p className="text-sm font-medium text-gray-900">{bankAccount.phoneNumber || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Added Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {bankAccount.addedAt?.toDate ? 
                            bankAccount.addedAt.toDate().toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Bank Account</h3>
                    <p className="text-gray-600">This user has not added bank account details.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;
