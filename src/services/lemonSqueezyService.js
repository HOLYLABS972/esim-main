// Lemon Squeezy service for affiliate payments
import { configService } from './configService';

const LEMON_SQUEEZY_API_URL = 'https://api.lemonsqueezy.com/v1';

class LemonSqueezyService {
  constructor() {
    this.apiKey = null;
    this.storeId = null;
    this.webhookSecret = null;
  }

  // Initialize with API credentials
  async initialize() {
    try {
      console.log('🔄 Initializing Lemon Squeezy service...');
      const config = await configService.getLemonSqueezyConfig();
      
      this.apiKey = config.apiKey?.trim();
      this.storeId = config.storeId?.trim();
      this.webhookSecret = config.webhookSecret?.trim();
      
      console.log('🔍 Lemon Squeezy config check:', {
        hasApiKey: !!this.apiKey,
        hasStoreId: !!this.storeId,
        apiKeyLength: this.apiKey?.length || 0,
        storeIdLength: this.storeId?.length || 0,
      });
      
      if (!this.apiKey) {
        console.warn('⚠️ Lemon Squeezy API key not configured');
        return false;
      }
      
      if (!this.storeId) {
        console.warn('⚠️ Lemon Squeezy Store ID not configured');
        return false;
      }
      
      console.log('✅ Lemon Squeezy initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Lemon Squeezy:', error);
      return false;
    }
  }

  // Create a checkout session
  async createCheckoutSession(orderData) {
    try {
      await this.initialize();
      
      if (!this.apiKey || !this.storeId) {
        throw new Error('Lemon Squeezy API key or Store ID not configured');
      }

      // Use server-side API route to create checkout (more secure)
      const response = await fetch('/api/lemonsqueezy/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData: orderData,
          redirectUrl: `${window.location.origin}/payment-success?payment_method=lemonsqueezy`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      const checkout = result.checkout;
      
      if (!checkout) {
        throw new Error('No checkout data returned from server');
      }

      // Store checkout ID for reference
      if (checkout.id) {
        localStorage.setItem(`lemonsqueezy_checkout_${orderData.orderId}`, checkout.id);
        console.log('💾 Stored Lemon Squeezy checkout ID:', checkout.id);
      }

      if (checkout.attributes?.url) {
        console.log('🔄 Redirecting to Lemon Squeezy checkout:', checkout.attributes.url);
        
        // Check if we're in an iframe
        if (window !== window.top) {
          console.log('🔗 Detected iframe context - redirecting parent window');
          try {
            window.top.location.href = checkout.attributes.url;
          } catch (err) {
            console.warn('⚠️ Cannot redirect parent window, trying alternative method', err);
            window.open(checkout.attributes.url, '_blank');
          }
        } else {
          console.log('🖥️ Normal window context - redirecting current window');
          window.location.href = checkout.attributes.url;
        }
      } else {
        throw new Error('No checkout URL received from Lemon Squeezy');
      }

      return checkout;
    } catch (error) {
      console.error('❌ Error creating Lemon Squeezy checkout session:', error);
      throw error;
    }
  }

  // Get checkout details
  async getCheckout(checkoutId) {
    await this.initialize();
    
    if (!this.apiKey) {
      throw new Error('Lemon Squeezy API key not configured');
    }

    try {
      const response = await fetch(`${LEMON_SQUEEZY_API_URL}/checkouts/${checkoutId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lemon Squeezy API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching Lemon Squeezy checkout:', error);
      throw error;
    }
  }
}

export const lemonSqueezyService = new LemonSqueezyService();
