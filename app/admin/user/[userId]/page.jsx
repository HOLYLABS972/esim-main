'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { useAdmin } from '../../../../src/contexts/AdminContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, orderBy, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../../../src/firebase/config';
import { getAllReferralCodes, createReferralCode } from '../../../../src/services/referralService';
// import { motion } from 'framer-motion'; // Temporarily disabled to fix build error
import { 
  ArrowLeft, 
  User, 
  Gift, 
  DollarSign, 
  Activity, 
  CreditCard,
  RefreshCw,
  TrendingUp,
  Trash2,
  Plus,
  Copy,
  Eye,
  Smartphone,
  Edit,
  Users,
  Search,
  ChevronDown,
  Power
} from 'lucide-react';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

// Generate QR code from LPA data using qrcode library (same as dashboard)
const generateLPAQRCode = async (lpaData) => {
  try {
    if (!lpaData) return null;
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(lpaData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating LPA QR code:', error);
    return null;
  }
};

// LPA QR Code Display Component (same as dashboard)
const LPAQRCodeDisplay = ({ lpaData }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsGenerating(true);
        const qrUrl = await generateLPAQRCode(lpaData);
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    if (lpaData) {
      generateQR();
    }
  }, [lpaData]);

  if (isGenerating) {
    return (
      <div className="text-center">
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">Generating QR Code...</p>
      </div>
    );
  }

  if (qrCodeUrl) {
    return (
      <div className="text-center">
        <img 
          src={qrCodeUrl} 
          alt="eSIM LPA QR Code" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-full h-full flex items-center justify-center">
        <Smartphone className="w-32 h-32 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 mt-2">QR generation failed</p>
    </div>
  );
};

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
  const [activeTab, setActiveTab] = useState('user-data');
  const [showReferralCodeModal, setShowReferralCodeModal] = useState(false);
  const [customReferralName, setCustomReferralName] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [isEditingJoinedDate, setIsEditingJoinedDate] = useState(false);
  const [editedJoinedDate, setEditedJoinedDate] = useState('');
  const [esimOrders, setEsimOrders] = useState([]);
  const [loadingEsims, setLoadingEsims] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedEsimForReassign, setSelectedEsimForReassign] = useState(null);
  const [reassignUserSearch, setReassignUserSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedReassignUser, setSelectedReassignUser] = useState(null);
  
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

  // Load eSIMs when eSIMs tab is selected
  useEffect(() => {
    if (activeTab === 'esims' && userId) {
      loadEsimOrders();
    }
  }, [activeTab, userId]);

  // Load all users for reassignment dropdown
  useEffect(() => {
    if (showReassignModal) {
      loadAllUsers();
    }
  }, [showReassignModal]);

  // Filter users based on search
  useEffect(() => {
    if (reassignUserSearch.trim()) {
      const filtered = allUsers.filter(user => 
        user.email.toLowerCase().includes(reassignUserSearch.toLowerCase()) &&
        user.id !== userId // Exclude current user
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [reassignUserSearch, allUsers, userId]);

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

  // Load eSIM orders for this user
  const loadEsimOrders = async () => {
    try {
      setLoadingEsims(true);
      
      // Load eSIMs from users/{userId}/esims subcollection
      const esimOrdersSnapshot = await getDocs(
        query(
          collection(db, 'users', userId, 'esims'),
          orderBy('createdAt', 'desc')
        )
      );
      
      const userEsimOrders = esimOrdersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                     (data.createdAt ? new Date(data.createdAt) : null),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : 
                     (data.updatedAt ? new Date(data.updatedAt) : null),
          expiryDate: data.expiryDate?.toDate ? data.expiryDate.toDate() : 
                      (data.expiryDate ? new Date(data.expiryDate) : null),
        };
      });
      
      setEsimOrders(userEsimOrders);
      
    } catch (error) {
      console.error('Error loading eSIM orders:', error);
      toast.error('Failed to load eSIM orders');
    } finally {
      setLoadingEsims(false);
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

  // Referral code management functions
  const handleGenerateReferralCode = () => {
    if (!userId) {
      toast.error('User ID not available');
      return;
    }
    setCustomReferralName('');
    setShowReferralCodeModal(true);
  };

  const handleConfirmGenerateReferralCode = async () => {
    if (!customReferralName.trim()) {
      toast.error('Please enter a name for the referral code');
      return;
    }

    try {
      // Use custom name as the referral code
      const result = await createReferralCode(userId, userId, customReferralName.trim());
      if (result.success) {
        toast.success(`Generated new referral code: ${result.referralCode}`);
        await loadUserData(); // Reload to show new referral code
        setShowReferralCodeModal(false);
        setCustomReferralName('');
      } else {
        toast.error(`Failed to generate referral code: ${result.error}`);
      }
    } catch (error) {
      console.error('Error generating referral code:', error);
      toast.error('Failed to generate referral code');
    }
  };

  const handleRegenerateReferralCode = () => {
    if (!userId) {
      toast.error('User ID not available');
      return;
    }
    setCustomReferralName('');
    setShowReferralCodeModal(true);
  };

  const handleConfirmRegenerateReferralCode = async () => {
    if (!customReferralName.trim()) {
      toast.error('Please enter a name for the referral code');
      return;
    }

    try {
      // Use custom name as the referral code
      const result = await createReferralCode(userId, userId, customReferralName.trim());
      if (result.success) {
        toast.success(`Regenerated referral code: ${result.referralCode}`);
        await loadUserData();
        setShowReferralCodeModal(false);
        setCustomReferralName('');
      } else {
        toast.error(`Failed to regenerate referral code: ${result.error}`);
      }
    } catch (error) {
      console.error('Error regenerating referral code:', error);
      toast.error('Failed to regenerate referral code');
    }
  };

  const copyReferralCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Referral code copied to clipboard');
  };

  // Email editing functions
  const handleStartEditEmail = () => {
    setEditedEmail(user.email);
    setIsEditingEmail(true);
  };

  const handleCancelEditEmail = () => {
    setIsEditingEmail(false);
    setEditedEmail('');
  };

  const handleSaveEmail = async () => {
    if (!editedEmail.trim() || editedEmail === user.email) {
      handleCancelEditEmail();
      return;
    }

    try {
      // Update user email in Firestore
      await updateDoc(doc(db, 'users', userId), {
        email: editedEmail.trim()
      });
      
      // Update local state
      setUser(prev => ({ ...prev, email: editedEmail.trim() }));
      setIsEditingEmail(false);
      setEditedEmail('');
      
      toast.success('Email updated successfully');
    } catch (error) {
      console.error('Error updating email:', error);
      toast.error('Failed to update email');
    }
  };

  // Joined date editing functions
  const handleStartEditJoinedDate = () => {
    setEditedJoinedDate(user.createdAt ? user.createdAt.toISOString().split('T')[0] : '');
    setIsEditingJoinedDate(true);
  };

  const handleCancelEditJoinedDate = () => {
    setIsEditingJoinedDate(false);
    setEditedJoinedDate('');
  };

  const handleSaveJoinedDate = async () => {
    if (!editedJoinedDate.trim()) {
      handleCancelEditJoinedDate();
      return;
    }

    try {
      const newDate = new Date(editedJoinedDate);
      // Update user joined date in Firestore
      await updateDoc(doc(db, 'users', userId), {
        createdAt: newDate
      });
      
      // Update local state
      setUser(prev => ({ ...prev, createdAt: newDate }));
      setIsEditingJoinedDate(false);
      setEditedJoinedDate('');
      
      toast.success('Joined date updated successfully');
    } catch (error) {
      console.error('Error updating joined date:', error);
      toast.error('Failed to update joined date');
    }
  };

  // Delete eSIM order
  const handleDeleteEsimOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this eSIM order? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId, 'esims', orderId));
      toast.success('eSIM order deleted successfully');
      await loadEsimOrders(); // Reload the list
    } catch (error) {
      console.error('Error deleting eSIM order:', error);
      toast.error(`Error deleting eSIM order: ${error.message}`);
    }
  };

  // Load all users for reassignment
  const loadAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  // Handle reassign eSIM
  const handleReassignEsim = (order) => {
    setSelectedEsimForReassign(order);
    setShowReassignModal(true);
    setReassignUserSearch('');
    setSelectedReassignUser(null);
  };

  // Confirm reassignment
  const handleConfirmReassign = async () => {
    if (!selectedReassignUser || !selectedEsimForReassign) {
      toast.error('Please select a user to reassign to');
      return;
    }

    try {
      // Deactivate eSIM from current user instead of deleting it
      await setDoc(doc(db, 'users', userId, 'esims', selectedEsimForReassign.id), {
        status: 'deactivated',
        deactivatedAt: new Date(),
        deactivatedReason: 'reassigned',
        reassignedTo: selectedReassignUser.id,
        reassignedAt: new Date()
      }, { merge: true });
      
      // Add eSIM to new user's esims subcollection (not as a field in main document)
      // Preserve only the essential fields and convert timestamps properly
      const esimData = {
        // Core eSIM data
        id: selectedEsimForReassign.id,
        ...(selectedEsimForReassign.planId && { planId: selectedEsimForReassign.planId }),
        ...(selectedEsimForReassign.planName && { planName: selectedEsimForReassign.planName }),
        ...(selectedEsimForReassign.countryCode && { countryCode: selectedEsimForReassign.countryCode }),
        ...(selectedEsimForReassign.countryName && { countryName: selectedEsimForReassign.countryName }),
        ...(selectedEsimForReassign.capacity && { capacity: selectedEsimForReassign.capacity }),
        ...(selectedEsimForReassign.period && { period: selectedEsimForReassign.period }),
        ...(selectedEsimForReassign.price && { price: selectedEsimForReassign.price }),
        ...(selectedEsimForReassign.currency && { currency: selectedEsimForReassign.currency }),
        ...(selectedEsimForReassign.operator && { operator: selectedEsimForReassign.operator }),
        status: 'active', // Reactivate for new user
        ...(selectedEsimForReassign.iccid && { iccid: selectedEsimForReassign.iccid }),
        ...(selectedEsimForReassign.qrCode && { qrCode: selectedEsimForReassign.qrCode }),
        
        // Preserve original timestamps (only if not undefined)
        ...(selectedEsimForReassign.createdAt && { createdAt: selectedEsimForReassign.createdAt }),
        ...(selectedEsimForReassign.updatedAt && { updatedAt: selectedEsimForReassign.updatedAt }),
        ...(selectedEsimForReassign.purchaseDate && { purchaseDate: selectedEsimForReassign.purchaseDate }),
        ...(selectedEsimForReassign.expiryDate && { expiryDate: selectedEsimForReassign.expiryDate }),
        
        // Preserve order data (only if not undefined)
        ...(selectedEsimForReassign.orderResult && { orderResult: selectedEsimForReassign.orderResult }),
        ...(selectedEsimForReassign.orderData && { orderData: selectedEsimForReassign.orderData }),
        
        // Add reassignment tracking
        reassignedAt: new Date(),
        reassignedFrom: userId,
        reassignedTo: selectedReassignUser.id,
        reactivatedAt: new Date()
      };
      
      await setDoc(doc(db, 'users', selectedReassignUser.id, 'esims', selectedEsimForReassign.id), esimData);

      toast.success(`eSIM deactivated from current user and reassigned to ${selectedReassignUser.email} successfully`);
      setShowReassignModal(false);
      setSelectedEsimForReassign(null);
      setSelectedReassignUser(null);
      setReassignUserSearch('');
      await loadEsimOrders(); // Reload the list
    } catch (error) {
      console.error('Error reassigning eSIM:', error);
      toast.error(`Error reassigning eSIM: ${error.message}`);
    }
  };

  // Handle eSIM activation
  const handleActivateEsim = async (esimId) => {
    try {
      await setDoc(doc(db, 'users', userId, 'esims', esimId), {
        status: 'active',
        activatedAt: new Date(),
        activatedBy: currentUser.email
      }, { merge: true });
      
      toast.success('eSIM activated successfully');
      await loadEsimOrders(); // Reload the list
    } catch (error) {
      console.error('Error activating eSIM:', error);
      toast.error(`Error activating eSIM: ${error.message}`);
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
              <h2 className="text-2xl font-semibold text-gray-900">
                {user.email}
              </h2>
              <p className="text-gray-600">User ID: {user.id}</p>
              <p className="text-sm text-gray-500">
                Joined: {user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <p className="text-sm text-gray-600 mb-1">eSIM Orders</p>
                <p className="text-2xl font-bold text-purple-600">{esimOrders.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                <p className="text-2xl font-bold text-green-600">${totalEarnings.toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-gray-600" />
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
                { id: 'user-data', label: 'User Data', icon: User },
                { id: 'referral-codes', label: 'Referral Codes', icon: Gift },
                { id: 'esims', label: 'eSIMs', icon: Smartphone },
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
            {/* User Data Tab */}
            {activeTab === 'user-data' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">User Data Management</h3>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      {isEditingEmail ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEmail}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditEmail}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={handleStartEditEmail}
                        >
                          <span className="text-gray-900">{user.email}</span>
                          <span className="text-xs text-gray-500">Click to edit</span>
                        </div>
                      )}
                    </div>

                    {/* Joined Date Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Joined Date</label>
                      {isEditingJoinedDate ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editedJoinedDate}
                            onChange={(e) => setEditedJoinedDate(e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={handleSaveJoinedDate}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEditJoinedDate}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={handleStartEditJoinedDate}
                        >
                          <span className="text-gray-900">
                            {user.createdAt ? user.createdAt.toLocaleDateString() : 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-500">Click to edit</span>
                        </div>
                      )}
                    </div>

                    {/* User ID Field (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                      <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
                        <span className="text-gray-900 font-mono text-sm">{user.id}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">User ID cannot be changed</p>
                    </div>

                    {/* Role Field (Read-only) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User Role</label>
                      <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
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
                      <p className="text-xs text-gray-500 mt-1">Role cannot be changed from here</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Referral Codes Tab */}
            {activeTab === 'referral-codes' && (
              <div className="space-y-6">
                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Referral Code Management</h3>
                  <div className="flex space-x-3">
                    {referralCodes.length === 0 ? (
                      <button
                        onClick={handleGenerateReferralCode}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Generate Referral Code
                      </button>
                    ) : null}
                  </div>
                </div>

                {/* Current Referral Code */}
                {user && user.referralCode ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Current Referral Code</h4>
                          <div className="flex items-center gap-3 mb-2">
                          <div className="relative group">
                            <span className="font-mono text-xl font-bold text-blue-600 bg-white px-4 py-2 rounded-lg border border-blue-200 shadow-sm">
                              {user.referralCode}
                            </span>
                            <button
                              onClick={handleRegenerateReferralCode}
                              className="absolute -top-2 -right-2 bg-orange-600 hover:bg-orange-700 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                              title="Edit Code"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                          </div>
                        <p className="text-sm text-gray-600">
                          Expires: {user.referralCodeExpiryDate ? 
                            (typeof user.referralCodeExpiryDate.toDate === 'function' ? 
                              user.referralCodeExpiryDate.toDate().toLocaleDateString() : 
                              new Date(user.referralCodeExpiryDate).toLocaleDateString()) : 
                            'Never'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyReferralCode(user.referralCode)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                    <div className="text-center">
                      <Gift className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-yellow-800 mb-2">No Referral Code</h4>
                      <p className="text-yellow-700 mb-4">This user doesn't have a referral code yet.</p>
                      <button
                        onClick={handleGenerateReferralCode}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto transition-colors"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Generate Referral Code
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* eSIMs Tab */}
            {activeTab === 'esims' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">eSIM Orders Management</h3>
                </div>

                {/* eSIM Orders List */}
                {loadingEsims ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : esimOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No eSIM Orders</h3>
                    <p className="text-gray-500">This user hasn't purchased any eSIMs yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {esimOrders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {order.countryName || order.country || 'Unknown Country'}
                              </h4>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'active' ? 'bg-green-100 text-green-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'expired' ? 'bg-red-100 text-red-800' :
                                order.status === 'deactivated' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status === 'deactivated' ? 'Deactivated' : (order.status || 'Unknown')}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">eSIM ID</p>
                                <p className="font-mono text-sm text-gray-900">{order.id}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Plan</p>
                                <p className="text-sm text-gray-900">{order.planName || 'Unknown Plan'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Data</p>
                                <p className="text-sm text-gray-900">{order.capacity || 'Unknown'} {order.capacityUnit || 'GB'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Price</p>
                                <p className="text-sm text-gray-900">${order.price || '0.00'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Operator</p>
                                <p className="text-sm text-gray-900">{order.operatorName || order.operator || 'Unknown'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Period</p>
                                <p className="text-sm text-gray-900">{order.periodDays || '0'} days</p>
                              </div>
                              {order.phoneNumber && (
                                <div>
                                  <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                                  <p className="text-sm text-gray-900">{order.phoneNumber}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Created</p>
                                <p className="text-sm text-gray-900">
                                  {order.createdAt ? 
                                    (typeof order.createdAt.toDate === 'function' ? 
                                      order.createdAt.toDate().toLocaleDateString() : 
                                      order.createdAt.toLocaleDateString()) : 
                                    'Unknown'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Expires</p>
                                <p className="text-sm text-gray-900">
                                  {order.expiryDate ? 
                                    (typeof order.expiryDate.toDate === 'function' ? 
                                      order.expiryDate.toDate().toLocaleDateString() : 
                                      order.expiryDate.toLocaleDateString()) : 
                                    'Unknown'}
                                </p>
                              </div>
                            </div>

                            {order.iccid && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-1">ICCID</p>
                                <p className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded border">
                                  {order.iccid}
                                </p>
                              </div>
                            )}

                            {(order.qrCode || order.qr_code_image) && (
                              <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-1">QR Code / Installation URL</p>
                                <div className="bg-gray-50 p-3 rounded border">
                                  {(() => {
                                    const qrValue = order.qrCode || order.qr_code_image;
                                    console.log('QR Value:', qrValue, 'Type:', typeof qrValue);
                                    return qrValue && typeof qrValue === 'string' && qrValue.toLowerCase().startsWith('lpa:');
                                  })() ? (
                                    <div className="space-y-3">
                                      <p className="text-xs text-gray-500 mb-2">eSIM Installation QR Code (LPA):</p>
                                      <div className="flex flex-col items-center space-y-3">
                                        <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                          <LPAQRCodeDisplay lpaData={order.qrCode || order.qr_code_image} />
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded border text-xs font-mono break-all max-w-xs">
                                          {order.qrCode || order.qr_code_image}
                                        </div>
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(order.qrCode || order.qr_code_image);
                                            toast.success('LPA URL copied to clipboard');
                                          }}
                                          className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded transition-colors"
                                        >
                                          Copy LPA URL
                                        </button>
                                        <p className="text-xs text-gray-500 text-center">
                                          Scan this QR code with your phone to install the eSIM
                                        </p>
                                      </div>
                                    </div>
                                  ) : (
                                    <div>
                                      {(() => {
                                        const qrValue = order.qrCode || order.qr_code_image;
                                        // Double-check to prevent LPA URLs from being loaded as images
                                        if (qrValue && typeof qrValue === 'string' && qrValue.toLowerCase().startsWith('lpa:')) {
                                          return (
                                            <div className="space-y-3">
                                              <p className="text-xs text-gray-500 mb-2">eSIM Installation QR Code (LPA):</p>
                                              <div className="flex flex-col items-center space-y-3">
                                                <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                                                  <LPAQRCodeDisplay lpaData={qrValue} />
                                                </div>
                                                <div className="bg-gray-50 p-2 rounded border text-xs font-mono break-all max-w-xs">
                                                  {qrValue}
                                                </div>
                                                <button
                                                  onClick={() => {
                                                    navigator.clipboard.writeText(qrValue);
                                                    toast.success('LPA URL copied to clipboard');
                                                  }}
                                                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 rounded transition-colors"
                                                >
                                                  Copy LPA URL
                                                </button>
                                                <p className="text-xs text-gray-500 text-center">
                                                  Scan this QR code with your phone to install the eSIM
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        }
                                        return (
                                          <>
                                            <img 
                                              src={qrValue} 
                                              alt="eSIM QR Code" 
                                              className="w-32 h-32"
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                const fallback = e.target.parentNode.querySelector('.qr-fallback');
                                                if (fallback) fallback.style.display = 'block';
                                              }}
                                            />
                                            <div className="qr-fallback hidden text-center p-4">
                                              <p className="text-sm text-gray-500 mb-2">QR Code Image</p>
                                              <p className="text-xs text-gray-400">Image could not be loaded</p>
                                              <button
                                                onClick={() => {
                                                  navigator.clipboard.writeText(qrValue);
                                                  toast.success('QR Code URL copied to clipboard');
                                                }}
                                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded mt-2 transition-colors"
                                              >
                                                Copy URL
                                              </button>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            {order.status === 'deactivated' && (
                              <button
                                onClick={() => handleActivateEsim(order.id)}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                              >
                                <Power className="w-4 h-4 mr-2" />
                                Activate
                              </button>
                            )}
                            <button
                              onClick={() => handleReassignEsim(order)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                            >
                              <Users className="w-4 h-4 mr-2" />
                              Reassign
                            </button>
                            <button
                              onClick={() => handleDeleteEsimOrder(order.id)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center transition-colors"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                {transactions.filter(t => t.type !== 'withdrawal' && t.method !== 'withdrawal').length > 0 ? (
                  transactions.filter(t => t.type !== 'withdrawal' && t.method !== 'withdrawal').map((transaction, index) => (
                    <div
                      key={transaction.id}
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
                    </div>
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
                    <div
                      key={request.id}
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
                    </div>
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

      {/* Reassign eSIM Modal */}
      {showReassignModal && selectedEsimForReassign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Reassign eSIM
                </h3>
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedEsimForReassign(null);
                    setSelectedReassignUser(null);
                    setReassignUserSearch('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">eSIM Details</h4>
                  <p className="text-sm text-gray-900">
                    <strong>Country:</strong> {selectedEsimForReassign.countryName || selectedEsimForReassign.country || 'Unknown'}
                  </p>
                  <p className="text-sm text-gray-900">
                    <strong>Plan:</strong> {selectedEsimForReassign.planName || 'Unknown Plan'}
                  </p>
                  <p className="text-sm text-gray-900">
                    <strong>ID:</strong> {selectedEsimForReassign.id}
                  </p>
                </div>

                <div className="relative">
                  <label htmlFor="userSearch" className="block text-sm font-medium text-gray-700 mb-2">
                    Search User by Email
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      id="userSearch"
                      value={reassignUserSearch}
                      onChange={(e) => setReassignUserSearch(e.target.value)}
                      placeholder="Type email to search..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>
                  
                  {reassignUserSearch.trim() && filteredUsers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => {
                            setSelectedReassignUser(user);
                            setReassignUserSearch(user.email);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-200 last:border-b-0"
                        >
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{user.email}</p>
                              <p className="text-xs text-gray-500">ID: {user.id}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {reassignUserSearch.trim() && filteredUsers.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                      <p className="text-sm text-gray-500">No users found matching "{reassignUserSearch}"</p>
                    </div>
                  )}
                </div>

                {selectedReassignUser && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h4 className="text-sm font-medium text-blue-900 mb-1">Selected User:</h4>
                    <p className="text-sm text-blue-800">{selectedReassignUser.email}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedEsimForReassign(null);
                    setSelectedReassignUser(null);
                    setReassignUserSearch('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReassign}
                  disabled={!selectedReassignUser}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium"
                >
                  Reassign eSIM
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral Code Name Input Modal */}
      {showReferralCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Enter Referral Code Name
                </h3>
                <button
                  onClick={() => {
                    setShowReferralCodeModal(false);
                    setCustomReferralName('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <label htmlFor="referralName" className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Code Name
                </label>
                <input
                  type="text"
                  id="referralName"
                  value={customReferralName}
                  onChange={(e) => setCustomReferralName(e.target.value)}
                  placeholder="Enter a name for this referral code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <p className="text-sm text-gray-500 mt-1">
                  This name will be associated with the referral code for identification purposes.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowReferralCodeModal(false);
                    setCustomReferralName('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={user && user.referralCode ? handleConfirmRegenerateReferralCode : handleConfirmGenerateReferralCode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  {user && user.referralCode ? 'Edit Code' : 'Generate Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailsPage;
