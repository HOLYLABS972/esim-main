// Coinbase Commerce service for cryptocurrency payments
import { configService } from './configService';

const COINBASE_COMMERCE_API_URL = 'https://api.commerce.coinbase.com';

class CoinbaseService {
  constructor() {
    this.apiKey = null;
    this.secret = null;
    this.webhookSecret = null;
  }

  // Initialize with API credentials
  async initialize() {
    try {
      console.log('🔄 Initializing Coinbase service...');
      const config = await configService.getCoinbaseConfig();
      console.log('📦 Config received from configService:', {
        hasApiKey: !!config.apiKey,
        hasSecret: !!config.secret,
        apiKeyType: typeof config.apiKey,
        apiKeyValue: config.apiKey ? 'present' : 'missing'
      });
      
      // Trim whitespace from credentials (common issue with .env files)
      this.apiKey = config.apiKey?.trim();
      this.secret = config.secret?.trim();
      this.webhookSecret = config.webhookSecret?.trim();
      
      console.log('🔍 Coinbase config check:', {
        hasApiKey: !!this.apiKey,
        hasSecret: !!this.secret,
        apiKeyLength: this.apiKey?.length || 0,
        secretLength: this.secret?.length || 0,
        apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'none',
        apiKeyAfterTrim: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'MISSING',
        // Don't log actual values for security
      });
      
      // Only API key is required for client-side charge creation
      // The secret is only needed for server-side webhook verification
      if (!this.apiKey) {
        console.warn('⚠️ Coinbase API key not configured');
        console.warn('📋 Please check:');
        console.warn('   1. Firestore config/coinbase document has api_key field');
        console.warn('   2. Environment variable: NEXT_PUBLIC_COINBASE_API_KEY');
        console.warn('   3. Use the API Key from Coinbase Commerce dashboard (Settings > API Keys)');
        console.warn('   4. Restart Next.js dev server after adding environment variables');
        return false;
      }
      
      if (!this.secret) {
        console.log('ℹ️ Coinbase shared secret not configured (optional for client-side, required for webhooks)');
      }
      
      // Validate API key format
      // Coinbase Commerce API keys are typically 64+ characters long
      // If it's 32 characters, it might be the Shared Secret instead
      if (this.apiKey.length === 32) {
        console.error('⚠️ WARNING: API key is 32 characters - this might be the Shared Secret, not the API Key!');
        console.error('📋 Coinbase Commerce API Keys are typically 64+ characters long.');
        console.error('📋 Please verify you\'re using the API Key (not Shared Secret) from Coinbase Commerce dashboard.');
      } else if (this.apiKey.length < 40) {
        console.warn('⚠️ Coinbase API key seems too short. Please verify it\'s correct.');
        console.warn('📋 Expected length: 64+ characters for API Key');
      }
      
      console.log('✅ Coinbase Commerce initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Coinbase:', error);
      return false;
    }
  }

