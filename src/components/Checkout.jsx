'use client';

import React, { useEffect, useState } from 'react';
import { createStoreCheckout, getStorePaymentMethods } from '../services/storePaymentService';
import { coinbaseService } from '../services/coinbaseService';
import { useAuth } from '../contexts/AuthContext';

import { AlertCircle, CreditCard, Coins, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const Checkout = ({ plan }) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [isInIframe, setIsInIframe] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState(['stripe', 'coinbase']);
  const [coinbaseAvailable, setCoinbaseAvailable] = useState(false);

  useEffect(() => {
    // Detect if we're in an iframe
    setIsInIframe(window !== window.top);

    // Load store payment methods and Coinbase availability
    const initPaymentMethods = async () => {
      try {
        const methods = await getStorePaymentMethods();
        setAvailablePaymentMethods(methods);
        const hasCoinbase = methods.includes('coinbase');
        if (hasCoinbase) {
          const available = await coinbaseService.initialize();
          setCoinbaseAvailable(available);
        } else {
          setCoinbaseAvailable(false);
        }
      } catch (err) {
        console.log('⚠️ Could not load payment methods, using defaults:', err);
        setAvailablePaymentMethods(['stripe', 'coinbase']);
        const available = await coinbaseService.initialize();
        setCoinbaseAvailable(available);
      }
    };

    initPaymentMethods();
  }, []);

  const handlePaymentMethodSelect = async (paymentMethod) => {
    if (!currentUser || !plan || isProcessing) return;

    setSelectedPaymentMethod(paymentMethod);
    setIsProcessing(true);
    setError(null);

    try {
      // Generate unique order ID
      const uniqueOrderId = `${plan.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create eSIM order data (store-aware)
      const orderData = {
        orderId: uniqueOrderId,
        planId: plan.id,
        planName: plan.name,
        customerEmail: currentUser.email,
        amount: parseFloat(plan.price) || 0,
        currency: 'usd',
        userId: currentUser.uid
      };

      console.log('💳 Order data for payment (store-aware):', orderData);

      // Store order info in localStorage (order will be created after payment confirmation)
      localStorage.setItem('pendingEsimOrder', JSON.stringify({
        orderId: uniqueOrderId,
        planId: plan.id,
        customerEmail: currentUser.email,
        amount: plan.price,
        currency: 'usd',
        paymentMethod: paymentMethod
      }));

      // Use store-aware payment service (routes to Stripe or Coinbase based on store config)
      await createStoreCheckout({
        paymentMethod,
        orderData
      });
    } catch (err) {
      console.error('❌ Payment redirect failed:', err);
      setError(err.message || 'Failed to redirect to payment');
      setIsProcessing(false);
      toast.error(err.message || 'Failed to start payment process');
    }
  };

  if (!plan) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">No plan selected for checkout</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Please log in to continue</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Plan Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Plan:</span>
              <span className="font-semibold text-gray-900">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Price:</span>
              <span className="font-bold text-xl text-gray-900">${parseFloat(plan.price || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Payment Method</h2>
          
          <div className="space-y-4">
            {/* Stripe Payment Option - shown if enabled for store */}
            {availablePaymentMethods.includes('stripe') && (
            <button
              onClick={() => handlePaymentMethodSelect('stripe')}
              disabled={isProcessing}
              className={`w-full p-6 border-2 rounded-xl transition-all duration-200 flex items-center justify-between ${
                selectedPaymentMethod === 'stripe'
                  ? 'border-tufts-blue bg-tufts-blue/10'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg ${
                  selectedPaymentMethod === 'stripe' ? 'bg-tufts-blue' : 'bg-gray-100'
                }`}>
                  <CreditCard className={`w-6 h-6 ${
                    selectedPaymentMethod === 'stripe' ? 'text-white' : 'text-gray-600'
                  }`} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Credit/Debit Card</h3>
                  <p className="text-sm text-gray-500">Pay with Visa, Mastercard, Amex</p>
                </div>
              </div>
              {isProcessing && selectedPaymentMethod === 'stripe' && (
                <Loader2 className="w-5 h-5 text-tufts-blue animate-spin" />
              )}
            </button>
            )}

            {/* Coinbase Payment Option - shown if enabled for store and configured */}
            {availablePaymentMethods.includes('coinbase') && coinbaseAvailable && (
              <button
                onClick={() => handlePaymentMethodSelect('coinbase')}
                disabled={isProcessing}
                className={`w-full p-6 border-2 rounded-xl transition-all duration-200 flex items-center justify-between ${
                  selectedPaymentMethod === 'coinbase'
                    ? 'border-black bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${
                    selectedPaymentMethod === 'coinbase' ? 'bg-black' : 'bg-gray-100'
                  }`}>
                    <Coins className={`w-6 h-6 ${
                      selectedPaymentMethod === 'coinbase' ? 'text-white' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Coinbase</h3>
                    <p className="text-sm text-gray-500">Pay with Bitcoin, Ethereum, and more (crypto)</p>
                  </div>
                </div>
                {isProcessing && selectedPaymentMethod === 'coinbase' && (
                  <Loader2 className="w-5 h-5 text-black animate-spin" />
                )}
              </button>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {isInIframe && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                <strong>Iframe Detected:</strong> Payment will open in a new window or redirect the parent page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
