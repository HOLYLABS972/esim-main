// Service to call the Python API server for eSIM operations
import { auth } from '../firebase/config';
import { configService } from './configService';

// API URLs
const API_PRODUCTION_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';
const API_SANDBOX_URL = process.env.NEXT_PUBLIC_API_SANDBOX_URL || 'https://sandbox.roamjet.net';

/**
 * Get the correct API base URL based on mode
 * @returns {Promise<string>} API base URL
 */
const getApiBaseUrl = async () => {
  try {
    // Check if user is in sandbox/test mode
    const stripeMode = await configService.getStripeMode();
    const isTestMode = stripeMode === 'test' || stripeMode === 'sandbox';
    
    const apiUrl = isTestMode ? API_SANDBOX_URL : API_PRODUCTION_URL;
    
    console.log(`🌐 Using ${isTestMode ? 'SANDBOX' : 'PRODUCTION'} API:`, apiUrl);
    
    return apiUrl;
  } catch (error) {
    console.warn('⚠️ Could not determine mode, defaulting to production API');
    return API_PRODUCTION_URL;
  }
};

/**
 * Get Firebase ID token for authentication
 */
const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

/**
 * Get RoamJet API key (for authenticating with RoamJet API server)
 * This is DIFFERENT from the Airalo API key
 */
const getApiKey = async () => {
  try {
    // First try to get RoamJet API key from environment variable
    const roamjetApiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
    if (roamjetApiKey) {
      console.log('🔑 Using RoamJet API key from environment:', roamjetApiKey.substring(0, 15) + '...');
      return roamjetApiKey;
    }
    
    // Try to get from business_users collection (for current user)
    const user = auth.currentUser;
    if (user) {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const userRef = doc(db, 'business_users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.apiCredentials?.apiKey) {
          console.log('🔑 Using RoamJet API key from business_users collection');
          return userData.apiCredentials.apiKey;
        }
      }
    }
    
    // No API key found - throw error
    console.error('❌ No RoamJet API key configured! Please set NEXT_PUBLIC_ROAMJET_API_KEY in environment variables.');
    throw new Error('RoamJet API key not configured');
  } catch (error) {
    console.error('❌ Error getting RoamJet API key:', error);
    throw new Error('RoamJet API key not configured');
  }
};

/**
 * Make authenticated request to API
 */
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  try {
    const idToken = await getIdToken();
    const apiKey = await getApiKey();
    const apiBaseUrl = await getApiBaseUrl(); // Get dynamic URL based on mode
    
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${idToken}`,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle rate limiting (429 status)
      if (response.status === 429 && data.rateLimitExceeded) {
        const errorMsg = data.error || `Rate limit exceeded. Please wait ${data.secondsRemaining || 60} seconds before trying again.`;
        console.warn('⏱️ Rate limit exceeded:', errorMsg);
        throw new Error(errorMsg);
      }
      
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
};

export const apiService = {
  /**
   * Create an eSIM order through the Python API
   * @param {Object} orderData - Order details
   * @param {string} orderData.package_id - Airalo package ID
   * @param {string} orderData.quantity - Number of eSIMs (default: "1")
   * @param {string} orderData.to_email - Customer email
   * @param {string} orderData.description - Order description
   * @param {string} orderData.mode - Mode (test/live) - tells backend whether to use mock or real data
   * @returns {Promise<Object>} Order result with orderId and airaloOrderId
   */
  async createOrder({ package_id, quantity = "1", to_email, description, mode }) {
    console.log('📦 Creating order via Python API:', { package_id, quantity, to_email, mode });
    
    const result = await makeAuthenticatedRequest('/api/user/order', {
      method: 'POST',
      body: JSON.stringify({
        package_id,
        quantity,
        to_email,
        description,
        mode, // Pass mode to backend
      }),
    });

    console.log('✅ Order created:', result);
    return result;
  },

  /**
   * Get QR code for an order
   * @param {string} orderId - Firebase order ID
   * @returns {Promise<Object>} QR code data
   */
  async getQrCode(orderId) {
    console.log('📱 Getting QR code via Python API for order:', orderId);
    
    const result = await makeAuthenticatedRequest('/api/user/qr-code', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });

    console.log('✅ QR code retrieved:', result.success);
    return result;
  },

  /**
   * Get SIM details by ICCID
   * @param {string} iccid - SIM ICCID
   * @returns {Promise<Object>} SIM details
   */
  async getSimDetails(iccid) {
    console.log('📱 Getting SIM details via Python API for ICCID:', iccid);
    
    const result = await makeAuthenticatedRequest('/api/user/sim-details', {
      method: 'POST',
      body: JSON.stringify({ iccid }),
    });

    console.log('✅ SIM details retrieved');
    return result;
  },

  /**
   * Get SIM usage by ICCID
   * @param {string} iccid - SIM ICCID
   * @returns {Promise<Object>} Usage data
   */
  async getSimUsage(iccid) {
    console.log('📊 Getting SIM usage via Python API for ICCID:', iccid);
    
    const result = await makeAuthenticatedRequest('/api/user/sim-usage', {
      method: 'POST',
      body: JSON.stringify({ iccid }),
    });

    console.log('✅ SIM usage retrieved');
    return result;
  },

  /**
   * Health check for the API server
   * @returns {Promise<Object>} Server health status
   */
  async healthCheck() {
    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/health`);
      return await response.json();
    } catch (error) {
      console.error('API health check failed:', error);
      return { status: 'error', error: error.message };
    }
  },

  /**
   * Get current user balance
   * @returns {Promise<Object>} Balance information
   */
  async getBalance() {
    console.log('💰 Fetching user balance from backend');
    
    const result = await makeAuthenticatedRequest('/api/user/balance', {
      method: 'GET',
    });

    console.log('✅ Balance fetched:', result);
    return result;
  },
};

