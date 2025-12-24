// Service to call the Python API server for eSIM operations
import { auth } from '../firebase/config';
import { configService } from './configService';

// API URLs
const API_PRODUCTION_URL = process.env.NEXT_PUBLIC_API_URL || 'https://sdk.roamjet.net';
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
      
      // Include status code in error message for better debugging
      const errorMessage = data.error || `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
};

/**
 * Make public request to API (no authentication required)
 */
const makePublicRequest = async (endpoint, options = {}) => {
  try {
    const apiBaseUrl = await getApiBaseUrl(); // Get dynamic URL based on mode
    
    // Ensure we don't include Authorization header for public requests
    const { headers, ...restOptions } = options;
    const publicHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    // Explicitly remove Authorization header if it exists
    delete publicHeaders.Authorization;
    delete publicHeaders['Authorization'];
    
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...restOptions,
      headers: publicHeaders,
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

/**
 * Make request with optional authentication (supports both authenticated and guest users)
 */
const makeOptionalAuthRequest = async (endpoint, options = {}) => {
  try {
    const apiBaseUrl = await getApiBaseUrl();
    const user = auth.currentUser;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };
    
    // Add authentication headers if user is logged in
    if (user) {
      try {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
        console.log('🔐 Making authenticated request');
      } catch (authError) {
        console.warn('⚠️ Could not get auth token, making guest request:', authError);
      }
    } else {
      console.log('👤 Making guest request (no authentication)');
    }
    
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error(`API request to ${endpoint} failed:`, error);
    throw error;
  }
};

export const apiService = {
  /**
   * Create an eSIM order through Firebase Cloud Function
   * @param {Object} orderData - Order details
   * @param {string} orderData.package_id - Airalo package ID (or planId for compatibility)
   * @param {string} orderData.quantity - Number of eSIMs (default: "1")
   * @param {string} orderData.to_email - Customer email
   * @param {string} orderData.description - Order description
   * @param {string} orderData.mode - Mode (test/live) - tells backend whether to use mock or real data
   * @returns {Promise<Object>} Order result with orderId and airaloOrderId
   */
  async createOrder({ package_id, planId, quantity = "1", to_email, description, mode, isGuest = false }) {
    // Support both package_id and planId for compatibility
    const plan_id = package_id || planId;
    
    console.log('📦 Creating order via Firebase Cloud Function:', { plan_id, quantity, to_email, mode, isGuest });
    
    if (!plan_id) {
      throw new Error('package_id or planId is required');
    }

    // Validate plan_id format (should not be empty and should be a string)
    if (typeof plan_id !== 'string' || plan_id.trim() === '') {
      throw new Error(`Invalid package_id format: ${plan_id}`);
    }
    
    try {
      // Check if user is authenticated
      const user = auth.currentUser;
      const isAuthenticated = !!user && !isGuest;
      
      if (!isAuthenticated) {
        throw new Error('User must be authenticated to create an order');
      }
      
      console.log(`📦 Order request: Authenticated user ${user.uid}`);
      
      // Use Firebase Cloud Function instead of SDK server
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const createOrderFn = httpsCallable(functions, 'create_order');
      
      // Get Airalo client ID from Firestore config
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      const configRef = doc(db, 'config', 'airalo');
      const configDoc = await getDoc(configRef);
      let airaloClientId = null;
      if (configDoc.exists()) {
        const configData = configDoc.data();
        airaloClientId = configData.api_key || configData.client_id;
      }
      
      const result = await createOrderFn({
        planId: plan_id.trim(), // Cloud Function expects 'planId'
        quantity: quantity,
        to_email: to_email,
        description: description || `eSIM order for ${to_email}`,
        airalo_client_id: airaloClientId, // Get client_id from config
      });

      console.log('✅ Order created via Cloud Function:', result.data);
      
      // Transform response to match expected format
      return {
        orderId: result.data.orderId,
        airaloOrderId: result.data.airaloOrderId,
        orderData: result.data.orderData,
        esimData: result.data.esimData,
        qrCode: result.data.qrCode,
        iccid: result.data.iccid,
        success: true
      };
    } catch (error) {
      console.error('❌ Error creating order:', error);
      
      // Enhanced error handling for validation errors
      if (error.code === 'invalid-argument' || (error.message && error.message.includes('required'))) {
        const errorMsg = error.message || 'Invalid order data';
        throw new Error(`Invalid order: ${errorMsg}`);
      }
      
      // Enhanced error handling for 422 errors (if passed through)
      if (error.details || (error.message && error.message.includes('422'))) {
        const airaloError = error.details || error.message;
        throw new Error(`Invalid package ID: "${plan_id}". Airalo error: ${airaloError}`);
      }
      
      throw error;
    }
  },

  /**
   * Get Airalo client ID from Firestore config
   * @returns {Promise<string>} Airalo client ID
   */
  async getAiraloClientId() {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const configRef = doc(db, 'config', 'airalo');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        const clientId = configData.api_key || configData.client_id;
        if (clientId) {
          return clientId;
        }
      }
      
      throw new Error('Airalo client ID not found in Firestore config');
    } catch (error) {
      console.error('❌ Error getting Airalo client ID:', error);
      throw new Error('Airalo configuration not found. Please configure Airalo credentials in the admin panel.');
    }
  },

  /**
   * Get QR code for an order via Firebase Cloud Function
   * @param {string} orderId - Firebase order ID (or esimId for compatibility)
   * @returns {Promise<Object>} QR code data
   */
  async getQrCode(orderId) {
    console.log('📱 Getting QR code via Cloud Function for order:', orderId);
    
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const getQrCodeFn = httpsCallable(functions, 'get_esim_qr_code');
      
      // Get Airalo client ID from Firestore config
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      const configRef = doc(db, 'config', 'airalo');
      const configDoc = await getDoc(configRef);
      let airaloClientId = null;
      if (configDoc.exists()) {
        const configData = configDoc.data();
        airaloClientId = configData.api_key || configData.client_id;
      }
      
      const result = await getQrCodeFn({
        esimId: orderId, // Cloud Function expects 'esimId' or 'orderId'
        orderId: orderId,
        airalo_client_id: airaloClientId,
      });

      console.log('✅ QR code retrieved via Cloud Function:', result.data.success);
      return result.data;
    } catch (error) {
      console.error('❌ Error getting QR code:', error);
      throw error;
    }
  },

  /**
   * Get SIM details by ICCID via Firebase Cloud Function
   * @param {string} iccid - SIM ICCID
   * @returns {Promise<Object>} SIM details
   */
  async getSimDetails(iccid) {
    console.log('📱 Getting SIM details via Cloud Function for ICCID:', iccid);
    
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const getSimDetailsFn = httpsCallable(functions, 'get_esim_details_by_iccid');
      
      const result = await getSimDetailsFn({ iccid });

      console.log('✅ SIM details retrieved via Cloud Function');
      return result.data;
    } catch (error) {
      console.error('❌ Error getting SIM details:', error);
      throw error;
    }
  },

  /**
   * Get SIM usage by ICCID via Firebase Cloud Function
   * @param {string} iccid - SIM ICCID
   * @returns {Promise<Object>} Usage data
   */
  async getSimUsage(iccid) {
    console.log('📊 Getting SIM usage via Cloud Function for ICCID:', iccid);
    
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const getSimUsageFn = httpsCallable(functions, 'get_esim_usage_by_iccid');
      
      const result = await getSimUsageFn({ iccid });

      console.log('✅ SIM usage retrieved via Cloud Function');
      return result.data;
    } catch (error) {
      console.error('❌ Error getting SIM usage:', error);
      throw error;
    }
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
   * Get current user balance via Firebase Cloud Function
   * @returns {Promise<Object>} Balance information
   */
  async getBalance() {
    console.log('💰 Fetching user balance via Cloud Function');
    
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      const getBalanceFn = httpsCallable(functions, 'get_user_balance');
      
      const result = await getBalanceFn();
      
      console.log('✅ Balance fetched via Cloud Function:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error getting balance:', error);
      throw error;
    }
  },

  /**
   * Create topup for existing eSIM via Firebase Cloud Function
   * @param {Object} topupData - Topup details
   * @param {string} topupData.iccid - SIM ICCID
   * @param {string} topupData.package_id - Topup package ID
   * @returns {Promise<Object>} Topup result
   */
  async createTopup({ iccid, package_id }) {
    console.log('📦 Creating topup via Cloud Function:', { iccid, package_id });
    
    try {
      const { httpsCallable } = await import('firebase/functions');
      const { functions } = await import('../firebase/config');
      
      // Get Airalo client ID from Firestore config
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      const configRef = doc(db, 'config', 'airalo');
      const configDoc = await getDoc(configRef);
      let airaloClientId = null;
      if (configDoc.exists) {
        const configData = configDoc.data();
        airaloClientId = configData.api_key || configData.client_id;
      }
      
      const createTopupFn = httpsCallable(functions, 'create_topup');
      
      const result = await createTopupFn({
        iccid: iccid,
        package_id: package_id.trim(),
        airalo_client_id: airaloClientId,
      });

      console.log('✅ Topup created via Cloud Function:', result.data);
      return result.data;
    } catch (error) {
      console.error('❌ Error creating topup:', error);
      
      // Enhanced error handling for validation errors
      if (error.code === 'invalid-argument' || (error.message && error.message.includes('required'))) {
        const errorMsg = error.message || 'Invalid topup data';
        throw new Error(`Invalid topup: ${errorMsg}`);
      }
      
      // Enhanced error handling for Airalo API errors
      if (error.details || (error.message && error.message.includes('422'))) {
        const airaloError = error.details || error.message;
        throw new Error(`Topup package "${package_id}" is not compatible with your eSIM. Airalo error: ${airaloError}`);
      }
      
      throw error;
    }
  },

  /**
   * Get mobile data usage/status for eSIM
   * @param {Object} params - Parameters
   * @param {string} params.iccid - SIM ICCID (optional if orderId provided)
   * @param {string} params.orderId - Order ID (optional if iccid provided)
   * @returns {Promise<Object>} Mobile data status
   */
  async getMobileData({ iccid, orderId }) {
    console.log('📊 Getting mobile data status via Next.js API proxy:', { iccid, orderId });
    
    // Use relative path to go through Next.js API route (avoids CORS issues)
    const user = auth.currentUser;
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add authentication headers if user is logged in
    if (user) {
      try {
        const idToken = await user.getIdToken();
        headers['Authorization'] = `Bearer ${idToken}`;
        console.log('🔐 Making authenticated request through proxy');
      } catch (authError) {
        console.warn('⚠️ Could not get auth token, making guest request:', authError);
      }
    } else {
      console.log('👤 Making guest request through proxy (no authentication)');
    }
    
    const response = await fetch('/api/user/mobile-data', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        iccid,
        orderId,
      }),
    });

    // Read response body once (can only be read once)
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      // If response is not JSON, try to get text
      const text = await response.text().catch(() => `Request failed with status ${response.status}`);
      throw new Error(`Invalid response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(result.error || `Request failed with status ${response.status}`);
    }

    console.log('✅ Mobile data status retrieved:', result);
    return result;
  },

  /**
   * Get all packages from Airalo (requires API key)
   * @returns {Promise<Object>} Packages data with global and regional packages
   */
  async getPackages() {
    console.log('📦 Fetching packages from Airalo API...');
    
    try {
      const apiKey = await getApiKey();
      const apiBaseUrl = await getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/packages`, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      console.log('✅ Packages fetched successfully');
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch packages:`, error);
      throw error;
    }
  },

  /**
   * Get topup-compatible packages for an existing eSIM by ICCID
   * @param {string} iccid - SIM ICCID
   * @returns {Promise<Object>} Topup-compatible packages
   */
  async getTopupPackages(iccid) {
    console.log('📦 Fetching topup-compatible packages for ICCID:', iccid);
    
    if (!iccid) {
      throw new Error('ICCID is required to fetch topup packages');
    }

    try {
      const result = await makeOptionalAuthRequest('/api/user/topup-packages', {
        method: 'POST',
        body: JSON.stringify({ iccid }),
      });

      console.log('✅ Topup packages fetched successfully');
      return result;
    } catch (error) {
      console.error(`❌ Failed to fetch topup packages:`, error);
      throw error;
    }
  },
};

