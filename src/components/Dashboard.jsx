'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { User, Globe, Activity, Settings, QrCode, Eye, Download, Trash2, MoreVertical, Smartphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { esimService } from '../services/esimService';

// Generate actual QR code from LPA data using qrcode library
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

// LPA QR Code Display Component for Dashboard
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
        <QrCode className="w-32 h-32 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 mt-2">QR generation failed</p>
    </div>
  );
};

const Dashboard = () => {
  const { currentUser, userProfile, loadUserProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState(null);
  const [esimDetails, setEsimDetails] = useState(null);
  const [loadingEsimDetails, setLoadingEsimDetails] = useState(false);
  const [esimUsage, setEsimUsage] = useState(null);
  const [loadingEsimUsage, setLoadingEsimUsage] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        console.log('❌ No current user, skipping data fetch');
        return;
      }

      try {
        console.log('🔍 Current user:', currentUser.email);
        console.log('🔍 Firebase db:', db);
        
        // Fetch eSIMs from mobile app collection structure (users/{userId}/esims)
        console.log('📱 Fetching eSIMs from mobile app collection...');
        const esimsQuery = query(
          collection(db, 'users', currentUser.uid, 'esims')
        );
        
        console.log('📝 eSIMs query created');
        const esimsSnapshot = await getDocs(esimsQuery);
        console.log('📝 eSIMs snapshot received:', esimsSnapshot.size, 'documents');
        
        const ordersData = esimsSnapshot.docs.map(doc => {
          try {
            const data = doc.data();
                          return {
                id: doc.id,
                ...data,
                // Map mobile app fields to web app expected fields
                orderId: data.orderResult?.orderId || data.order_id || data.id,
                planName: data.planName || data.orderResult?.planName || 'Unknown Plan',
                amount: data.price || data.orderResult?.price || 0,
                status: data.status || data.orderResult?.status || 'unknown',
                customerEmail: data.customerEmail || currentUser.email,
                createdAt: data.createdAt || data.created_at,
                updatedAt: data.updatedAt || data.updated_at,
                // Map QR code data
                qrCode: {
                  qrCode: data.qrCode || data.orderResult?.qrCode,
                  qrCodeUrl: data.qrCodeUrl || data.orderResult?.qrCodeUrl,
                  directAppleInstallationUrl: data.directAppleInstallationUrl || data.orderResult?.directAppleInstallationUrl,
                  iccid: data.iccid || data.orderResult?.iccid,
                  lpa: data.lpa || data.orderResult?.lpa,
                  matchingId: data.matchingId || data.orderResult?.matchingId
                }
              };
          } catch (docError) {
            console.error('❌ Error processing document:', doc.id, docError);
            return null;
          }
        }).filter(Boolean); // Remove null entries
        
        setOrders(ordersData);
        console.log('📊 Fetched eSIMs:', ordersData.length);
        console.log('📊 eSIMs data:', ordersData);
      } catch (error) {
        console.error('❌ Error fetching eSIMs:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        // Set empty orders array on error
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    const ensureUserProfile = async () => {
      if (!currentUser) return;

      try {
        console.log('Checking user profile for:', currentUser.uid);
        // Check if user profile exists
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (!userDoc.exists()) {
          console.log('User profile does not exist, creating...');
          // Create user profile if it doesn't exist
          await setDoc(doc(db, 'users', currentUser.uid), {
            email: currentUser.email,
            displayName: currentUser.displayName || 'Unknown User',
            createdAt: new Date(),
            role: 'customer'
          });
          console.log('✅ Created missing user profile');
          // Reload user profile after creating it
          await loadUserProfile();
        } else {
          console.log('✅ User profile exists:', userDoc.data());
          // Force reload profile in case it wasn't loaded
          await loadUserProfile();
        }
      } catch (error) {
        console.error('❌ Error ensuring user profile:', error);
      }
    };

    ensureUserProfile();
    fetchData();
  }, [currentUser, loadUserProfile]);

  if (!currentUser) {
    router.push('/login');
    return null;
  }

  const activeOrders = orders.filter(order => order && order.status === 'active');
  const pendingOrders = orders.filter(order => order && order.status === 'pending');

  const handleViewQRCode = async (order) => {
    try {
      setSelectedOrder(order);
      setShowQRModal(true);
      
      // Check if we already have QR code data in the order
      if (order.qrCode && (order.qrCode.qrCode || order.qrCode.qrCodeUrl || order.qrCode.directAppleInstallationUrl)) {
        console.log('✅ Using existing QR code data from order');
        setSelectedOrder(prev => ({ 
          ...prev, 
          qrCode: {
            qrCode: order.qrCode.qrCode,
            qrCodeUrl: order.qrCode.qrCodeUrl,
            directAppleInstallationUrl: order.qrCode.directAppleInstallationUrl,
            iccid: order.qrCode.iccid,
            lpa: order.qrCode.lpa,
            matchingId: order.qrCode.matchingId,
            isReal: true
          }
        }));
      } else {
        console.log('⚠️ No existing QR code data, trying to generate...');
        // Only try to generate QR code if we don't have existing data
        const qrResult = await generateQRCode(order.orderId || order.id, order.planName);
        setSelectedOrder(prev => ({ ...prev, qrCode: qrResult }));
      }
    } catch (error) {
      console.error('Error opening QR modal:', error);
    }
  };

  const generateQRCode = async (orderId, planName, retryCount = 0) => {
    try {
      // Try to get real QR code from Airalo API
      console.log(`📱 Attempting to get real QR code for order: ${orderId} (attempt ${retryCount + 1})`);
      
      const qrCodeResult = await esimService.getEsimQrCode(orderId);
      
      if (qrCodeResult.success && qrCodeResult.qrCode) {
        console.log('✅ Real QR code received:', qrCodeResult);
        return {
          qrCode: qrCodeResult.qrCode,
          qrCodeData: qrCodeResult.qrCodeData,
          planDetails: qrCodeResult.planDetails,
          esimData: qrCodeResult.esimData,
          isReal: true
        };
      } else {
        throw new Error('No QR code data received');
      }
    } catch (error) {
      console.log(`⚠️ Real QR code failed (attempt ${retryCount + 1}):`, error.message);
      
      // If this is a "not ready yet" error and we haven't retried too many times, retry
      if (error.message.includes('not available yet') && retryCount < 3) {
        console.log('⏳ QR code not ready, retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        return generateQRCode(orderId, planName, retryCount + 1);
      }
      
      // Fallback to simple data string
      const qrData = `eSIM:${orderId || 'unknown'}|Plan:${planName || 'unknown'}|Status:Active`;
      return {
        qrCode: qrData,
        isReal: false,
        fallbackReason: error.message,
        canRetry: true
      };
    }
  };

  const handleCheckEsimDetails = async () => {
    if (!selectedOrder || loadingEsimDetails) return;
    
    try {
      setLoadingEsimDetails(true);
      console.log('📱 Checking eSIM details for order:', selectedOrder);
      
      // Get ICCID from the order
      const iccid = selectedOrder.qrCode?.iccid || selectedOrder.iccid;
      
      if (!iccid) {
        console.log('❌ No ICCID found in order');
        alert('No ICCID found in this order. Cannot check eSIM details.');
        return;
      }
      
      console.log('📱 Checking eSIM details for ICCID:', iccid);
      const result = await esimService.getEsimDetailsByIccid(iccid);
      
      if (result.success) {
        setEsimDetails(result.data);
        console.log('✅ eSIM details retrieved:', result.data);
      } else {
        console.log('❌ Failed to get eSIM details:', result.error);
        alert(`Failed to get eSIM details: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error checking eSIM details:', error);
      alert(`Error checking eSIM details: ${error.message}`);
    } finally {
      setLoadingEsimDetails(false);
    }
  };

  const handleCheckEsimUsage = async () => {
    if (!selectedOrder || loadingEsimUsage) return;
    
    try {
      setLoadingEsimUsage(true);
      console.log('📊 Checking eSIM usage for order:', selectedOrder);
      
      // Get ICCID from the order
      const iccid = selectedOrder.qrCode?.iccid || selectedOrder.iccid;
      
      if (!iccid) {
        console.log('❌ No ICCID found in order');
        alert('No ICCID found in this order. Cannot check eSIM usage.');
        return;
      }
      
      console.log('📊 Checking eSIM usage for ICCID:', iccid);
      const result = await esimService.getEsimUsageByIccid(iccid);
      
      if (result.success) {
        setEsimUsage(result.data);
        console.log('✅ eSIM usage retrieved:', result.data);
      } else {
        console.log('❌ Failed to get eSIM usage:', result.error);
        alert(`Failed to get eSIM usage: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error checking eSIM usage:', error);
      alert(`Error checking eSIM usage: ${error.message}`);
    } finally {
      setLoadingEsimUsage(false);
    }
  };

  const handleDeleteOrder = async () => {
    console.log('🔴 Delete button clicked!');
    console.log('🔴 selectedOrder:', selectedOrder);
    console.log('🔴 isRetrying:', isRetrying);
    
    if (!selectedOrder || isRetrying) {
      console.log('🔴 Early return - no selectedOrder or isRetrying');
      return;
    }
    
    try {
      setIsRetrying(true);
      console.log('🗑️ Deleting eSIM order from Firestore...');
      console.log('🗑️ Selected order data:', selectedOrder);
      
      // Get the ICCID and package info before deleting
      const iccid = selectedOrder.esimData?.iccid;
      const packageId = selectedOrder.package_id;
      const orderId = selectedOrder.orderId || selectedOrder.id;
      
      console.log('🗑️ Order details:', { iccid, packageId, orderId });
      
      // Delete the order from Firestore (users/{userId}/esims collection)
      const orderRef = doc(db, 'users', currentUser.uid, 'esims', orderId);
      console.log('🗑️ Deleting document at path:', `users/${currentUser.uid}/esims/${orderId}`);
      await deleteDoc(orderRef);
      console.log('✅ Order deleted from Firestore');
      
      // SIM tracking (optional - don't fail if this doesn't work)
      if (iccid && packageId) {
        try {
          console.log('🔄 Marking SIM as available again:', { iccid, packageId });
          
          // Create or update available SIMs collection
          const availableSimRef = doc(db, 'available_sims', iccid);
          await setDoc(availableSimRef, {
            iccid: iccid,
            package_id: packageId,
            status: 'available',
            released_at: serverTimestamp(),
            released_from_order: selectedOrder.orderId || selectedOrder.id
          }, { merge: true });
          
          console.log('✅ SIM marked as available again');
        } catch (simError) {
          console.error('⚠️ Failed to mark SIM as available:', simError);
          // Don't fail the delete operation if SIM tracking fails
        }
      } else {
        console.log('⚠️ No ICCID or packageId found, skipping SIM tracking');
      }
      
      // Remove from local state
      setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      setSelectedOrder(null);
      setShowQRModal(false);
      
      console.log('✅ eSIM order deleted from Firestore successfully');
    } catch (error) {
      console.error('❌ Error deleting eSIM order:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      // Show user-friendly error message
      alert(`Failed to delete order: ${error.message}`);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {currentUser.displayName || currentUser.email}!
              </h1>
              <p className="text-gray-600">
                Manage your eSIM orders and account settings
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active eSIMs</p>
                <p className="text-3xl font-bold text-green-600">{activeOrders.length}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

        </div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                order && (
                  <div
                    key={order.id || order.orderId || Math.random()}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        order.status === 'active' ? 'bg-green-500' :
                        order.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{order.planName || 'Unknown Plan'}</p>
                        <p className="text-sm text-gray-500">Order #{order.orderId || order.id || 'Unknown'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${Math.round(order.amount || 0)}</p>
                        <p className="text-sm text-gray-500 capitalize">{order.status || 'unknown'}</p>
                      </div>
                      {order.status === 'active' && (
                        <button
                          onClick={() => handleViewQRCode(order)}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                        >
                          <QrCode className="w-4 h-4" />
                          <span className="text-sm">View QR</span>
                        </button>
                      )}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </motion.div>



        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Settings className="w-6 h-6 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{currentUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-gray-900">{currentUser.displayName || 'Not set'}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Account Created</label>
                <p className="mt-1 text-gray-900">
                  {userProfile?.createdAt ? 
                    (userProfile.createdAt.toDate ? 
                      new Date(userProfile.createdAt.toDate()).toLocaleDateString() :
                      new Date(userProfile.createdAt).toLocaleDateString()
                    ) : 
                    'Unknown'
                  }
                </p>
                {!userProfile?.createdAt && (
                  <button 
                    onClick={async () => {
                      console.log('Manual refresh triggered');
                      await loadUserProfile();
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Refresh Profile
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-gray-900 capitalize">{userProfile?.role || 'customer'}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* QR Code Modal */}
      {showQRModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4"
          >
            <div className="text-center">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">eSIM QR Code</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">{selectedOrder.planName || 'Unknown Plan'}</h4>
                <p className="text-sm text-gray-500">Order #{selectedOrder.orderId || selectedOrder.id || 'Unknown'}</p>
                <p className="text-sm text-gray-500">${Math.round(selectedOrder.amount || 0)}</p>
              </div>

              {/* QR Code Display - Clean and Simple */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                {console.log('🔍 QR Code data for display:', selectedOrder.qrCode)}
                {console.log('🔍 Full selectedOrder:', selectedOrder)}
                {selectedOrder.qrCode && selectedOrder.qrCode.qrCode ? (
                  // Show the actual QR code from LPA data (contains "Add Cellular Plan")
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                      <LPAQRCodeDisplay lpaData={selectedOrder.qrCode.qrCode} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ Real QR Code from Airalo (Add Cellular Plan)</p>
                    <p className="text-xs text-gray-400 mt-1 break-all">QR Data: {selectedOrder.qrCode.qrCode?.substring(0, 50)}...</p>
                  </div>
                ) : selectedOrder.qrCode && selectedOrder.qrCode.qrCodeUrl ? (
                  // Fallback: Show QR code image from URL
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                      <img 
                        src={selectedOrder.qrCode.qrCodeUrl} 
                        alt="eSIM QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ QR Code Image from Airalo</p>
                  </div>
                ) : selectedOrder.qrCode && selectedOrder.qrCode.directAppleInstallationUrl ? (
                  // Show Apple installation link
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-purple-300 shadow-sm flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">📱</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Apple eSIM Installation</p>
                        <a 
                          href={selectedOrder.qrCode.directAppleInstallationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                        >
                          Install eSIM
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ Direct Apple Installation Link</p>
                  </div>
                ) : (
                  // Fallback - no QR code available
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                      <div className="w-full h-full flex items-center justify-center">
                        <QrCode className="w-32 h-32 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedOrder.qrCode?.fallbackReason?.includes('not available yet') 
                          ? 'QR code is being generated...' 
                          : selectedOrder.qrCode?.fallbackReason || 'No QR code available'}
                      </p>
                      {selectedOrder.qrCode?.canRetry && (
                        <p className="text-xs text-blue-600 mt-1">Click "Generate QR Code" to try again</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Actions Dropdown Menu */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <MoreVertical className="w-4 h-4 mr-2" />
                    Actions
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {/* Check eSIM Details */}
                      {(selectedOrder.qrCode?.iccid || selectedOrder.iccid) && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleCheckEsimDetails();
                          }}
                          disabled={loadingEsimDetails}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loadingEsimDetails ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-3"></div>
                              <span className="text-green-600">Checking eSIM Details...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-3 text-green-600" />
                              <span className="text-gray-700">Check eSIM Details in API</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Check eSIM Usage */}
                      {(selectedOrder.qrCode?.iccid || selectedOrder.iccid) && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleCheckEsimUsage();
                          }}
                          disabled={loadingEsimUsage}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loadingEsimUsage ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-3"></div>
                              <span className="text-purple-600">Checking Usage...</span>
                            </>
                          ) : (
                            <>
                              <Activity className="w-4 h-4 mr-3 text-purple-600" />
                              <span className="text-gray-700">Check Usage & Status</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Open in Apple eSIM */}
                      {selectedOrder.qrCode && selectedOrder.qrCode.directAppleInstallationUrl && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            window.open(selectedOrder.qrCode.directAppleInstallationUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <Smartphone className="w-4 h-4 mr-3 text-orange-600" />
                          <span className="text-gray-700">Open in Apple eSIM</span>
                        </button>
                      )}

                      {/* Download QR Code */}
                      {selectedOrder.qrCode && selectedOrder.qrCode.qrCodeUrl && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            const link = document.createElement('a');
                            link.href = selectedOrder.qrCode.qrCodeUrl;
                            link.download = `esim-qr-${selectedOrder.orderId || selectedOrder.id}.png`;
                            link.click();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <Download className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="text-gray-700">Download QR Code</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Always show Delete button when no QR code is available */}
                {(!selectedOrder.qrCode || !selectedOrder.qrCode.qrCode || selectedOrder.qrCode?.canRetry) && (
                  <button
                    onClick={handleDeleteOrder}
                    disabled={isRetrying}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRetrying ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 inline mr-2" />
                        Delete eSIM
                      </>
                    )}
                  </button>
                )}
                
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* eSIM Details Modal */}
      {esimDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">eSIM Details from Airalo API</h3>
              <button
                onClick={() => setEsimDetails(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Basic eSIM Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">ICCID:</span>
                    <p className="text-gray-900 font-mono">{esimDetails.iccid}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Matching ID:</span>
                    <p className="text-gray-900">{esimDetails.matching_id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Created At:</span>
                    <p className="text-gray-900">{esimDetails.created_at}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Recycled:</span>
                    <p className="text-gray-900">{esimDetails.recycled ? 'Yes' : 'No'}</p>
                  </div>
                  {esimDetails.recycled_at && (
                    <div>
                      <span className="font-medium text-gray-600">Recycled At:</span>
                      <p className="text-gray-900">{esimDetails.recycled_at}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">QR Code Information</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">QR Code Data:</span>
                    <p className="text-gray-900 font-mono break-all bg-white p-2 rounded border">
                      {esimDetails.qrcode}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">QR Code URL:</span>
                    <p className="text-blue-600 break-all">
                      <a href={esimDetails.qrcode_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {esimDetails.qrcode_url}
                      </a>
                    </p>
                  </div>
                  {esimDetails.direct_apple_installation_url && (
                    <div>
                      <span className="font-medium text-gray-600">Apple Installation URL:</span>
                      <p className="text-blue-600 break-all">
                        <a href={esimDetails.direct_apple_installation_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {esimDetails.direct_apple_installation_url}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Package Information */}
              {esimDetails.simable && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Package Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Package:</span>
                      <p className="text-gray-900">{esimDetails.simable.package}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Data:</span>
                      <p className="text-gray-900">{esimDetails.simable.data}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Validity:</span>
                      <p className="text-gray-900">{esimDetails.simable.validity} days</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Price:</span>
                      <p className="text-gray-900">{esimDetails.simable.currency} {esimDetails.simable.price}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <p className="text-gray-900">{esimDetails.simable.status?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">eSIM Type:</span>
                      <p className="text-gray-900">{esimDetails.simable.esim_type}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Information */}
              {esimDetails.simable?.user && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{esimDetails.simable.user.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{esimDetails.simable.user.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Company:</span>
                      <p className="text-gray-900">{esimDetails.simable.user.company}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Created At:</span>
                      <p className="text-gray-900">{esimDetails.simable.user.created_at}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Raw API Response</h4>
                <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(esimDetails, null, 2)}
                </pre>
              </div>
            </div>

          </motion.div>
        </div>
      )}

      {/* eSIM Usage Modal */}
      {esimUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">eSIM Usage & Status</h3>
              <button
                onClick={() => setEsimUsage(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Status Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <p className={`text-gray-900 font-semibold ${
                      esimUsage.status === 'ACTIVE' ? 'text-green-600' :
                      esimUsage.status === 'EXPIRED' ? 'text-red-600' :
                      esimUsage.status === 'FINISHED' ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {esimUsage.status}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Unlimited:</span>
                    <p className="text-gray-900">{esimUsage.is_unlimited ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Expires At:</span>
                    <p className="text-gray-900">{esimUsage.expired_at}</p>
                  </div>
                </div>
              </div>

              {/* Data Usage */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Data Usage</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Data:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {esimUsage.is_unlimited ? 'Unlimited' : `${esimUsage.total} MB`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Remaining Data:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {esimUsage.is_unlimited ? 'Unlimited' : `${esimUsage.remaining} MB`}
                    </span>
                  </div>
                  {!esimUsage.is_unlimited && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((esimUsage.total - esimUsage.remaining) / esimUsage.total) * 100}%` 
                        }}
                      ></div>
                    </div>
                  )}
                  {!esimUsage.is_unlimited && (
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((esimUsage.total - esimUsage.remaining) / esimUsage.total) * 100)}% used
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Usage */}
              {esimUsage.total_voice > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Voice Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Voice:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.total_voice} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Remaining Voice:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.remaining_voice} minutes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((esimUsage.total_voice - esimUsage.remaining_voice) / esimUsage.total_voice) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((esimUsage.total_voice - esimUsage.remaining_voice) / esimUsage.total_voice) * 100)}% used
                    </div>
                  </div>
                </div>
              )}

              {/* Text Usage */}
              {esimUsage.total_text > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Text Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Text:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.total_text} SMS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Remaining Text:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.remaining_text} SMS</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((esimUsage.total_text - esimUsage.remaining_text) / esimUsage.total_text) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((esimUsage.total_text - esimUsage.remaining_text) / esimUsage.total_text) * 100)}% used
                    </div>
                  </div>
                </div>
              )}

              {/* Raw Data */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Raw API Response</h4>
                <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                  {JSON.stringify(esimUsage, null, 2)}
                </pre>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