  // Create a charge (payment) for Coinbase Commerce
  async createCharge(data) {
    await this.initialize();
    
    // Only API key is required for creating charges
    if (!this.apiKey) {
      console.error('❌ CRITICAL: API Key is missing!');
      console.error('📋 Debug info:', {
        apiKey: this.apiKey,
        secret: this.secret ? 'present' : 'missing',
        configLoaded: !!this.apiKey
      });
      throw new Error('Coinbase API key not configured. Please set NEXT_PUBLIC_COINBASE_API_KEY in your .env.local file.');
    }

    // Log API key info BEFORE making the request
    console.log('🔍 PRE-REQUEST DEBUG:');
    console.log('  - API Key exists:', !!this.apiKey);
    console.log('  - API Key length:', this.apiKey?.length || 0);
    if (this.apiKey) {
      console.log('  - API Key preview:', `${this.apiKey.substring(0, 15)}...${this.apiKey.substring(this.apiKey.length - 5)}`);
    }

    try {
      const chargeData = {
        name: data.name || 'eSIM Plan Purchase',
        description: data.description || 'eSIM data plan purchase',
        local_price: {
          amount: data.amount.toFixed(2),
          currency: data.currency || 'USD'
        },
        pricing_type: 'fixed_price',
        metadata: {
          order_id: data.orderId,
          plan_id: data.planId,
          customer_email: data.customerEmail,
          ...(data.metadata || {})
        },
        redirect_url: data.redirectUrl || `${window.location.origin}/payment-success`,
        cancel_url: data.cancelUrl || `${window.location.origin}/checkout`
      };

      console.log('🔍 Creating Coinbase charge:', chargeData);
      
      // Log API key details for debugging (masked for security)
      if (this.apiKey) {
        const keyLength = this.apiKey.length;
        const maskedKey = keyLength > 12 
          ? `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(keyLength - 4)}`
          : `${this.apiKey.substring(0, 4)}...`;
        console.log('🔑 Using API Key:', maskedKey);
        console.log('🔑 API Key length:', keyLength);
        console.log('🔑 API Key first 10 chars:', this.apiKey.substring(0, 10));
        console.log('🔑 API Key last 10 chars:', this.apiKey.substring(keyLength - 10));
      } else {
        console.error('❌ API Key is NULL or UNDEFINED!');
      }

      // Log the exact headers being sent (mask API key for security)
      const headers = {
        'Content-Type': 'application/json',
        'X-CC-Api-Key': this.apiKey,
        'X-CC-Version': '2018-03-22'
      };
      
      console.log('📤 Sending request to Coinbase:', {
        url: `${COINBASE_COMMERCE_API_URL}/charges`,
        method: 'POST',
        headers: {
          'Content-Type': headers['Content-Type'],
          'X-CC-Api-Key': this.apiKey ? `${this.apiKey.substring(0, 10)}...${this.apiKey.substring(this.apiKey.length - 5)}` : 'MISSING',
          'X-CC-Version': headers['X-CC-Version']
        }
      });

      const response = await fetch(`${COINBASE_COMMERCE_API_URL}/charges`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(chargeData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: { message: errorText } };
        }
        
        console.error('❌ Coinbase API error:', errorText);
        console.error('🔍 Request details:', {
          url: `${COINBASE_COMMERCE_API_URL}/charges`,
          method: 'POST',
          apiKeyLength: this.apiKey?.length || 0,
          apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) : 'none',
          apiKeySuffix: this.apiKey ? this.apiKey.substring(this.apiKey.length - 10) : 'none',
          status: response.status,
          statusText: response.statusText,
          errorCode: errorData?.error?.code,
          errorMessage: errorData?.error?.message
        });
        
        // Provide helpful error messages
        if (response.status === 401 && errorData?.error?.code === 'no_such_api_key') {
          const helpfulMessage = `
❌ Coinbase API Key Authentication Failed

The API key is being sent but Coinbase doesn't recognize it. Please check:

1. ✅ Verify the API key in Coinbase Commerce dashboard:
   - Go to https://commerce.coinbase.com/dashboard/settings
   - Click "API Keys" section
   - Make sure you copied the full API Key (not Shared Secret)

2. ✅ Check if the API key is active:
   - Make sure it hasn't been revoked or deleted
   - Verify it's from the correct Coinbase Commerce account

3. ✅ Environment mismatch:
   - Make sure you're using the correct API key for the environment
   - Sandbox/test keys only work in sandbox mode
   - Production keys only work in production mode

4. ✅ Copy/Paste issues:
   - Make sure there are no extra spaces before/after the key
   - Verify the entire key was copied (should be 64+ characters)
   - Check for hidden characters or line breaks

5. ✅ Restart server:
   - After updating .env.local, restart Next.js dev server
   - Environment variables are loaded at server startup

Current API Key: ${this.apiKey ? `${this.apiKey.substring(0, 15)}...${this.apiKey.substring(this.apiKey.length - 10)}` : 'NOT SET'}
Length: ${this.apiKey?.length || 0} characters
          `.trim();
          
          console.error(helpfulMessage);
        }
        
        throw new Error(`Coinbase API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Coinbase charge created:', result.data);

      return result.data;
    } catch (error) {
      console.error('❌ Error creating Coinbase charge:', error);
      throw error;
    }
  }

  // Get charge details
  async getCharge(chargeId) {
    await this.initialize();
    
    if (!this.apiKey || !this.secret) {
      throw new Error('Coinbase credentials not configured');
    }

    try {
      const response = await fetch(`${COINBASE_COMMERCE_API_URL}/charges/${chargeId}`, {
        method: 'GET',
        headers: {
          'X-CC-Api-Key': this.apiKey,
          'X-CC-Version': '2018-03-22'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Coinbase API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('❌ Error fetching Coinbase charge:', error);
      throw error;
    }
  }

  // Verify webhook signature (server-side only)
  // Note: This should be implemented server-side using Node.js crypto module
  // Browser-side verification is not secure and should not be used
  verifyWebhookSignature(body, signature) {
    if (!this.webhookSecret) {
      console.warn('⚠️ Webhook secret not configured, skipping signature verification');
      return true;
    }

    // This method should be called server-side only
    // For browser usage, webhook verification must be done on the server
    console.warn('⚠️ Webhook signature verification should be done server-side');
    return false;
  }

  // Create checkout session and redirect
  async createCheckoutSession(orderData) {
    try {
      console.log('🔄 Creating Coinbase checkout session via server API...');
      
      // Use server-side API route to create charge (more secure, uses private key)
      const response = await fetch('/api/coinbase/create-charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData: orderData,
          redirectUrl: `${window.location.origin}/payment-success`
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const result = await response.json();
      const charge = result.charge;
      
      if (!charge) {
        throw new Error('No charge data returned from server');
      }

      // Store charge code (Coinbase Commerce uses 'code' field) in localStorage for reference
      // This will be used when processing payment success to verify the charge status
      if (charge.code || charge.id) {
        const chargeIdentifier = charge.code || charge.id;
        localStorage.setItem(`coinbase_charge_${orderData.orderId}`, chargeIdentifier);
        console.log('💾 Stored Coinbase charge identifier:', chargeIdentifier);
      }

      if (charge.hosted_url) {
        console.log('🔄 Redirecting to Coinbase checkout:', charge.hosted_url);
        console.log('💳 Charge ID:', charge.code || charge.id);
        
        // Check if we're in an iframe
        if (window !== window.top) {
          console.log('🔗 Detected iframe context - redirecting parent window');
          try {
            window.top.location.href = charge.hosted_url;
          } catch (err) {
            console.warn('⚠️ Cannot redirect parent window, trying alternative method', err);
            window.open(charge.hosted_url, '_blank');
          }
        } else {
          console.log('🖥️ Normal window context - redirecting current window');
          window.location.href = charge.hosted_url;
        }
      } else {
        throw new Error('No checkout URL received from Coinbase');
      }

      return charge;
    } catch (error) {
      console.error('❌ Error creating Coinbase checkout session:', error);
      throw error;
    }
  }
}

export const coinbaseService = new CoinbaseService();

