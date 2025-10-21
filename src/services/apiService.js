// Service to call the Python API server for eSIM operations
import { auth } from '../firebase/config';
import { configService } from './configService';

// Get API URL from environment
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.roamjet.net';

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
 * Get API key from config service (supports real-time updates)
 */
const getApiKey = async () => {
  try {
    // Try to get from config service first (supports real-time updates)
    const airaloConfig = await configService.getAiraloConfig();
    if (airaloConfig.apiKey) {
      console.log('🔑 Using API key from config service:', airaloConfig.apiKey.substring(0, 10) + '...');
      return airaloConfig.apiKey;
    }
    
    // Fallback to environment variable
    const envKey = process.env.NEXT_PUBLIC_API_KEY;
    if (envKey) {
      console.log('🔑 Using API key from environment variable');
      return envKey;
    }
    
    // No API key found - throw error
    console.error('❌ No API key configured! Please set up API key in Firebase or environment variables.');
    throw new Error('API key not configured');
  } catch (error) {
    console.error('❌ Error getting API key:', error);
    throw new Error('API key not configured');
  }
};

/**
 * Make authenticated request to API
 */
const makeAuthenticatedRequest = async (endpoint, options = {}) => {
  try {
    const idToken = await getIdToken();
    const apiKey = await getApiKey();
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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
      const response = await fetch(`${API_BASE_URL}/health`);
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

