'use client';

import React, { useEffect, useState } from 'react';
import { coinbaseService } from '../services/coinbaseService';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Coins, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const Checkout = ({ plan }) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [coinbaseAvailable, setCoinbaseAvailable] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const available = await coinbaseService.initialize();
        setCoinbaseAvailable(available);
      } catch (err) {
        console.log('⚠️ Could not initialize Coinbase:', err);
        setCoinbaseAvailable(false);
      }
    };
    init();
  }, []);

  const handleCoinbasePayment = async () => {
    if (!currentUser || !plan || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const uniqueOrderId = `${plan.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const orderData = {
        orderId: uniqueOrderId,
        planId: plan.id,
        planName: plan.name,
        customerEmail: currentUser.email,
        amount: parseFloat(plan.price) || 0,
        currency: 'usd',
        userId: currentUser.uid
      };

      console.log('💳 Creating Coinbase checkout:', orderData);

      localStorage.setItem('pendingEsimOrder', JSON.stringify({
        orderId: uniqueOrderId,
        planId: plan.id,
        customerEmail: currentUser.email,
        amount: plan.price,
        currency: 'usd',
        paymentMethod: 'coinbase'
      }));

      await coinbaseService.createCheckoutSession(orderData);
    } catch (err) {
      console.error('❌ Coinbase payment failed:', err);
      setError(err.message || 'Failed to start payment process');
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

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Plan Summary */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-500">Data</span>
          <span className="font-medium">{plan.data}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-gray-500">Validity</span>
          <span className="font-medium">{plan.validity_days || plan.period} days</span>
        </div>
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <span className="text-gray-900 font-semibold">Total</span>
          <span className="text-xl font-bold text-blue-600">${plan.price}</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Coinbase Payment Button */}
      <button
        onClick={handleCoinbasePayment}
        disabled={isProcessing || !coinbaseAvailable}
        className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl font-semibold text-lg transition-all ${
          isProcessing || !coinbaseAvailable
            ? 'bg-gray-300 cursor-not-allowed text-gray-500'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
        }`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Coins className="w-5 h-5" />
            Pay with Crypto
          </>
        )}
      </button>

      {!coinbaseAvailable && !isProcessing && (
        <p className="text-sm text-gray-500 text-center mt-3">
          Crypto payments are being configured. Please try again later.
        </p>
      )}

      <p className="text-xs text-gray-400 text-center mt-4">
        Powered by Coinbase Commerce. Pay with Bitcoin, Ethereum, USDC, and more.
      </p>
    </div>
  );
};

export default Checkout;
