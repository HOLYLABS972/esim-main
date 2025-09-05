'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { User, Globe, Activity, Settings, QrCode, Eye, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

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
  const [generatedQRCode, setGeneratedQRCode] = useState(null);
  const router = useRouter();

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
                updatedAt: data.updatedAt || data.updated_at
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
      
      // Generate QR code when modal opens
      const qrResult = await generateQRCode(order.orderId || order.id, order.planName);
      setSelectedOrder(prev => ({ ...prev, qrCode: qrResult }));
    } catch (error) {
      console.error('Error opening QR modal:', error);
    }
  };

  const generateQRCode = async (orderId, planName) => {
    try {
      // Try to get real QR code from DataPlans API
      console.log('📱 Attempting to get real QR code for order:', orderId);
      
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
      console.log('⚠️ Real QR code failed, using fallback:', error.message);
      
      // Fallback to simple data string
      const qrData = `eSIM:${orderId || 'unknown'}|Plan:${planName || 'unknown'}|Status:Active`;
      return {
        qrCode: qrData,
        isReal: false,
        fallbackReason: error.message
      };
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
                {selectedOrder.qrCode && selectedOrder.qrCode.qrCode ? (
                  // Generate and display actual QR code from LPA data
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                      <LPAQRCodeDisplay lpaData={selectedOrder.qrCode.qrCode} />
                    </div>
                  </div>
                ) : selectedOrder.qrCode && selectedOrder.qrCode.qrCodeUrl ? (
                  // If we have a URL, show the image
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                      <img 
                        src={selectedOrder.qrCode.qrCodeUrl} 
                        alt="eSIM QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  // Fallback - no QR code available
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                      <div className="w-full h-full flex items-center justify-center">
                        <QrCode className="w-32 h-32 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">No QR code available</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {selectedOrder.qrCode && selectedOrder.qrCode.qrCodeUrl && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedOrder.qrCode.qrCodeUrl;
                      link.download = `esim-qr-${selectedOrder.orderId || selectedOrder.id}.png`;
                      link.click();
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4 inline mr-2" />
                    Download QR Code
                  </button>
                )}
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
