'use client';

import React, { useEffect, useState } from 'react';
import { paymentService } from '../services/paymentService';
import { esimService } from '../services/esimService';
import { useAuth } from '../contexts/AuthContext';

import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

const Checkout = ({ plan }) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simple check - if user is logged in and plan exists, redirect to payment
    if (currentUser && plan) {
      console.log('🚀 Redirecting to payment for plan:', plan.name);
      console.log('👤 User email:', currentUser.email);
      
      // Create order and redirect immediately
      const redirectToPayment = async () => {
        try {
          // Create eSIM order
          const orderData = {
            planId: plan.id,
            planName: plan.name,
            customerEmail: currentUser.email,
            amount: plan.price,
            currency: 'usd'
          };

          const order = await esimService.createOrder(orderData);
          console.log('✅ Order created:', order.id);

          // Store order info
          localStorage.setItem('pendingEsimOrder', JSON.stringify({
            orderId: order.id,
            planId: plan.id,
            customerEmail: currentUser.email,
            amount: plan.price,
            currency: 'usd'
          }));

          // Redirect to payment
          const result = await paymentService.createCheckoutSession(orderData);
          
        } catch (err) {
          console.error('❌ Payment redirect failed:', err);
          setError('Failed to redirect to payment');
        }
      };

      redirectToPayment();
    } else if (!currentUser) {
      // Not logged in - redirect to login
      router.push('/login');
    }
  }, [plan, currentUser, router]);

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



  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // This component now only handles the redirect
  // The actual checkout form is not needed since we redirect immediately
  return null;
};

export default Checkout;
