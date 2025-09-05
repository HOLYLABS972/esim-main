'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { esimService } from '../services/esimService';
import toast from 'react-hot-toast';
import QRCode from 'qrcode';

const PaymentSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('Initializing...');
  const hasProcessed = useRef(false);

  // Calculate expiry date (30 days from now)
  const calculateExpiryDate = () => {
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    return expiryDate;
  };

  // Handle QR code download
  const handleDownloadQR = () => {
    if (qrCode && qrCode.qrCode) {
      try {
        // Generate QR code from LPA data
        const canvas = document.createElement('canvas');
        const qr = new QRCode(canvas, {
          text: qrCode.qrCode,
          width: 256,
          height: 256,
          colorDark: '#000000',
          colorLight: '#FFFFFF',
        });
        
        // Convert to blob and download
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `esim-qr-code-${order?.id || 'order'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      } catch (error) {
        console.error('Error downloading QR code:', error);
        toast.error('Failed to download QR code');
      }
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
        needsRetry: false,
        
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

  // Main payment success handler
  const handlePaymentSuccess = async () => {
    if (hasProcessed.current) return;
    
    try {
      hasProcessed.current = true;
      setLoading(true);
      
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
      
      // Progress updates
      setProgress(25);
      setProgressText('Processing payment...');
      
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
      
      setProgress(50);
      setProgressText('Creating order...');
      
      try {
        // Create order in mobile app collection structure
        const orderResult = await createOrderInMobileApp(orderData);
        
        if (orderResult.success) {
          console.log('✅ Order creation successful:', orderResult);
          
          setProgress(75);
          setProgressText('Generating QR code...');
          
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
          
          // Generate real QR code from DataPlans API (now with updated Firebase function)
          console.log('📱 Generating real QR code from DataPlans API...');
          try {
            const qrCodeResult = await esimService.getEsimQrCode(orderResult.orderId);
            console.log('✅ Real QR code generated from DataPlans:', qrCodeResult);
            
            if (qrCodeResult.success && qrCodeResult.qrCode) {
              setQrCode({
                qrCode: qrCodeResult.qrCode,
                qrCodeData: qrCodeResult.qrCodeData,
                planDetails: qrCodeResult.planDetails,
                esimData: qrCodeResult.esimData,
                isReal: true
              });
              
              // Update mobile app collection with QR code and plan details
              try {
                const mobileEsimRef = doc(db, 'users', orderData.customerId, 'esims', orderResult.orderId);
                await setDoc(mobileEsimRef, {
                  // Update QR code fields
                  qrCode: qrCodeResult.qrCode,
                  
                  // Update order result with QR code
                  orderResult: {
                    qrCode: qrCodeResult.qrCode,
                    smdpAddress: qrCodeResult.qrCodeData?.smdpAddress || "",
                    activationCode: qrCodeResult.qrCodeData?.activationCode || "",
                    updatedAt: new Date().toISOString()
                  },
                  
                  // Update plan details from DataPlans
                  capacity: qrCodeResult.planDetails?.capacity || 13,
                  countryCode: qrCodeResult.planDetails?.countryCode || "AE",
                  countryName: qrCodeResult.planDetails?.countryName || "United Arab Emirates",
                  period: qrCodeResult.planDetails?.period || 365,
                  
                  // Update operator details
                  operator: {
                    name: qrCodeResult.planDetails?.operator || "eSIM Provider",
                    slug: qrCodeResult.planDetails?.operator_slug || "esim_provider"
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
          } catch (qrError) {
            console.log('⚠️ Real QR code generation failed:', qrError.message);
            setQrCode({
              error: qrError.message,
              isReal: false
            });
          }
          
          setProgress(100);
          setProgressText('Complete!');
          
          // Complete the process
          setTimeout(() => {
            setLoading(false);
            toast.success('Payment successful! Your eSIM is now active with QR code.');
          }, 1000);
          
        } else {
          throw new Error('Order creation failed');
        }
        
      } catch (orderError) {
        console.error('❌ Order creation failed:', orderError);
        setError('Failed to create order. Please contact support.');
        setLoading(false);
      }
      
    } catch (err) {
      console.error('❌ Payment success processing failed:', err);
      setError('Error processing payment success');
      setLoading(false);
    }
  };

  // Check if this is a payment success redirect
  const orderParam = searchParams.get('order_id') || searchParams.get('order');
  const email = searchParams.get('email');
  const total = searchParams.get('total');
  
  if (orderParam && email && total) {
    console.log('🎉 Payment success detected:', { orderParam, email, total });
    handlePaymentSuccess();
  } else {
    console.log('⚠️ No payment parameters found, showing default message');
    hasProcessed.current = true;
    setLoading(false);
    setError('No payment information found. If you just completed a payment, please wait a moment for the redirect.');
  }

  // Check if user is authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            You must be logged in to view your eSIM.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Processing Error
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Always show the animated loading screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-pulse">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl">📱</span>
              </div>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Payment Successful!
        </h2>
        
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-600 font-medium">Processing payment</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-blue-600 font-medium">Setting up eSIM</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-purple-600 font-medium">Generating QR code</span>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          Please wait while we set up your eSIM. This usually takes a few seconds...
        </p>
        
        {/* Show progress status */}
        {loading && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-700 text-sm">{progressText}</p>
          </div>
        )}
        
        {order && !qrCode && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-blue-700 text-sm">Generating QR code...</p>
          </div>
        )}
        
        {order && qrCode && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-green-700 text-sm">✅ eSIM Setup Complete!</p>
            <p className="text-xs text-green-600 mt-1">Your QR code is ready!</p>
          </div>
        )}
        
        {/* QR Code Display */}
        {order && qrCode && qrCode.qrCode && !qrCode.error && (
          <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 text-center">
              Your eSIM QR Code 📱
            </h3>
            
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
            
            {/* Download Button */}
            <button
              onClick={handleDownloadQR}
              className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-all duration-200 mb-3"
            >
              Download QR Code 💾
            </button>
            
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
        
        {/* Error Display */}
        {order && qrCode && qrCode.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              ⚠️ QR code generation failed: {qrCode.error}
            </p>
            <p className="text-red-500 text-xs mt-2">
              Don't worry! You can still access your eSIM from the dashboard.
            </p>
          </div>
        )}
        
        {/* Always show a button to go to dashboard */}
        <div className="mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
