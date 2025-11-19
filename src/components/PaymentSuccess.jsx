'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { apiService } from '../services/apiService';
import { configService } from '../services/configService';
import { coinbaseService } from '../services/coinbaseService';
import Image from 'next/image';
import { QrCode, Download, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  console.log('🚀 PaymentSuccess component mounting...');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, loading: authLoading } = useAuth();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);
  const [orderComplete, setOrderComplete] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const hasProcessed = useRef(false);
  const isInIframe = typeof window !== 'undefined' && window !== window.top;

  console.log('🔐 PaymentSuccess - Auth State:', {
    authLoading,
    hasCurrentUser: !!currentUser,
    userEmail: currentUser?.email,
    urlParams: {
      order: searchParams.get('order_id') || searchParams.get('order'),
      email: searchParams.get('email'),
      session_id: searchParams.get('session_id')
    }
  });

  // Create topup record
  const createTopupRecord = async (topupData) => {
    try {
      console.log('📦 Creating topup after payment...');
      
      const result = await apiService.createTopup({
        iccid: topupData.iccid,
        package_id: topupData.packageId
      });

      if (result.success) {
        console.log('✅ Topup created successfully:', result);
        toast.success('Topup added successfully!');
        return { success: true, topupId: result.topupId };
      } else {
        throw new Error(result.error || 'Failed to create topup');
      }
    } catch (error) {
      console.error('❌ Error creating topup:', error);
      throw error;
    }
  };

  // Create order record in Firebase and process with RoamJet API
  const createOrderRecord = async (orderData) => {
    try {
      // Check if we're in test mode
      const stripeMode = await configService.getStripeMode();
      const isTestMode = stripeMode === 'test' || stripeMode === 'sandbox';
      
      console.log('🛒 Creating RoamJet order...');
      console.log('🔍 Stripe Mode:', stripeMode, '| Test Mode:', isTestMode);
      
      // Extract country info from plan name
      const getCountryFromPlan = (planId) => {
        if (!planId) return { code: "US", name: "United States" };
        // Basic country mapping - you can expand this
        const countryMap = {
          'change': { code: "US", name: "United States" },
          'kargi': { code: "GE", name: "Georgia" },
        };
        const countryKey = Object.keys(countryMap).find(key => planId.includes(key));
        return countryMap[countryKey] || { code: "US", name: "United States" };
      };
      
      const countryInfo = getCountryFromPlan(orderData.planId);
      
      // For guest users, store in global orders collection
      const isGuest = !orderData.userId || orderData.isGuest;
      
      // Global order reference (for all users)
      const globalOrderRef = doc(db, 'orders', orderData.orderId);
      
      // User-specific order reference (only for authenticated users)
      const userOrderRef = isGuest ? null : doc(db, 'users', orderData.userId, 'esims', orderData.orderId);
      
      // Step 1: Create order via Python API
      console.log(`📞 Creating order via API (${isTestMode ? 'TEST' : 'LIVE'} mode)`);
      
      const airaloOrderResult = await apiService.createOrder({
        package_id: orderData.planId,
        quantity: "1",
        to_email: orderData.customerEmail,
        description: `eSIM order for ${orderData.customerEmail}`,
        mode: stripeMode,
        isGuest: isGuest
      });
      
      console.log('✅ Order created by backend:', airaloOrderResult);

      // Step 2: Save order to Firebase global orders collection
      await setDoc(globalOrderRef, {
        orderId: orderData.orderId,
        airaloOrderId: airaloOrderResult.airaloOrderId,
        userId: orderData.userId || null,
        planId: orderData.planId,
        planName: orderData.planName,
        amount: orderData.amount,
        currency: orderData.currency,
        customerEmail: orderData.customerEmail,
        status: 'active',
        createdAt: serverTimestamp(),
        airaloOrderData: airaloOrderResult.orderData,
        isTestMode: isTestMode,
        stripeMode: stripeMode,
        isGuest: isGuest,
        countryCode: countryInfo.code,
        countryName: countryInfo.name
      });

      // Also save to user collection if authenticated
      if (userOrderRef) {
        const esimData = {
          orderId: orderData.orderId,
          planId: orderData.planId,
          planName: orderData.planName,
          amount: orderData.amount,
          currency: orderData.currency,
          status: 'active',
          customerEmail: orderData.customerEmail,
          countryCode: countryInfo.code,
          countryName: countryInfo.name,
          createdAt: serverTimestamp(),
          airaloOrderId: airaloOrderResult.airaloOrderId,
          airaloOrderData: airaloOrderResult.orderData
        };
        await setDoc(userOrderRef, esimData);
      }

      // Step 3: Try to get QR code immediately
      let qrCodeData = null;
      try {
        console.log('🔄 Attempting to retrieve QR code for order:', orderData.orderId);
        const qrResult = await apiService.getQrCode(orderData.orderId, isGuest);
        
        if (qrResult.success && qrResult.qrCode) {
          console.log('✅ QR code retrieved:', qrResult);
          qrCodeData = {
            qrCode: qrResult.qrCode,
            qrCodeUrl: qrResult.qrCodeUrl,
            activationCode: qrResult.activationCode,
            iccid: qrResult.iccid,
            directAppleInstallationUrl: qrResult.directAppleInstallationUrl
          };
          
          // Update order with QR code
          await setDoc(globalOrderRef, {
            qrCode: qrResult.qrCode,
            qrCodeUrl: qrResult.qrCodeUrl,
            iccid: qrResult.iccid,
            activationCode: qrResult.activationCode,
            directAppleInstallationUrl: qrResult.directAppleInstallationUrl,
            updatedAt: serverTimestamp()
          }, { merge: true });
          
          if (userOrderRef) {
            await setDoc(userOrderRef, {
              qrCode: qrResult.qrCode,
              qrCodeUrl: qrResult.qrCodeUrl,
              iccid: qrResult.iccid,
              activationCode: qrResult.activationCode,
              directAppleInstallationUrl: qrResult.directAppleInstallationUrl,
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }
      } catch (qrError) {
        console.log('⏳ QR code not ready yet:', qrError.message);
      }

      return { 
        success: true, 
        orderId: orderData.orderId,
        qrCodeData: qrCodeData
      };
    } catch (error) {
      console.error('❌ Error creating order record:', error);
      throw error;
    }
  };

  const handlePaymentSuccess = useCallback(async () => {
    try {
      console.log('🎉 Processing payment success...');
      
      // Check for pending topup order first
      const pendingTopupOrder = localStorage.getItem('pendingTopupOrder');
      if (pendingTopupOrder) {
        try {
          const topupData = JSON.parse(pendingTopupOrder);
          console.log('📦 Processing topup order:', topupData);
          
          if (topupData.type === 'topup' && topupData.iccid && topupData.packageId) {
            // Create topup after payment
            const topupResult = await createTopupRecord(topupData);
            
            if (topupResult.success) {
              // Clear pending topup order
              localStorage.removeItem('pendingTopupOrder');
              
              // Redirect to QR code page or dashboard
              if (topupData.iccid) {
                router.push(`/qr/${topupData.iccid}`);
              } else {
                router.push('/dashboard');
              }
              return;
            }
          }
        } catch (topupError) {
          console.error('❌ Error processing topup order:', topupError);
          localStorage.removeItem('pendingTopupOrder');
        }
      }
      
      // Get parameters from URL
      const orderParam = searchParams.get('order_id') || searchParams.get('order');
      const email = searchParams.get('email');
      const total = searchParams.get('total');
      const currency = searchParams.get('currency') || 'usd';
      const paymentMethod = searchParams.get('payment_method') || 'stripe';
      const sessionId = searchParams.get('session_id');
      const planId = searchParams.get('plan');
      const name = searchParams.get('name');
      const chargeId = searchParams.get('charge_id');

      console.log('📋 URL Parameters:', {
        orderParam,
        email,
        total,
        currency,
        paymentMethod,
        sessionId,
        planId
      });

      // Handle Coinbase payment (has order_id, email, total)
      if (orderParam && email && total) {
        console.log('💰 Processing Coinbase payment success');
        
        // Verify Coinbase charge if chargeId is provided
        if (chargeId && paymentMethod === 'coinbase') {
          try {
            const verified = await coinbaseService.verifyCharge(chargeId);
            if (!verified) {
              console.warn('⚠️ Coinbase charge verification failed, but continuing...');
            }
          } catch (coinbaseError) {
            console.error('⚠️ Error verifying Coinbase payment:', coinbaseError);
          }
        }

        // Extract plan ID from order ID (format: planId-timestamp-random)
        const extractPlanId = (orderId) => {
          if (!orderId) return null;
          const parts = orderId.split('-');
          const timestampIndex = parts.findIndex(part => /^\d{10,}$/.test(part)); // Look for timestamp (10+ digits)
          if (timestampIndex > 0) {
            const extracted = parts.slice(0, timestampIndex).join('-');
            console.log('📦 Extracted plan ID from order ID:', { orderId, extracted });
            return extracted;
          }
          // If no timestamp found, return the original orderId
          console.log('⚠️ No timestamp found in order ID, using as-is:', orderId);
          return orderId;
        };

        const actualPlanId = planId || extractPlanId(orderParam);
        console.log('📦 Final plan ID to use:', { 
          orderParam, 
          planIdFromUrl: planId, 
          extractedFromOrderId: extractPlanId(orderParam),
          actualPlanId 
        });

        if (!actualPlanId) {
          console.error('❌ No valid plan ID found!', { orderParam, planId });
          setError('Invalid order: No plan ID found');
          setProcessing(false);
          return;
        }

        // Support both authenticated and guest users
        const isGuest = !currentUser;
        const orderData = {
          planId: actualPlanId,
          planName: decodeURIComponent(name || 'eSIM Plan'),
          amount: Math.round(parseFloat(total || 0)),
          currency: currency || 'usd',
          customerEmail: email,
          customerId: currentUser?.uid || null,
          orderId: orderParam,
          userId: currentUser?.uid || null,
          paymentMethod: paymentMethod,
          chargeId: chargeId || null,
          isGuest: isGuest
        };
        
        console.log('🎯 Order data prepared:', orderData);

        // Create order record
        const orderResult = await createOrderRecord(orderData);
        
        if (orderResult.success) {
          console.log('✅ Order created successfully');
          setOrderInfo(orderData);
          if (orderResult.qrCodeData) {
            setQrCodeData(orderResult.qrCodeData);
          }
          setOrderComplete(true);
        }
      } 
      // Handle Stripe payment (has session_id, plan)
      else if (sessionId) {
        console.log('💳 Processing Stripe payment success');
        
        // Check for pending topup order for Stripe payments too
        const pendingTopupOrder = localStorage.getItem('pendingTopupOrder');
        if (pendingTopupOrder) {
          try {
            const topupData = JSON.parse(pendingTopupOrder);
            console.log('📦 Processing Stripe topup order:', topupData);
            
            if (topupData.type === 'topup' && topupData.iccid && topupData.packageId) {
              // Create topup after payment
              const topupResult = await createTopupRecord(topupData);
              
              if (topupResult.success) {
                // Clear pending topup order
                localStorage.removeItem('pendingTopupOrder');
                
                // Redirect to QR code page or dashboard
                if (topupData.iccid) {
                  router.push(`/qr/${topupData.iccid}`);
                } else {
                  router.push('/dashboard');
                }
                return;
              }
            }
          } catch (topupError) {
            console.error('❌ Error processing Stripe topup order:', topupError);
            localStorage.removeItem('pendingTopupOrder');
          }
        }
        
        // Regular Stripe order handling
        if (planId) {
          // This would use Firebase functions - for now redirect to dashboard
          router.push('/dashboard');
          return;
        } else {
          // No plan ID, might be a topup - check localStorage again
          router.push('/dashboard');
          return;
        }
      }
      else {
        throw new Error('Missing required payment parameters');
      }
      
    } catch (err) {
      console.error('❌ Payment processing failed:', err);
      setError(`Error processing payment: ${err.message || 'Unknown error'}. Please contact support.`);
    } finally {
      setProcessing(false);
    }
  }, [currentUser, searchParams, router]);

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('⏳ Waiting for auth to load...');
      return;
    }

    // Process payment regardless of authentication status
    // Guest users can complete orders too
    if (!hasProcessed.current) {
      console.log('✅ Processing payment (authenticated:', !!currentUser, ')');
      hasProcessed.current = true;
      handlePaymentSuccess();
    }
  }, [authLoading, currentUser, handlePaymentSuccess]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment and activating eSIM...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/store')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Store
          </button>
        </div>
      </div>
    );
  }

  if (!orderComplete || !orderInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Processing Order</h2>
          <p className="text-gray-600">Your order is being processed. Please check your email or dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
          <p className="text-xl text-gray-600">Your eSIM is now active and ready to use</p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Order Details</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Plan</h3>
              <p className="text-gray-900">{orderInfo.planName}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Order ID</h3>
              <p className="text-gray-900 font-mono text-sm">{orderInfo.orderId}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Amount</h3>
              <p className="text-gray-900">${orderInfo.amount}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Status</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {qrCodeData && qrCodeData.qrCode && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="text-center">
              <QrCode className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your eSIM QR Code</h2>
              <p className="text-gray-600 mb-6">Scan this QR code with your device to activate your eSIM</p>
              
              {qrCodeData.qrCodeUrl && (
                <div className="flex justify-center mb-6">
                  <Image 
                    src={qrCodeData.qrCodeUrl} 
                    alt="eSIM QR Code" 
                    width={256}
                    height={256}
                    className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                  />
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {qrCodeData.qrCodeUrl && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = qrCodeData.qrCodeUrl;
                      link.download = `esim-qr-${orderInfo.orderId}.png`;
                      link.click();
                    }}
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    Download QR Code
                  </button>
                )}
                
                {currentUser && (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Go to Dashboard
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {!qrCodeData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <p className="text-yellow-800">
              Your eSIM QR code is being generated. You will receive it via email shortly.
            </p>
            {currentUser && (
              <button
                onClick={() => router.push('/dashboard')}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
