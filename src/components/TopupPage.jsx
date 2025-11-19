'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Battery, ArrowLeft, Loader2, CreditCard, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { apiService } from '../services/apiService';
import { paymentService } from '../services/paymentService';
import { coinbaseService } from '../services/coinbaseService';
import toast from 'react-hot-toast';

const TopupPage = ({ iccid }) => {
  const router = useRouter();
  const { currentUser, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [acceptedRefund, setAcceptedRefund] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [coinbaseAvailable, setCoinbaseAvailable] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (iccid) {
      fetchOrderByIccid();
      fetchTopupPackages();
      checkCoinbaseAvailability();
    } else {
      setError('No ICCID provided');
      setLoading(false);
    }
  }, [iccid, authLoading]);

  const checkCoinbaseAvailability = async () => {
    try {
      const available = await coinbaseService.initialize();
      console.log('🔍 Coinbase availability check:', available);
      setCoinbaseAvailable(available);
      
      if (!available) {
        console.log('⚠️ Coinbase credentials not found. Please configure in Firestore config/coinbase or environment variables.');
      }
    } catch (err) {
      console.error('❌ Error checking Coinbase availability:', err);
      setCoinbaseAvailable(true); // Still show button even if check fails
    }
  };

  const fetchOrderByIccid = async () => {
    try {
      console.log('📱 Searching for order by ICCID:', iccid);
      setLoading(true);
      setError(null);

      // Helper function to normalize ICCID for comparison
      const normalizeIccid = (iccidValue) => {
        if (!iccidValue) return null;
        return String(iccidValue).trim();
      };

      // Helper function to extract ICCID from order data
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

      const normalizedSearchIccid = normalizeIccid(iccid);
      let orderData = null;
      let orderId = null;

      // Search in user's esims subcollection if authenticated
      if (currentUser) {
        try {
          const esimsRef = collection(db, 'users', currentUser.uid, 'esims');
          const querySnapshot = await getDocs(esimsRef);
          
          for (const docSnap of querySnapshot.docs) {
            const data = docSnap.data();
            const foundIccid = extractIccidFromOrder(data);
            
            if (foundIccid === normalizedSearchIccid) {
              orderData = data;
              orderId = docSnap.id;
              break;
            }
          }
        } catch (userErr) {
          console.log('⚠️ Error searching user esims collection:', userErr);
        }
      }

      // Search in global orders collection
      if (!orderData) {
        try {
          const globalOrdersRef = collection(db, 'orders');
          const globalQuerySnapshot = await getDocs(globalOrdersRef);
          
          for (const docSnap of globalQuerySnapshot.docs) {
            const data = docSnap.data();
            const foundIccid = extractIccidFromOrder(data);
            
            if (foundIccid === normalizedSearchIccid) {
              orderData = data;
              orderId = docSnap.id;
              break;
            }
          }
        } catch (globalErr) {
          console.log('⚠️ Error searching global orders collection:', globalErr);
        }
      }

      if (!orderData) {
        setError(`Order not found for ICCID: ${iccid}`);
        setLoading(false);
        return;
      }

      setOrderInfo({
        orderId: orderId,
        planName: orderData.planName || orderData.package_id || orderData.packageId || 'eSIM Plan',
        customerEmail: orderData.customerEmail || orderData.userEmail || currentUser?.email,
        iccid: iccid
      });
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching order by ICCID:', err);
      setError(err.message || 'Failed to load order data');
      setLoading(false);
    }
  };

  const fetchTopupPackages = async () => {
    try {
      setLoadingPackages(true);
      // Fetch packages - you can filter for topup packages or use all packages
      // For now, we'll fetch all packages and let user select
      const result = await apiService.healthCheck(); // Placeholder
      
      // In a real implementation, you'd fetch topup-specific packages
      // For now, we'll show some example packages
      setAvailablePackages([
        { id: 'topup-1gb', name: '1GB Topup', data: '1GB', price: 4.50, validity: '7 days' },
        { id: 'topup-3gb', name: '3GB Topup', data: '3GB', price: 12.00, validity: '30 days' },
        { id: 'topup-5gb', name: '5GB Topup', data: '5GB', price: 18.00, validity: '30 days' },
        { id: 'topup-10gb', name: '10GB Topup', data: '10GB', price: 32.00, validity: '30 days' },
      ]);
    } catch (error) {
      console.error('❌ Error fetching topup packages:', error);
      toast.error('Failed to load topup packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleTopup = async (paymentMethod = 'stripe') => {
    if (!acceptedRefund) {
      toast.error('Please accept the refund policy to continue');
      return;
    }

    if (!selectedPackage) {
      toast.error('Please select a topup package');
      return;
    }

    if (!iccid) {
      toast.error('No ICCID found. Cannot create topup.');
      return;
    }

    try {
      setIsProcessingPayment(true);
      setSelectedPaymentMethod(paymentMethod);
      
      // Generate unique topup order ID
      const topupOrderId = `topup-${iccid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order data for payment
      const orderData = {
        orderId: topupOrderId,
        planId: selectedPackage.id,
        planName: selectedPackage.name,
        customerEmail: orderInfo?.customerEmail || currentUser?.email || 'customer@example.com',
        amount: selectedPackage.price,
        currency: 'usd',
        type: 'topup', // Mark as topup
        iccid: iccid,
        packageId: selectedPackage.id
      };

      console.log('💳 Topup order data for payment:', orderData);

      // Store topup info in localStorage for after payment
      localStorage.setItem('pendingTopupOrder', JSON.stringify({
        orderId: topupOrderId,
        iccid: iccid,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        amount: selectedPackage.price,
        customerEmail: orderData.customerEmail,
        type: 'topup',
        paymentMethod: paymentMethod
      }));

      // Redirect to payment based on selected method
      if (paymentMethod === 'coinbase') {
        await coinbaseService.createCheckoutSession(orderData);
      } else {
        await paymentService.createCheckoutSession(orderData);
      }
      
    } catch (error) {
      console.error('❌ Payment redirect failed:', error);
      toast.error(error.message || 'Failed to start payment process');
      setIsProcessingPayment(false);
      setSelectedPaymentMethod(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading topup page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Battery className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Topup</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
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
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            {/* Title */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Battery className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">Add Data (Topup)</h1>
              </div>
            </div>

            {/* Order Info */}
            {orderInfo && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 mb-1">eSIM Order</p>
                <p className="font-semibold text-gray-900">{orderInfo.planName || 'Unknown Plan'}</p>
                {iccid && (
                  <>
                    <p className="text-xs text-gray-500 mt-2">ICCID</p>
                    <p className="font-mono text-xs text-gray-700">{iccid}</p>
                  </>
                )}
              </div>
            )}

            {/* Package Selection */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Select Topup Package</h4>
              
              {loadingPackages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading packages...</span>
                </div>
              ) : availablePackages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No topup packages available at the moment.</p>
                  <p className="text-sm mt-2">Please try again later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{pkg.name}</h5>
                          {selectedPackage?.id === pkg.id && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Data: {pkg.data}</p>
                        <p className="text-sm text-gray-600 mb-2">Validity: {pkg.validity}</p>
                        <p className="text-lg font-bold text-gray-900">${pkg.price.toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Terms Checkbox */}
            {selectedPackage && (
              <div className="mb-6">
                <label htmlFor="acceptRefundTopup" className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                  <input
                    id="acceptRefundTopup"
                    type="checkbox"
                    checked={acceptedRefund}
                    onChange={(e) => setAcceptedRefund(e.target.checked)}
                    className={`mt-1 h-4 w-4 rounded border-gray-300 focus:ring-blue-500 ${
                      acceptedRefund ? 'text-blue-600' : ''
                    }`}
                  />
                  <span>
                    I accept the <a href="https://esim.roamjet.net/refund-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Refund Policy</a>
                  </span>
                </label>
              </div>
            )}

            {/* Payment Method Buttons */}
            {selectedPackage && (
              <div className="space-y-3 mb-6">
                {/* Stripe Payment Button */}
                <button
                  onClick={() => handleTopup('stripe')}
                  disabled={!acceptedRefund || isProcessingPayment}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg text-white ${
                    selectedPaymentMethod === 'stripe' 
                      ? 'bg-blue-700 ring-2 ring-blue-300' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } ${!acceptedRefund || isProcessingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessingPayment && selectedPaymentMethod === 'stripe' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                  <span>
                    Pay ${selectedPackage.price.toFixed(2)} - Credit/Debit Card
                  </span>
                </button>

                {/* Coinbase Payment Button */}
                <button
                  onClick={() => handleTopup('coinbase')}
                  disabled={!acceptedRefund || isProcessingPayment || !coinbaseAvailable}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg text-white ${
                    selectedPaymentMethod === 'coinbase' 
                      ? 'bg-gray-900 ring-2 ring-gray-400' 
                      : 'bg-black hover:bg-gray-900'
                  } ${!acceptedRefund || isProcessingPayment || !coinbaseAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessingPayment && selectedPaymentMethod === 'coinbase' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Coins className="w-6 h-6" />
                  )}
                  <span>
                    Pay ${selectedPackage.price.toFixed(2)} - Cryptocurrency
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopupPage;

