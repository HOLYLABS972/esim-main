'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { esimService } from '../services/esimService';
import { processTransactionCommission } from '../services/referralService';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';
import { MoreVertical, Download } from 'lucide-react';

const PaymentSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { isAdmin } = useAdmin();
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [showCommissionButton, setShowCommissionButton] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const hasProcessed = useRef(false);

  // Calculate expiry date (30 days from now)
  const calculateExpiryDate = () => {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    return expiryDate;
  };

  // Download QR code function
  const handleDownloadQR = async () => {
    if (!qrCode) return;
    
    try {
      if (qrCode.qrCodeUrl) {
        // Download from URL
        const link = document.createElement('a');
        link.href = qrCode.qrCodeUrl;
        link.download = `esim-qr-${order?.id || 'code'}.png`;
        link.click();
      } else if (qrCode.qrCode) {
        // Generate QR code from LPA data
        const QRCode = (await import('qrcode')).default;
        const qrDataUrl = await QRCode.toDataURL(qrCode.qrCode, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `esim-qr-${order?.id || 'code'}.png`;
        link.click();
      }
      toast.success('QR code downloaded successfully!');
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Failed to download QR code');
    }
  };


  // LPA QR Code Display Component
  const LPAQRCodeDisplay = ({ lpaData }) => {
    const [qrCodeUrl, setQrCodeUrl] = useState(null);

    useEffect(() => {
      const generateQR = async () => {
        try {
          const url = await QRCode.toDataURL(lpaData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          setQrCodeUrl(url);
        } catch (err) {
          console.error('Error generating QR code:', err);
        }
      };

      if (lpaData) {
        generateQR();
      }
    }, [lpaData]);

    if (!qrCodeUrl) {
      return (
        <div className="w-40 h-40 bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
          <span className="text-gray-500">Generating...</span>
        </div>
      );
    }

    return (
      <img 
        src={qrCodeUrl} 
        alt="eSIM QR Code" 
        className="w-40 h-40 border-2 border-gray-300 rounded-lg"
      />
    );
  };

  // Create order ONLY in mobile app collection structure
  const createOrderInMobileApp = async (orderData) => {
    try {
      console.log('📝 Creating order in mobile app collection structure...');
      
      const finalOrderId = orderData.orderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order ONLY in users/{userId}/esims (mobile app structure)
      const mobileEsimRef = doc(db, 'users', orderData.customerId, 'esims', finalOrderId);
      
      const esimData = {
        // Exact format that mobile app expects
        activationDate: null,
        capacity: 13, // Will be updated from DataPlans
        countryCode: "AE", // Default, will be updated from DataPlans
        countryName: "United Arab Emirates", // Default, will be updated from DataPlans
        createdAt: serverTimestamp(),
        currency: orderData.currency || "USD",
        errorMessage: null,
        expiryDate: calculateExpiryDate().toISOString(),
        iccid: "", // Will be filled when eSIM is activated
        
        // Operator object
        operator: {
          name: "eSIM Provider",
          slug: "esim_provider"
        },
        
        // Order result object
        orderResult: {
          activationCode: "",
          confirmationCode: "",
          createdAt: new Date().toISOString(),
          iccid: "",
          isDemo: false,
          orderId: finalOrderId,
          planId: orderData.planId,
          planName: orderData.planName,
          provider: "dataplans",
          qrCode: "", // Will be filled when QR code is generated
          smdpAddress: "",
          status: "active",
          success: true,
          validUntil: null
        },
        
        // Plan details
        period: 365, // Default, will be updated from DataPlans
        planId: orderData.planId,
        planName: orderData.planName,
        price: orderData.amount,
        purchaseDate: serverTimestamp(),
        qrCode: "", // Will be filled when QR code is generated
        status: "active",
        updatedAt: serverTimestamp()
      };
      
      await setDoc(mobileEsimRef, esimData);
      
      console.log('✅ Order created successfully in mobile app collection:', finalOrderId);
      return { orderId: finalOrderId, success: true };
      
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      throw error;
    }
  };

  // Order view handler - just display existing order data (for anyone)
  const handleOrderView = async (userId, orderId) => {
    try {
      // Get existing order from Firestore
      const orderRef = doc(db, 'users', userId, 'esims', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        console.log('📋 Found existing order:', orderData);
        
        // Set order state
        setOrder({
          id: orderId,
          planName: orderData.planName || 'eSIM Plan',
          amount: orderData.price || 0,
          currency: orderData.currency || 'usd',
          status: orderData.status || 'active'
        });
        
        // Set QR code if available
        if (orderData.qrCode || orderData.orderResult?.qrCode) {
          setQrCode({
            qrCode: orderData.qrCode || orderData.orderResult?.qrCode,
            qrCodeUrl: orderData.qrCodeUrl || orderData.orderResult?.qrCodeUrl,
            directAppleInstallationUrl: orderData.directAppleInstallationUrl || orderData.orderResult?.directAppleInstallationUrl,
            iccid: orderData.iccid || orderData.orderResult?.iccid,
            lpa: orderData.lpa || orderData.orderResult?.lpa,
            matchingId: orderData.matchingId || orderData.orderResult?.matchingId,
            isReal: true
          });
        } else {
          setQrCode({
            error: 'No QR code available for this order',
            isReal: false
          });
        }
        
      } else {
        throw new Error('Order not found');
      }
      
    } catch (error) {
      console.error('❌ Error loading order for admin view:', error);
      setError('Failed to load order data: ' + error.message);
    }
  };

  // Test mode handler for referral testing (no Airalo API calls) - Admin only
  const handleTestModePayment = async () => {
    if (hasProcessed.current) return;
    
    // Check if user is admin
    if (!isAdmin) {
      setError('Test mode is only available for administrators.');
      return;
    }
    
    // Check if this transaction has already been processed (prevent duplicate on refresh)
    const orderParam = searchParams.get('order_id') || searchParams.get('order');
    const transactionKey = `processed_${orderParam}_${currentUser.uid}`;
    
    if (localStorage.getItem(transactionKey)) {
      console.log('🔄 Test transaction already processed, skipping duplicate processing');
      hasProcessed.current = true;
      return;
    }
    
    try {
      hasProcessed.current = true;
      setTestMode(true);
      const planId = searchParams.get('plan_id');
      const email = searchParams.get('email');
      const total = searchParams.get('total');
      const name = searchParams.get('name');
      const currency = searchParams.get('currency');
      const order_id = searchParams.get('order_id');
      const user_id = searchParams.get('user_id');
      
      console.log('🧪 TEST MODE - Processing referral commission only:', { orderParam, planId, email, total, name, currency, order_id, user_id });
      
      // Prepare order data for commission processing
      const orderData = {
        planId: planId || orderParam || 'test-plan',
        planName: decodeURIComponent(name || 'Test eSIM Plan'),
        amount: Math.round(parseFloat(total || 0)),
        currency: currency || 'usd',
        customerEmail: email,
        customerId: currentUser.uid,
        status: 'active',
        createdAt: serverTimestamp(),
        paymentMethod: 'test',
        orderId: order_id || `test_order_${Date.now()}`,
        userId: user_id || currentUser.uid
      };
      
      // Create a test order in Firebase (without Airalo API)
      const testOrderRef = doc(db, 'users', currentUser.uid, 'esims', orderData.orderId);
      await setDoc(testOrderRef, {
        ...orderData,
        testMode: true,
        qrCode: 'TEST_QR_CODE_FOR_REFERRAL_TESTING',
        qrCodeUrl: null,
        directAppleInstallationUrl: null,
        iccid: `TEST_ICCID_${Date.now()}`,
        lpa: 'TEST_LPA_SERVER',
        matchingId: `TEST_MATCHING_${Date.now()}`,
        countryCode: 'US',
        countryName: 'United States',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Process referral commission
      try {
        console.log('🧪 TEST MODE - Processing referral commission for user:', currentUser.uid);
        const commissionResult = await processTransactionCommission({
          userId: currentUser.uid,
          amount: orderData.amount,
          transactionId: orderData.orderId,
          planId: orderData.planId,
          planName: orderData.planName
        });
        
        if (commissionResult.success && commissionResult.commission > 0) {
          console.log(`✅ TEST MODE - Referral commission processed: $${commissionResult.commission.toFixed(2)} for referrer ${commissionResult.referrerId}`);
          toast.success(`TEST MODE: Referral commission of $${commissionResult.commission.toFixed(2)} credited!`);
        } else if (commissionResult.success) {
          console.log('ℹ️ TEST MODE - No referral commission to process (user did not use referral code)');
          toast.info('TEST MODE: No referral commission (user did not use referral code)');
        } else {
          console.error('❌ TEST MODE - Referral commission processing failed:', commissionResult.error);
          toast.error(`TEST MODE: Referral commission failed - ${commissionResult.error}`);
        }
      } catch (commissionError) {
        console.error('❌ TEST MODE - Error processing referral commission:', commissionError);
        toast.error(`TEST MODE: Referral commission error - ${commissionError.message}`);
      }
      
      // Set test order state
      setOrder({
        id: orderData.orderId,
        planName: orderData.planName,
        amount: orderData.amount,
        currency: orderData.currency,
        status: 'active',
        testMode: true
      });
      
      // Set test QR code
      setQrCode({
        qrCode: 'TEST_QR_CODE_FOR_REFERRAL_TESTING',
        qrCodeUrl: null,
        directAppleInstallationUrl: null,
        iccid: `TEST_ICCID_${Date.now()}`,
        lpa: 'TEST_LPA_SERVER',
        matchingId: `TEST_MATCHING_${Date.now()}`,
        isReal: false
      });
      
      // Mark test transaction as processed to prevent duplicate processing on refresh
      localStorage.setItem(transactionKey, 'true');
      console.log('✅ Test transaction marked as processed:', transactionKey);
      
      toast.success('TEST MODE: Payment processed! Referral commission tested.');
      
    } catch (err) {
      console.error('❌ TEST MODE - Payment processing failed:', err);
      setError('TEST MODE: Error processing payment');
    }
  };

  // Manual commission processing for existing transactions (Admin only)
  const handleManualCommissionProcessing = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can process commissions manually.');
      return;
    }

    try {
      // Get order data from URL params
      const orderParam = searchParams.get('order_id') || searchParams.get('order');
      const planId = searchParams.get('plan_id');
      const email = searchParams.get('email');
      const total = searchParams.get('total');
      const name = searchParams.get('name');
      const currency = searchParams.get('currency');
      const order_id = searchParams.get('order_id');
      const user_id = searchParams.get('user_id');
      
      const orderData = {
        planId: planId || orderParam || 'manual-process',
        planName: decodeURIComponent(name || 'Manual Commission Processing'),
        amount: Math.round(parseFloat(total || 0)),
        currency: currency || 'usd',
        customerEmail: email,
        customerId: currentUser.uid,
        orderId: order_id || `manual_${Date.now()}`,
        userId: user_id || currentUser.uid
      };
      
      console.log('🔧 MANUAL COMMISSION PROCESSING:', orderData);
      
      // Process referral commission
      const commissionResult = await processTransactionCommission({
        userId: currentUser.uid,
        amount: orderData.amount,
        transactionId: orderData.orderId,
        planId: orderData.planId,
        planName: orderData.planName
      });
      
      if (commissionResult.success && commissionResult.commission > 0) {
        console.log(`✅ MANUAL - Referral commission processed: $${commissionResult.commission.toFixed(2)} for referrer ${commissionResult.referrerId}`);
        toast.success(`Manual: Referral commission of $${commissionResult.commission.toFixed(2)} credited!`);
      } else if (commissionResult.success) {
        console.log('ℹ️ MANUAL - No referral commission to process (user did not use referral code)');
        toast('Manual: No referral commission (user did not use referral code)');
      } else {
        console.error('❌ MANUAL - Referral commission processing failed:', commissionResult.error);
        toast.error(`Manual: Referral commission failed - ${commissionResult.error}`);
      }
      
    } catch (commissionError) {
      console.error('❌ MANUAL - Error processing referral commission:', commissionError);
      toast.error(`Manual: Referral commission error - ${commissionError.message}`);
    }
  };

  // Main payment success handler
  const handlePaymentSuccess = async () => {
    if (hasProcessed.current) return;
    
    // Check if this transaction has already been processed (prevent duplicate on refresh)
    const orderParam = searchParams.get('order_id') || searchParams.get('order');
    const transactionKey = `processed_${orderParam}_${currentUser.uid}`;
    
    if (localStorage.getItem(transactionKey)) {
      console.log('🔄 Transaction already processed, skipping duplicate processing');
      hasProcessed.current = true;
      return;
    }
    
    try {
      hasProcessed.current = true;
      
      // Get payment info from URL params
      const orderParam = searchParams.get('order_id') || searchParams.get('order');
      const planId = searchParams.get('plan_id');
      const email = searchParams.get('email');
      const total = searchParams.get('total');
      const name = searchParams.get('name');
      const currency = searchParams.get('currency');
      const order_id = searchParams.get('order_id');
      const user_id = searchParams.get('user_id');
      
      console.log('📋 Payment details:', { orderParam, planId, email, total, name, currency, order_id, user_id });
      
      // Prepare order data
      const orderData = {
        planId: planId || orderParam || 'billionconnect',
        planName: decodeURIComponent(name || 'eSIM Plan'),
        amount: Math.round(parseFloat(total || 0)), // Remove cents
        currency: currency || 'usd',
        customerEmail: email,
        customerId: currentUser.uid,
        status: 'active',
        createdAt: serverTimestamp(),
        paymentMethod: 'stripe',
        orderId: order_id || `order_${Date.now()}`,
        userId: user_id || currentUser.uid
      };
      
      console.log('📝 Creating order in Firebase:', orderData);
      
      try {
        // Create order in mobile app collection structure
        const orderResult = await createOrderInMobileApp(orderData);
        
        if (orderResult.success) {
          console.log('✅ Order creation successful:', orderResult);
          
          // Set the order state
          setOrder({
            id: orderResult.orderId,
            planName: orderData.planName,
            amount: orderData.amount,
            currency: orderData.currency,
            status: orderResult.fallback ? 'pending_verification' : 'active',
            fallback: orderResult.fallback,
            backup: orderResult.backup
          });
          
          // First create an Airalo order, then get QR code
          console.log('📱 Creating Airalo order...');
          let airaloOrderResult = null;
          
          try {
            // Create Airalo order first
            const airaloOrderData = {
              package_id: orderData.planId,
              quantity: "1",
              type: "sim",
              description: `eSIM order for ${orderData.customerEmail}`,
              to_email: orderData.customerEmail,
              sharing_option: ["link"]
            };
            
            console.log('📱 Airalo order data:', airaloOrderData);
            airaloOrderResult = await esimService.createAiraloOrderV2(airaloOrderData);
            console.log('✅ Airalo order created:', airaloOrderResult);
            
            // Process referral commission immediately after successful Airalo order creation
            try {
              console.log('💰 Processing referral commission for user:', currentUser.uid);
              const commissionResult = await processTransactionCommission({
                userId: currentUser.uid,
                amount: orderData.amount,
                transactionId: orderResult.orderId,
                planId: orderData.planId,
                planName: orderData.planName
              });
              
              if (commissionResult.success && commissionResult.commission > 0) {
                console.log(`✅ Referral commission processed: $${commissionResult.commission.toFixed(2)} for referrer ${commissionResult.referrerId}`);
                toast.success(`Referral commission of $${commissionResult.commission.toFixed(2)} credited!`);
              } else if (commissionResult.success) {
                console.log('ℹ️ No referral commission to process (user did not use referral code)');
              } else {
                console.error('❌ Referral commission processing failed:', commissionResult.error);
              }
            } catch (commissionError) {
              console.error('❌ Error processing referral commission:', commissionError);
              // Don't fail the entire process if commission processing fails
            }
            
          // Extract QR code data directly from the order response
          console.log('📱 Extracting QR code from order response...');
          const airaloResponseData = airaloOrderResult.orderData;
          const sims = airaloResponseData?.sims;
          
          if (!sims || !Array.isArray(sims) || sims.length === 0) {
            console.log('❌ No SIMs found in order response, deleting eSIM record...');
            // Delete the eSIM record from Firestore
            try {
              const orderRef = doc(db, 'orders', airaloOrderResult.orderId);
              await deleteDoc(orderRef);
              console.log('✅ eSIM record deleted from Firestore');
            } catch (deleteError) {
              console.error('⚠️ Failed to delete eSIM record:', deleteError);
            }
            throw new Error('No SIMs found in order response');
          }
          
          const simData = sims[0];
          const qrCode = simData?.qrcode;
          const qrCodeUrl = simData?.qrcode_url;
          const directAppleInstallationUrl = simData?.direct_apple_installation_url;
          const iccid = simData?.iccid;
          const lpa = simData?.lpa;
          const matchingId = simData?.matching_id;
          
          console.log('✅ QR code data extracted:', {
            qrCode: qrCode,
            qrCodeUrl: qrCodeUrl,
            directAppleInstallationUrl: directAppleInstallationUrl,
            iccid: iccid,
            lpa: lpa
          });
          console.log('🔍 Full simData:', simData);
          
          if (!qrCode && !qrCodeUrl && !directAppleInstallationUrl) {
            console.log('❌ No QR code data available, deleting eSIM record...');
            // Delete the eSIM record from Firestore
            try {
              const orderRef = doc(db, 'orders', airaloOrderResult.orderId);
              await deleteDoc(orderRef);
              console.log('✅ eSIM record deleted from Firestore');
            } catch (deleteError) {
              console.error('⚠️ Failed to delete eSIM record:', deleteError);
            }
            throw new Error('No QR code data available in order response');
          }
          
          // Create QR code result object to match expected format
          const qrCodeResult = {
            success: true,
            qrCode: qrCode, // Use the actual LPA data (contains "Add Cellular Plan")
            qrCodeUrl: qrCodeUrl,
            directAppleInstallationUrl: directAppleInstallationUrl,
            iccid: iccid,
            lpa: lpa,
            matchingId: matchingId,
            orderDetails: airaloResponseData
          };
            
            if (qrCodeResult.success && qrCodeResult.qrCode) {
              setQrCode({
                qrCode: qrCodeResult.qrCode,
                qrCodeUrl: qrCodeResult.qrCodeUrl,
                directAppleInstallationUrl: qrCodeResult.directAppleInstallationUrl,
                iccid: qrCodeResult.iccid,
                lpa: qrCodeResult.lpa,
                matchingId: qrCodeResult.matchingId,
                orderDetails: qrCodeResult.orderDetails,
                isReal: true
              });
              
              // Update mobile app collection with QR code and plan details
              try {
                const mobileEsimRef = doc(db, 'users', orderData.customerId, 'esims', orderResult.orderId);
                console.log('💾 Storing QR code data:', {
                  qrCode: qrCodeResult.qrCode,
                  qrCodeUrl: qrCodeResult.qrCodeUrl,
                  directAppleInstallationUrl: qrCodeResult.directAppleInstallationUrl
                });
                await setDoc(mobileEsimRef, {
                  // Update QR code fields
                  qrCode: qrCodeResult.qrCode,
                  qrCodeUrl: qrCodeResult.qrCodeUrl,
                  directAppleInstallationUrl: qrCodeResult.directAppleInstallationUrl,
                  
                  // Update order result with QR code
                  orderResult: {
                    qrCode: qrCodeResult.qrCode,
                    qrCodeUrl: qrCodeResult.qrCodeUrl,
                    directAppleInstallationUrl: qrCodeResult.directAppleInstallationUrl,
                    iccid: qrCodeResult.iccid,
                    lpa: qrCodeResult.lpa,
                    matchingId: qrCodeResult.matchingId,
                    updatedAt: new Date().toISOString()
                  },
                  
                  // Update plan details from Airalo order
                  capacity: airaloResponseData?.data || "1 GB",
                  countryCode: airaloResponseData?.package?.split('-')[0] || "AE",
                  countryName: airaloResponseData?.package || "United Arab Emirates",
                  period: airaloResponseData?.validity || 7,
                  
                  // Update operator details
                  operator: {
                    name: airaloResponseData?.package || "eSIM Provider",
                    slug: airaloResponseData?.package_id || "esim_provider"
                  },
                  
                  updatedAt: serverTimestamp()
                }, { merge: true });
                
                console.log('✅ Mobile app collection updated with QR code and plan details');
              } catch (updateError) {
                console.error('⚠️ Failed to update mobile app collection:', updateError);
              }
            } else {
              throw new Error('No QR code data received');
            }
          } catch (airaloError) {
            console.log('⚠️ Airalo order/QR code generation failed:', airaloError.message);
            
            // Delete the eSIM record from Firestore on error
            try {
              if (airaloOrderResult?.orderId) {
                const orderRef = doc(db, 'orders', airaloOrderResult.orderId);
                await deleteDoc(orderRef);
                console.log('✅ eSIM record deleted from Firestore due to error');
              }
            } catch (deleteError) {
              console.error('⚠️ Failed to delete eSIM record on error:', deleteError);
            }
            
            setQrCode({
              error: airaloError.message,
              isReal: false
            });
          }
          
          // Mark transaction as processed to prevent duplicate processing on refresh
          localStorage.setItem(transactionKey, 'true');
          console.log('✅ Transaction marked as processed:', transactionKey);
          
          toast.success('Payment successful! Your eSIM is now active with QR code.');
          // Show commission button for admins
          if (isAdmin) {
            setShowCommissionButton(true);
          }
          
        } else {
          throw new Error('Order creation failed');
        }
        
      } catch (orderError) {
        console.error('❌ Order creation failed:', orderError);
        setError('Failed to create order. Please contact support.');
      }
      
    } catch (err) {
      console.error('❌ Payment success processing failed:', err);
      setError('Error processing payment success');
    }
  };

  // Check if this is a payment success redirect
  useEffect(() => {
    const orderParam = searchParams.get('order_id') || searchParams.get('order');
    const email = searchParams.get('email');
    const total = searchParams.get('total');
    const userId = searchParams.get('user_id');
    const testMode = searchParams.get('test_mode') === 'true';
    
    if (orderParam && email && total) {
      console.log('🎉 Order view detected:', { orderParam, email, total, userId, testMode });
      
      if (userId) {
        // Show read-only view for specific user's order
        handleOrderView(userId, orderParam);
      } else {
        // Process as new payment (for regular users) - but wait for currentUser to load
        if (currentUser) {
          if (testMode) {
            handleTestModePayment();
          } else {
            handlePaymentSuccess();
          }
        }
      }
    } else {
      console.log('⚠️ No order parameters found, showing default message');
      hasProcessed.current = true;
      setError('No order information found.');
    }
    
    // Show commission button for admins if order parameters exist
    const hasOrderParams = (searchParams.get('order_id') || searchParams.get('order')) && 
                          searchParams.get('email') && 
                          searchParams.get('total');
    
    if (hasOrderParams && isAdmin) {
      setShowCommissionButton(true);
    }
  }, [searchParams, currentUser]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.menu-container')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // No authentication check - allow anyone to view order details

  // Always show the success screen - no error handling
  if (error) {
    // Still show success screen even with errors
    console.error('Error occurred but showing success screen:', error);
  }


  // Only show success screen when order data is ready - no prescreen
  if (!order) {
    return null; // Don't show anything until order is ready
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        {testMode && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
            <div className="flex items-center justify-center space-x-2">
              <span className="text-green-600 font-semibold">🧪 ADMIN TEST MODE</span>
              <span className="text-green-600 text-sm">No Airalo API calls</span>
            </div>
          </div>
        )}
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Payment Successful!
        </h2>
        
        {qrCode && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-700 text-sm">✅ eSIM Setup Complete!</p>
            <p className="text-xs text-green-600 mt-1">Your QR code is ready!</p>
          </div>
        )}
        
        {/* QR Code Display */}
        {qrCode && qrCode.qrCode && !qrCode.error && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Your eSIM QR Code 📱
              </h3>
              
              {/* 3-dots menu */}
              <div className="relative menu-container">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                
                {showMenu && (
                  <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-10 min-w-[200px]">
                    <button
                      onClick={() => {
                        handleDownloadQR();
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR Code</span>
                    </button>
                    
                    {isAdmin && (
                      <button
                        onClick={() => {
                          handleManualCommissionProcessing();
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                      >
                        <span>💰</span>
                        <span>Process Commission (17%)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Order Summary */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-700">
                <p><strong>Plan:</strong> {order.planName}</p>
                <p><strong>Amount:</strong> ${order.amount}</p>
                <p><strong>Status:</strong> <span className="text-green-600 font-medium">{order.status}</span></p>
              </div>
            </div>
            
            {/* QR Code Image */}
            <div className="flex justify-center mb-3">
              {qrCode.qrCodeUrl ? (
                <img 
                  src={qrCode.qrCodeUrl} 
                  alt="eSIM QR Code" 
                  className="w-40 h-40 border-2 border-gray-300 rounded-lg"
                />
              ) : (
                <LPAQRCodeDisplay lpaData={qrCode.qrCode} />
              )}
            </div>
            
            {/* Instructions */}
            <div className="text-sm text-gray-600 text-left">
              <p className="mb-2"><strong>How to use:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open your phone's camera app</li>
                <li>Point it at the QR code above</li>
                <li>Follow the prompts to install your eSIM</li>
              </ol>
            </div>
          </div>
        )}
        
        {/* Go to dashboard button */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
