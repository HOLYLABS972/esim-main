'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Copy, Share2, Download, Smartphone, ArrowLeft, Check, MoreVertical, Camera, Settings, CheckCircle, Radio, Globe, Battery, BarChart3, Loader2 } from 'lucide-react';
import LPAQRCodeDisplay from './dashboard/LPAQRCodeDisplay';
import TopupModal from './dashboard/TopupModal';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const QRCodePage = ({ orderId, iccid }) => {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('ios'); // 'ios' or 'android'
  const [completedSteps, setCompletedSteps] = useState([]);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [loadingTopup, setLoadingTopup] = useState(false);
  const [loadingMobileData, setLoadingMobileData] = useState(false);
  const [mobileData, setMobileData] = useState(null);

  useEffect(() => {
    console.log('🔍 QRCodePage useEffect triggered:', { iccid, orderId, authLoading, hasUser: !!currentUser });
    
    // Wait for auth to finish loading, but don't require authentication
    if (authLoading) {
      console.log('⏳ Auth loading...');
      return;
    }

    // Check if iccid is provided (prioritize iccid over orderId)
    if (iccid && iccid !== 'undefined' && iccid !== 'null') {
      console.log('✅ Fetching QR code for ICCID:', iccid, currentUser ? '(authenticated)' : '(public access)');
      fetchQRCodeByIccid();
    } else if (orderId && orderId !== 'undefined' && orderId !== 'null') {
      console.log('✅ Fetching QR code for order:', orderId, currentUser ? '(authenticated)' : '(public access)');
      fetchQRCode();
    } else {
      console.error('❌ No ICCID or Order ID provided:', { iccid, orderId });
      setError('No ICCID or Order ID provided');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, iccid, currentUser, authLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  const fetchQRCodeByIccid = async () => {
    try {
      console.log('📱 Searching for order by ICCID:', iccid);
      setLoading(true);
      setError(null);

      // Helper function to normalize ICCID for comparison (handle string/number/whitespace)
      const normalizeIccid = (iccidValue) => {
        if (!iccidValue) return null;
        // Convert to string, trim whitespace
        return String(iccidValue).trim();
      };

      // Helper function to extract ICCID from order data (check all possible locations)
      const extractIccidFromOrder = (orderData) => {
        const checks = [
          orderData?.iccid,
          orderData?.qrCode?.iccid,
          orderData?.orderResult?.iccid,
          orderData?.esimData?.iccid,
          orderData?.airaloOrderData?.sims?.[0]?.iccid,
          orderData?.orderData?.sims?.[0]?.iccid,
          orderData?.sims?.[0]?.iccid,
          orderData?.airaloOrderData?.iccid,
          orderData?.orderResult?.sims?.[0]?.iccid,
        ];
        const found = checks.find(val => val && val !== null && val !== undefined);
        return normalizeIccid(found);
      };

      // Normalize the search ICCID
      const normalizedSearchIccid = normalizeIccid(iccid);

      let orderData = null;
      let orderId = null;

      // If user is authenticated, search in their esims subcollection first
      if (currentUser) {
        console.log('🔍 Searching in user esims collection...');
        try {
          const esimsRef = collection(db, 'users', currentUser.uid, 'esims');
          const querySnapshot = await getDocs(esimsRef);
          
          console.log(`🔍 Searching through ${querySnapshot.docs.length} user orders for ICCID: ${iccid} (normalized: ${normalizedSearchIccid})`);

          // Search through orders to find one with matching ICCID
          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            
            // Check all possible locations for ICCID
            const foundIccid = extractIccidFromOrder(data);
            
            // Compare normalized values
            const matches = foundIccid === normalizedSearchIccid;
            
            if (matches) {
              orderData = data;
              orderId = docSnap.id;
              console.log('✅ Found order in user esims collection by ICCID:', orderId);
              break;
            }
          }
        } catch (userErr) {
          console.log('⚠️ Error searching user esims collection:', userErr);
        }
      }

      // Search in global orders collection (works for both authenticated and non-authenticated users)
      if (!orderData) {
        console.log('🔍 Searching in global orders collection...');
        try {
          const globalOrdersRef = collection(db, 'orders');
          const globalQuerySnapshot = await getDocs(globalOrdersRef);
          
          console.log(`🔍 Searching through ${globalQuerySnapshot.docs.length} global orders for ICCID: ${iccid}`);
          
          for (const docSnap of globalQuerySnapshot.docs) {
            const data = docSnap.data();
            
            // If user is authenticated, optionally filter by userId (but allow public access too)
            // For public access, we search all orders by ICCID
            
            const foundIccid = extractIccidFromOrder(data);
            const matches = foundIccid === normalizedSearchIccid;
            
            if (matches) {
              orderData = data;
              orderId = docSnap.id;
              console.log('✅ Found order in global orders collection by ICCID:', orderId);
              break;
            }
          }
        } catch (globalErr) {
          console.log('⚠️ Error searching global orders collection:', globalErr);
        }
      }

      if (!orderData) {
        console.error('❌ Order not found for ICCID:', iccid);
        setError(`Order not found for ICCID: ${iccid}. Please check that the ICCID is correct.`);
        setLoading(false);
        return;
      }

      // Extract QR code data (same logic as fetchQRCode)
      extractQRCodeData(orderData, orderId);
    } catch (err) {
      console.error('❌ Error fetching order by ICCID:', err);
      setError(err.message || 'Failed to load order data');
      setLoading(false);
    }
  };

  const extractQRCodeData = (orderData, foundOrderId) => {
    console.log('📦 Order data:', orderData);
    console.log('📦 Order data keys:', Object.keys(orderData));
    
    // Extract QR code/LPA data from order
    let qrCodeData = null;
    
    // Check airaloOrderData.sims (from Airalo API response)
    if (orderData.airaloOrderData && orderData.airaloOrderData.sims && orderData.airaloOrderData.sims.length > 0) {
      const sim = orderData.airaloOrderData.sims[0];
      console.log('✅ Found QR code in airaloOrderData.sims');
      qrCodeData = {
        qrCode: sim.qrcode || sim.qrCode || sim.lpa || '',
        qrCodeUrl: sim.qrcode_url || sim.qrCodeUrl || '',
        lpa: sim.lpa || sim.qrcode || sim.qrCode || '',
        iccid: sim.iccid || '',
        activationCode: sim.activation_code || sim.activationCode || '',
        matchingId: sim.matching_id || sim.matchingId || '',
        directAppleInstallationUrl: sim.direct_apple_installation_url || '',
      };
    }
    // Check esimData (processed eSIM data)
    else if (orderData.esimData) {
      console.log('✅ Found QR code in esimData');
      qrCodeData = {
        qrCode: orderData.esimData.qrcode || orderData.esimData.qrCode || orderData.esimData.lpa || '',
        qrCodeUrl: orderData.esimData.qrcode_url || orderData.esimData.qrCodeUrl || '',
        lpa: orderData.esimData.lpa || orderData.esimData.qrcode || orderData.esimData.qrCode || '',
        iccid: orderData.esimData.iccid || '',
        activationCode: orderData.esimData.activationCode || orderData.esimData.activation_code || '',
        matchingId: orderData.esimData.matching_id || orderData.esimData.matchingId || '',
        directAppleInstallationUrl: orderData.esimData.direct_apple_installation_url || '',
      };
    }
    // Check orderData.sims (from SDK response)
    else if (orderData.orderData && orderData.orderData.sims && orderData.orderData.sims.length > 0) {
      const sim = orderData.orderData.sims[0];
      console.log('✅ Found QR code in orderData.sims');
      qrCodeData = {
        qrCode: sim.qrcode || sim.qrCode || sim.lpa || '',
        qrCodeUrl: sim.qrcode_url || sim.qrCodeUrl || '',
        lpa: sim.lpa || sim.qrcode || sim.qrCode || '',
        iccid: sim.iccid || '',
        activationCode: sim.activation_code || sim.activationCode || '',
        matchingId: sim.matching_id || sim.matchingId || '',
      };
    }
    // Check direct fields
    else if (orderData.qrCode || orderData.qrcode || orderData.lpa) {
      console.log('✅ Found QR code in direct fields');
      qrCodeData = {
        qrCode: orderData.qrCode || orderData.qrcode || orderData.lpa || '',
        qrCodeUrl: orderData.qrCodeUrl || orderData.qrcode_url || '',
        lpa: orderData.lpa || orderData.qrCode || orderData.qrcode || '',
        iccid: orderData.iccid || '',
        activationCode: orderData.activationCode || orderData.activation_code || '',
        matchingId: orderData.matchingId || orderData.matching_id || '',
      };
    }
    // Check sims array directly
    else if (orderData.sims && orderData.sims.length > 0) {
      const sim = orderData.sims[0];
      console.log('✅ Found QR code in sims array');
      qrCodeData = {
        qrCode: sim.qrcode || sim.qrCode || sim.lpa || '',
        qrCodeUrl: sim.qrcode_url || sim.qrCodeUrl || '',
        lpa: sim.lpa || sim.qrcode || sim.qrCode || '',
        iccid: sim.iccid || '',
        activationCode: sim.activation_code || sim.activationCode || '',
        matchingId: sim.matching_id || sim.matchingId || '',
      };
    }

    if (qrCodeData && (qrCodeData.qrCode || qrCodeData.lpa)) {
      console.log('✅ QR code/LPA found in order data');
      setQrData(qrCodeData);
      setOrderInfo({
        orderId: foundOrderId,
        planName: orderData.package_id || orderData.packageId || orderData.packageName || orderData.airaloOrderData?.package || 'eSIM Plan',
        amount: orderData.price || orderData.amount || orderData.airaloOrderData?.price || 0
      });
      setLoading(false);
    } else {
      console.error('❌ No QR code or LPA data found in order');
      setError('QR code not available. The order does not contain QR code or LPA data.');
      setLoading(false);
    }
  };

  const fetchQRCode = async () => {
    try {
      console.log('📱 Fetching order data from Firestore for order:', orderId);
      setLoading(true);
      setError(null);

      let orderDoc = null;
      let orderData = null;

      // If user is authenticated, try user's esims subcollection first
      if (currentUser) {
        try {
          const orderRef = doc(db, 'users', currentUser.uid, 'esims', orderId);
          orderDoc = await getDoc(orderRef);
          if (orderDoc.exists()) {
            orderData = orderDoc.data();
            console.log('✅ Found order in user esims collection');
          }
        } catch (userErr) {
          console.log('⚠️ Error fetching from user esims collection:', userErr);
        }
      }

      // Fallback to global orders collection
      if (!orderData) {
        try {
          const globalOrderRef = doc(db, 'orders', orderId);
          orderDoc = await getDoc(globalOrderRef);
          if (orderDoc.exists()) {
            orderData = orderDoc.data();
            console.log('✅ Found order in global orders collection');
          }
        } catch (globalErr) {
          console.log('⚠️ Error fetching from global orders collection:', globalErr);
        }
      }
      
      if (!orderData || !orderDoc || !orderDoc.exists()) {
        console.error('❌ Order not found');
        setError('Order not found');
        setLoading(false);
        return;
      }

      console.log('📦 Order data:', orderData);
      console.log('📦 Order data keys:', Object.keys(orderData));
      
      // Extract QR code/LPA data from order
      let qrCodeData = null;
      
      // Check airaloOrderData.sims (from Airalo API response)
      if (orderData.airaloOrderData && orderData.airaloOrderData.sims && orderData.airaloOrderData.sims.length > 0) {
        const sim = orderData.airaloOrderData.sims[0];
        console.log('✅ Found QR code in airaloOrderData.sims');
        qrCodeData = {
          qrCode: sim.qrcode || sim.qrCode || sim.lpa || '',
          qrCodeUrl: sim.qrcode_url || sim.qrCodeUrl || '',
          lpa: sim.lpa || sim.qrcode || sim.qrCode || '',
          iccid: sim.iccid || '',
          activationCode: sim.activation_code || sim.activationCode || '',
          matchingId: sim.matching_id || sim.matchingId || '',
          directAppleInstallationUrl: sim.direct_apple_installation_url || '',
        };
      }
      // Check esimData (processed eSIM data)
      else if (orderData.esimData) {
        console.log('✅ Found QR code in esimData');
        qrCodeData = {
          qrCode: orderData.esimData.qrcode || orderData.esimData.qrCode || orderData.esimData.lpa || '',
          qrCodeUrl: orderData.esimData.qrcode_url || orderData.esimData.qrCodeUrl || '',
          lpa: orderData.esimData.lpa || orderData.esimData.qrcode || orderData.esimData.qrCode || '',
          iccid: orderData.esimData.iccid || '',
          activationCode: orderData.esimData.activationCode || orderData.esimData.activation_code || '',
          matchingId: orderData.esimData.matching_id || orderData.esimData.matchingId || '',
          directAppleInstallationUrl: orderData.esimData.direct_apple_installation_url || '',
        };
      }
      // Check orderData.sims (from SDK response)
      else if (orderData.orderData && orderData.orderData.sims && orderData.orderData.sims.length > 0) {
        const sim = orderData.orderData.sims[0];
        console.log('✅ Found QR code in orderData.sims');
        qrCodeData = {
          qrCode: sim.qrcode || sim.qrCode || sim.lpa || '',
          qrCodeUrl: sim.qrcode_url || sim.qrCodeUrl || '',
          lpa: sim.lpa || sim.qrcode || sim.qrCode || '',
          iccid: sim.iccid || '',
          activationCode: sim.activation_code || sim.activationCode || '',
          matchingId: sim.matching_id || sim.matchingId || '',
        };
      }
      // Check direct fields
      else if (orderData.qrCode || orderData.qrcode || orderData.lpa) {
        console.log('✅ Found QR code in direct fields');
        qrCodeData = {
          qrCode: orderData.qrCode || orderData.qrcode || orderData.lpa || '',
          qrCodeUrl: orderData.qrCodeUrl || orderData.qrcode_url || '',
          lpa: orderData.lpa || orderData.qrCode || orderData.qrcode || '',
          iccid: orderData.iccid || '',
          activationCode: orderData.activationCode || orderData.activation_code || '',
          matchingId: orderData.matchingId || orderData.matching_id || '',
        };
      }
      // Check sims array directly
      else if (orderData.sims && orderData.sims.length > 0) {
        const sim = orderData.sims[0];
        console.log('✅ Found QR code in sims array');
        qrCodeData = {
          qrCode: sim.qrcode || sim.qrCode || sim.lpa || '',
          qrCodeUrl: sim.qrcode_url || sim.qrCodeUrl || '',
          lpa: sim.lpa || sim.qrcode || sim.qrCode || '',
          iccid: sim.iccid || '',
          activationCode: sim.activation_code || sim.activationCode || '',
          matchingId: sim.matching_id || sim.matchingId || '',
        };
      }

      extractQRCodeData(orderData, orderId);
    } catch (err) {
      console.error('❌ Error fetching order:', err);
      setError(err.message || 'Failed to load order data');
      setLoading(false);
    }
  };

  const handleInstall = () => {
    // If there's a direct Apple installation URL, open it
    if (qrData?.directAppleInstallationUrl) {
      window.open(qrData.directAppleInstallationUrl, '_blank');
      return;
    }
    
    // Otherwise, copy the link to clipboard
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCheckMobileData = async () => {
    if (!qrData?.iccid && !orderId) {
      toast.error('No ICCID or Order ID available');
      return;
    }

    try {
      setLoadingMobileData(true);
      const result = await apiService.getMobileData({ 
        iccid: qrData?.iccid, 
        orderId: orderId 
      });

      if (result.success) {
        setMobileData(result.data);
        toast.success('Mobile data retrieved successfully');
        // Show mobile data in an alert or modal
        const dataInfo = result.data || {};
        const message = `Data Usage: ${dataInfo.used || 'N/A'} / ${dataInfo.total || 'N/A'}\nStatus: ${dataInfo.status || 'N/A'}`;
        alert(message);
      } else {
        toast.error(result.error || 'Failed to get mobile data');
      }
    } catch (error) {
      console.error('❌ Error checking mobile data:', error);
      toast.error('Error checking mobile data: ' + error.message);
    } finally {
      setLoadingMobileData(false);
    }
  };

  const handleTopup = async (packageId) => {
    if (!qrData?.iccid) {
      toast.error('No ICCID found. Cannot create topup.');
      return;
    }

    try {
      setLoadingTopup(true);
      const result = await apiService.createTopup({ 
        iccid: qrData.iccid, 
        package_id: packageId 
      });

      if (result.success) {
        toast.success('Topup created successfully!');
        setShowTopupModal(false);
        // Refresh mobile data after topup
        await handleCheckMobileData();
      } else {
        toast.error('Failed to create topup: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error creating topup:', error);
      toast.error('Error creating topup: ' + error.message);
    } finally {
      setLoadingTopup(false);
    }
  };

  const handleOpenTopupModal = () => {
    if (!qrData?.iccid) {
      toast.error('No ICCID found. Cannot create topup.');
      return;
    }
    setShowTopupModal(true);
  };

  const shareLink = async () => {
    const url = window.location.href;
    const shareData = {
      title: 'eSIM QR Code - RoamJet',
      text: 'Scan this QR code to install your eSIM',
      url: url
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
        copyLink(); // Fallback to copy
      }
    } else {
      copyLink(); // Fallback to copy
    }
  };

  const downloadQR = () => {
    if (qrData?.qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrData.qrCodeUrl;
      link.download = `esim-qr-${orderId}.png`;
      link.click();
    } else if (qrData?.qrCode) {
      // Generate download for LPA QR code
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      // This would require generating the QR code image
      // For now, just copy the LPA data
      navigator.clipboard.writeText(qrData.qrCode);
      alert('QR code data copied to clipboard');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QR code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <QrCode className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading QR Code</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={fetchQRCode}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>

        {/* Main QR Code Card */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">eSIM QR Code</h1>
              {orderInfo && (
                <div className="mt-4 space-y-1">
                  <p className="text-lg font-medium text-gray-700">{orderInfo.planName}</p>
                  {qrData?.iccid && (
                    <p className="text-sm text-gray-500">ICCID: {qrData.iccid}</p>
                  )}
                  {orderInfo.orderId && (
                    <p className="text-sm text-gray-500">Order #{orderInfo.orderId}</p>
                  )}
                  {orderInfo.amount > 0 && (
                    <p className="text-sm text-gray-500">${Math.round(orderInfo.amount)}</p>
                  )}
                </div>
              )}
            </div>

            {/* QR Code Display */}
            <div className="bg-gray-50 p-8 rounded-xl mb-8">
              {qrData?.qrCode ? (
                <div className="text-center">
                  <div className="w-80 h-80 mx-auto bg-white p-6 rounded-lg border-2 border-green-300 shadow-lg">
                    <LPAQRCodeDisplay lpaData={qrData.qrCode} />
                  </div>
                  <p className="text-sm text-gray-600 mt-4">✅ Real QR Code (Add Cellular Plan)</p>
                  {qrData.iccid && (
                    <p className="text-xs text-gray-500 mt-2">ICCID: {qrData.iccid}</p>
                  )}
                </div>
              ) : qrData?.qrCodeUrl ? (
                <div className="text-center">
                  <div className="w-80 h-80 mx-auto bg-white p-6 rounded-lg border-2 border-blue-300 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={qrData.qrCodeUrl} 
                      alt="eSIM QR Code" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-4">✅ QR Code Image</p>
                </div>
              ) : qrData?.directAppleInstallationUrl ? (
                <div className="text-center">
                  <div className="w-80 h-80 mx-auto bg-white p-6 rounded-lg border-2 border-purple-300 shadow-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-4xl">📱</span>
                      </div>
                      <p className="text-lg font-medium text-gray-700 mb-2">Apple eSIM Installation</p>
                      <a 
                        href={qrData.directAppleInstallationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        Install eSIM
                      </a>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-4">✅ Direct Apple Installation Link</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-80 h-80 mx-auto bg-white p-6 rounded-lg border-2 border-gray-300 shadow-lg flex items-center justify-center">
                    <QrCode className="w-32 h-32 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500 mt-4">No QR code available</p>
                </div>
              )}
            </div>

            {/* Actions Dropdown */}
            <div className="relative dropdown-container">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <MoreVertical className="w-5 h-5 mr-2" />
                <span>Actions</span>
              </button>
              
              {showDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {/* Install */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      handleInstall();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-3 text-green-600" />
                        <span className="text-green-600">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 mr-3 text-blue-600" />
                        <span className="text-gray-700">Install</span>
                      </>
                    )}
                  </button>

                  {/* Share Link */}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      shareLink();
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center border-t border-gray-200"
                  >
                    <Share2 className="w-4 h-4 mr-3 text-blue-600" />
                    <span className="text-gray-700">Share Link</span>
                  </button>

                  {/* Download QR Code */}
                  {(qrData?.qrCodeUrl || qrData?.qrCode) && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        downloadQR();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center border-t border-gray-200"
                    >
                      <Download className="w-4 h-4 mr-3 text-green-600" />
                      <span className="text-gray-700">Download QR Code</span>
                    </button>
                  )}

                  {/* Open in Apple eSIM */}
                  {qrData?.directAppleInstallationUrl && (
                    <a
                      href={qrData.directAppleInstallationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowDropdown(false)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center border-t border-gray-200"
                    >
                      <Smartphone className="w-4 h-4 mr-3 text-purple-600" />
                      <span className="text-gray-700">Open in Apple eSIM</span>
                    </a>
                  )}

                  {/* View Mobile Data */}
                  {qrData?.iccid && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleCheckMobileData();
                      }}
                      disabled={loadingMobileData}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center border-t border-gray-200 disabled:opacity-50"
                    >
                      {loadingMobileData ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-3 text-blue-600 animate-spin" />
                          <span className="text-gray-700">Loading...</span>
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="text-gray-700">View Data Usage</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Topup */}
                  {qrData?.iccid && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        handleOpenTopupModal();
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center border-t border-gray-200"
                    >
                      <Battery className="w-4 h-4 mr-3 text-green-600" />
                      <span className="text-gray-700">Add Data (Topup)</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Topup Modal */}
            {showTopupModal && (
              <TopupModal
                show={showTopupModal}
                selectedOrder={orderInfo ? { iccid: qrData?.iccid, ...orderInfo } : null}
                onClose={() => setShowTopupModal(false)}
                onTopup={handleTopup}
                loadingTopup={loadingTopup}
              />
            )}

            {/* Interactive Installation Instructions */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">How to Install</h3>
                {/* Device Selector */}
                <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setSelectedDevice('ios');
                      setCompletedSteps([]);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                      selectedDevice === 'ios'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    iOS
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDevice('android');
                      setCompletedSteps([]);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                      selectedDevice === 'android'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Radio className="w-4 h-4 mr-2" />
                    Android
                  </button>
                </div>
              </div>

              {/* iOS Instructions */}
              {selectedDevice === 'ios' && (
                <div className="space-y-4">
                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(1)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(1)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 1));
                      } else {
                        setCompletedSteps([...completedSteps, 1]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(1) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          1
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Camera className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Open Camera App</h4>
                      </div>
                      <p className="text-gray-600">Open the Camera app on your iPhone or iPad</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(2)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(2)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 2));
                      } else {
                        setCompletedSteps([...completedSteps, 2]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(2) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          2
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <QrCode className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Scan QR Code</h4>
                      </div>
                      <p className="text-gray-600">Point your camera at the QR code above. A notification will appear at the top of your screen.</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(3)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(3)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 3));
                      } else {
                        setCompletedSteps([...completedSteps, 3]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(3) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          3
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Tap Notification</h4>
                      </div>
                      <p className="text-gray-600">Tap the "Cellular Plan Detected" notification that appears</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(4)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(4)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 4));
                      } else {
                        setCompletedSteps([...completedSteps, 4]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(4) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          4
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Settings className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Follow Setup</h4>
                      </div>
                      <p className="text-gray-600">Follow the on-screen instructions to add the eSIM. You'll be asked to label it (e.g., "Travel" or "Roaming")</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(5)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(5)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 5));
                      } else {
                        setCompletedSteps([...completedSteps, 5]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(5) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          5
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Globe className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Enable Data Roaming</h4>
                      </div>
                      <p className="text-gray-600">Go to Settings → Cellular → [Your eSIM] → Turn on "Data Roaming" to use the eSIM abroad</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Android Instructions */}
              {selectedDevice === 'android' && (
                <div className="space-y-4">
                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(1)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(1)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 1));
                      } else {
                        setCompletedSteps([...completedSteps, 1]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(1) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          1
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Settings className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Open Settings</h4>
                      </div>
                      <p className="text-gray-600">Go to Settings → Network & internet → SIMs → Add eSIM</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(2)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(2)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 2));
                      } else {
                        setCompletedSteps([...completedSteps, 2]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(2) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          2
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <QrCode className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Scan QR Code</h4>
                      </div>
                      <p className="text-gray-600">Select "Use QR code" and scan the QR code above with your camera</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(3)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(3)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 3));
                      } else {
                        setCompletedSteps([...completedSteps, 3]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(3) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          3
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Confirm Installation</h4>
                      </div>
                      <p className="text-gray-600">Review the eSIM details and tap "Add" or "Install" to confirm</p>
                    </div>
                  </div>

                  <div
                    className={`flex items-start p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      completedSteps.includes(4)
                        ? 'bg-green-50 border-green-300'
                        : 'bg-blue-50 border-blue-200 hover:border-blue-300'
                    }`}
                    onClick={() => {
                      if (completedSteps.includes(4)) {
                        setCompletedSteps(completedSteps.filter(s => s !== 4));
                      } else {
                        setCompletedSteps([...completedSteps, 4]);
                      }
                    }}
                  >
                    <div className="flex-shrink-0 mr-4">
                      {completedSteps.includes(4) ? (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          4
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Globe className="w-5 h-5 mr-2 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">Enable Data Roaming</h4>
                      </div>
                      <p className="text-gray-600">Go to Settings → Network & internet → [Your eSIM] → Enable "Data roaming" to use it abroad</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {completedSteps.length > 0 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Installation Progress</span>
                    <span className="text-sm text-blue-700">
                      {completedSteps.length} / {selectedDevice === 'ios' ? 5 : 4} steps completed
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(completedSteps.length / (selectedDevice === 'ios' ? 5 : 4)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;

