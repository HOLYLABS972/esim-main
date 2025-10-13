import { loadStripe } from '@stripe/stripe-js';

// Load Stripe (only if API key is provided)
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : Promise.resolve(null);

// Debug Stripe configuration
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Stripe Config Debug:', {
    hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 15) + '...' : 'NOT SET'
  });
}

// Server payments service URL
const SERVER_PAYMENTS_URL = 'https://pay.roamjet.net';

export const paymentService = {
  // Create payment intent and redirect to external payment page
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      console.log('🔍 Creating payment redirect with:', { amount, currency, metadata });
      
      // Use Firebase Functions directly instead of external service
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const createPaymentIntentFn = httpsCallable(functions, 'create_payment_intent');
      
      const result = await createPaymentIntentFn({
        amount: amount,
        currency: currency,
        metadata: metadata
      });
      
      console.log('✅ Payment intent created via Firebase:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  },



  // Confirm payment (not needed for external redirect flow)
  async confirmPayment(paymentIntentId) {
    try {
      console.log('✅ Payment confirmed via external service:', paymentIntentId);
      return { status: 'confirmed' };
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },

  // Get Stripe instance
  async getStripe() {
    return await stripePromise;
  },

  // Create checkout session - USE YOUR SERVER (SINGLE ORDER)
  async createCheckoutSession(orderData) {
    try {
      console.log('🔍 Creating single order checkout via server:', orderData);
      console.log('🌐 Payment server URL:', SERVER_PAYMENTS_URL);
      
      // Use your server's create-payment-order endpoint for single orders
      const response = await fetch(`${SERVER_PAYMENTS_URL}/create-payment-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order: orderData.planId,
          email: orderData.customerEmail,
          name: orderData.planName,
          total: orderData.amount,
          currency: orderData.currency || 'usd',
          domain: window.location.origin
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Single order checkout created via server:', result);
      
      // Redirect to Stripe checkout
      if (result.sessionUrl) {
        console.log('🔄 Redirecting to Stripe checkout for single order:', result.sessionUrl);
        window.location.href = result.sessionUrl;
      } else {
        console.error('❌ Server response missing sessionUrl:', result);
        throw new Error('No session URL received from server');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Error creating single order checkout:', error);
      throw error;
    }
  }
};
