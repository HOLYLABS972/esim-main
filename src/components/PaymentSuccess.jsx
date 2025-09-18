'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { processTransactionCommission } from '../services/referralService';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);
  const hasProcessed = useRef(false);

  // Check if link has been used and mark it as used
  const checkAndMarkLinkUsed = async (orderId, userId) => {
    try {
      const orderRef = doc(db, 'users', userId, 'esims', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        if (orderData.linkUsed) {
          return { linkUsed: true, message: 'This payment link has already been used.' };
        }
        if (orderData.processingStatus === 'processing') {
          return { alreadyProcessing: true, message: 'Order is already being processed.' };
        }
        if (orderData.processingStatus === 'completed') {
          return { alreadyCompleted: true, message: 'Order already completed.' };
        }
      }
      
      // Mark link as used immediately with atomic operation
      await setDoc(orderRef, {
        linkUsed: true,
        linkUsedAt: serverTimestamp(),
        processingStatus: 'processing',
        processingStartedAt: serverTimestamp(),
        // Add a unique processing key to prevent race conditions
        processingKey: `${userId}_${orderId}_${Date.now()}`
      }, { merge: true });
      
      return { canProcess: true };
    } catch (error) {
      return { error: error.message };
    }
  };

  // Create order record in Firebase
  const createOrderRecord = async (orderData) => {
    try {
      const orderRef = doc(db, 'users', currentUser.uid, 'esims', orderData.orderId);
      
      // Extract country info from plan name (e.g., "kargi-mobile-7days-1gb" -> "kargi")
      const getCountryFromPlan = (planId) => {
        if (!planId) return { code: "US", name: "United States" };
        
        const countryMap = {
          'kargi': { code: "GE", name: "Georgia" },
          'viennetz': { code: "AT", name: "Austria" },
          'billionconnect': { code: "AE", name: "United Arab Emirates" },
          'default': { code: "US", name: "United States" }
        };
        
        const countryKey = Object.keys(countryMap).find(key => planId.includes(key));
        return countryMap[countryKey] || countryMap.default;
      };
      
      const countryInfo = getCountryFromPlan(orderData.planId);
      
      const esimData = {
        activationDate: null,
        capacity: 13,
        countryCode: countryInfo.code,
        countryName: countryInfo.name,
        createdAt: serverTimestamp(),
        currency: orderData.currency || "USD",
        errorMessage: null,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        iccid: "",
        
        operator: {
          name: "eSIM Provider",
          slug: "esim_provider"
        },
        
        orderResult: {
          activationCode: "",
          confirmationCode: "",
          createdAt: new Date().toISOString(),
          iccid: "",
          isDemo: false,
          orderId: orderData.orderId,
          planId: orderData.planId,
          planName: orderData.planName,
          provider: "dataplans",
          qrCode: "",
          smdpAddress: "",
          status: "pending",
          success: true,
          validUntil: null
        },
        
        period: 365,
        planId: orderData.planId,
        planName: orderData.planName,
        price: orderData.amount,
        purchaseDate: serverTimestamp(),
        qrCode: "",
        status: "pending",
        updatedAt: serverTimestamp(),
        processingStatus: 'completed',
        completedAt: serverTimestamp(),
        // Preserve the existing processing key
        processingKey: `${currentUser.uid}_${orderData.orderId}_${Date.now()}`
      };
      
      // Use updateDoc to merge with existing document instead of overwriting
      await setDoc(orderRef, esimData, { merge: true });
      return { success: true, orderId: orderData.orderId };
      
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      throw error;
    }
  };

  // Process payment success
  const handlePaymentSuccess = useCallback(async () => {
    try {
      const orderParam = searchParams.get('order_id') || searchParams.get('order');
      const planId = searchParams.get('plan_id');
      const email = searchParams.get('email');
      const total = searchParams.get('total');
      const name = searchParams.get('name');
      const currency = searchParams.get('currency');
      const order_id = searchParams.get('order_id');
      
      if (!orderParam || !email || !total) {
        setError('Missing payment information.');
        return;
      }

      // Check if link already used
      const linkCheck = await checkAndMarkLinkUsed(orderParam, currentUser.uid);
      
      if (linkCheck.error) {
        setError('Error checking payment link.');
        return;
      }
      
      if (linkCheck.linkUsed) {
        setError(linkCheck.message);
        return;
      }
      
      if (linkCheck.alreadyProcessing) {
        setError(linkCheck.message);
        return;
      }
      
      if (linkCheck.alreadyCompleted) {
        setError(linkCheck.message);
        return;
      }

      // Prepare order data - use orderParam as the consistent orderId
      const orderData = {
        planId: planId || orderParam,
        planName: decodeURIComponent(name || 'eSIM Plan'),
        amount: Math.round(parseFloat(total || 0)),
        currency: currency || 'usd',
        customerEmail: email,
        customerId: currentUser.uid,
        orderId: orderParam, // Use the order parameter as the consistent ID
        userId: currentUser.uid
      };

      // Create order record
      const orderResult = await createOrderRecord(orderData);
      
      if (orderResult.success) {
        // Process referral commission (this also updates referral usage stats)
        try {
          console.log('💰 Processing referral commission for user:', currentUser.uid);
          console.log('💰 Commission data:', {
            userId: currentUser.uid,
            amount: orderData.amount,
            transactionId: orderResult.orderId,
            planId: orderData.planId,
            planName: orderData.planName
          });
          console.log('💰 Expected commission percentage from settings should be 1%');
          
          const commissionResult = await processTransactionCommission({
            userId: currentUser.uid,
            amount: orderData.amount,
            transactionId: orderResult.orderId,
            planId: orderData.planId,
            planName: orderData.planName
          });

          console.log('💰 Commission result:', commissionResult);
          console.log('💰 Commission result details:', {
            success: commissionResult.success,
            commission: commissionResult.commission,
            referrerId: commissionResult.referrerId,
            referralCode: commissionResult.referralCode,
            commissionId: commissionResult.commissionId
          });

          if (commissionResult.success && commissionResult.commission > 0) {
            console.log(`✅ Referral commission processed: $${commissionResult.commission.toFixed(2)} for referrer ${commissionResult.referrerId}`);
            console.log('📊 Referral usage stats updated');
            
            // Calculate commission percentage
            const commissionPercentage = ((commissionResult.commission / orderData.amount) * 100).toFixed(1);
            
            // Get referrer's email for better display
            let referrerDisplay = commissionResult.referrerId;
            try {
              const referrerDoc = await getDoc(doc(db, 'users', commissionResult.referrerId));
              if (referrerDoc.exists()) {
                const referrerData = referrerDoc.data();
                referrerDisplay = referrerData.email || commissionResult.referrerId;
              }
            } catch (error) {
              console.log('Could not fetch referrer email, using UID');
            }
            
            // Display detailed commission information in snack notification
            toast.success(
              `💰 Commission: ${commissionPercentage}% ($${commissionResult.commission.toFixed(2)}) credited to ${referrerDisplay} via code ${commissionResult.referralCode || 'unknown'}`,
              {
                duration: 6000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  maxWidth: '450px',
                },
              }
            );
          } else if (commissionResult.success) {
            console.log('ℹ️ No referral commission (user did not use referral code)');
            toast.info('ℹ️ No referral code used - no commission earned', {
              duration: 3000,
              style: {
                background: '#3B82F6',
                color: '#fff',
              },
            });
          } else {
            console.error('❌ Referral commission processing failed:', commissionResult.error);
            toast.error(`❌ Commission processing failed: ${commissionResult.error}`, {
              duration: 4000,
              style: {
                background: '#EF4444',
                color: '#fff',
              },
            });
          }
        } catch (commissionError) {
          console.error('❌ Commission processing failed:', commissionError);
          toast.error(`⚠️ Commission processing failed: ${commissionError.message}`, {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          });
        }

        toast.success('Payment successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
      
    } catch (err) {
      console.error('❌ Payment processing failed:', err);
      setError('Error processing payment. Please contact support.');
    } finally {
      setProcessing(false);
    }
  }, [currentUser, searchParams, checkAndMarkLinkUsed, createOrderRecord, processTransactionCommission, router]);

  useEffect(() => {
    if (currentUser && !hasProcessed.current) {
      hasProcessed.current = true;
      handlePaymentSuccess();
    }
  }, [currentUser, handlePaymentSuccess]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="text-8xl text-red-500 mb-4">✕</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 text-lg">{error}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Payment Successful!
        </h2>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. Redirecting to dashboard...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
