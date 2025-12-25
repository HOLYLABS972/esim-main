import { loadStripe } from '@stripe/stripe-js';
import { configService } from './configService';

// Using Firebase Functions instead of external server
// const SERVER_PAYMENTS_URL = 'https://pay.roamjet.net'; // REMOVED - Using Firebase Functions

// Stripe instance cache
let stripeInstance = null;
let currentStripeMode = null;

// Get or initialize Stripe with the correct key for current mode
async function getStripeInstance() {
  try {
    const mode = await configService.getStripeMode();
    
    // If mode changed, reinitialize Stripe
    if (mode !== currentStripeMode || !stripeInstance) {
      currentStripeMode = mode;
      const publishableKey = await configService.getStripePublishableKey(mode);
      
      if (publishableKey) {
        console.log(`🔑 Loading Stripe in ${mode.toUpperCase()} mode`);
        stripeInstance = await loadStripe(publishableKey);
      } else {
        console.warn('⚠️ No Stripe publishable key found');
        stripeInstance = null;
      }
    }
    
    return stripeInstance;
  } catch (error) {
    console.error('❌ Error loading Stripe:', error);
    return null;
  }
}

export const paymentService = {
  // Get Stripe instance
  async getStripe() {
    return await getStripeInstance();
  },

  // Create payment intent - USE FIREBASE FUNCTIONS
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      console.log('🔍 Creating payment intent via Firebase Functions:', { amount, currency, metadata });
      
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const createPaymentIntentFn = httpsCallable(functions, 'create_payment_intent');
      
      const result = await createPaymentIntentFn({
        amount: amount,
        currency: currency,
        metadata: metadata
      });
      
      console.log('✅ Payment intent created via Firebase Functions:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  },

  // Create checkout session - USE FIREBASE FUNCTIONS (direct call)
  async createCheckoutSession(orderData) {
    try {
      console.log('🔍 Creating checkout session via Firebase Functions:', orderData);
      
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const createCheckoutSessionFn = httpsCallable(functions, 'create_checkout_session');
      
      const result = await createCheckoutSessionFn({
        order: orderData.orderId,
        email: orderData.customerEmail,
        name: orderData.planName,
        total: orderData.amount,
        currency: orderData.currency || 'usd',
        domain: window.location.origin,
        plan: orderData.planId,
        isYearly: orderData.isYearly
      });
      
      console.log('✅ Checkout session created via Firebase Functions:', result.data);
      
      // Redirect immediately to Stripe checkout
      if (result.data.sessionUrl) {
        window.location.href = result.data.sessionUrl;
        return result.data;
      } else {
        console.error('❌ Response missing sessionUrl:', result.data);
        throw new Error('No session URL received from Firebase Function');
      }
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      throw error;
    }
  },

  // Retrieve session - USE FIREBASE FUNCTIONS
  async retrieveSession(sessionId) {
    try {
      console.log('🔍 Retrieving session via Firebase Functions:', sessionId);
      
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const retrieveCheckoutSessionFn = httpsCallable(functions, 'retrieve_checkout_session');
      
      const result = await retrieveCheckoutSessionFn({
        session_id: sessionId
      });
      
      console.log('✅ Session retrieved via Firebase Functions:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error retrieving session:', error);
      throw error;
    }
  },

  // Create customer portal session - USE FIREBASE FUNCTIONS
  async createCustomerPortalSession(customerId, returnUrl) {
    try {
      console.log('🔍 Creating customer portal session via Firebase Functions:', customerId);
      
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const createCustomerPortalSessionFn = httpsCallable(functions, 'create_customer_portal_session');
      
      const result = await createCustomerPortalSessionFn({
        customer_id: customerId,
        return_url: returnUrl || window.location.origin
      });
      
      console.log('✅ Customer portal session created via Firebase Functions:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error creating customer portal session:', error);
      throw error;
    }
  },

  // Check subscription status - USE FIREBASE FUNCTIONS
  async checkSubscriptionStatus(customerId) {
    try {
      console.log('🔍 Checking subscription status via Firebase Functions:', customerId);
      
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const checkSubscriptionStatusFn = httpsCallable(functions, 'check_subscription_status');
      
      const result = await checkSubscriptionStatusFn({
        customer_id: customerId
      });
      
      console.log('✅ Subscription status checked via Firebase Functions:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      throw error;
    }
  }
};
