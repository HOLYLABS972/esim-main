// Configuration service to read admin settings
import { doc, getDoc, addDoc, serverTimestamp, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

class ConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.listeners = new Map(); // Track active listeners
  }

  // Get Stripe mode (test/live) from Remote Config only
  async getStripeMode() {
    // Check URL parameters first for mode override (for testing)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlMode = urlParams.get('mode');
      if (urlMode && ['test', 'sandbox', 'live', 'production'].includes(urlMode)) {
        console.log('🌐 URL mode override detected:', urlMode);
        return urlMode;
      }
    }
    
    // Only use Remote Config - no fallbacks
    if (typeof window === 'undefined') {
      console.log('⚠️ Remote Config not available on server-side, defaulting to production');
      return 'production';
    }
    
    try {
      const { remoteConfig } = await import('../firebase/config');
      const { fetchAndActivate, getValue } = await import('firebase/remote-config');
      
      if (!remoteConfig) {
        console.error('❌ Remote Config not initialized');
        throw new Error('Remote Config not initialized');
      }
      
      console.log('🔍 Fetching Remote Config...');
      
      // Fetch and activate Remote Config
      const activated = await fetchAndActivate(remoteConfig);
      console.log('📡 Remote Config fetch result:', activated ? 'activated' : 'using cached');
      
      // Try different possible parameter names
      const possibleKeys = ['stripe_mode', 'stripeMode', 'STRIPE_MODE', 'stripe-mode'];
      let modeValue = null;
      let usedKey = null;
      
      for (const key of possibleKeys) {
        try {
          const value = getValue(remoteConfig, key);
          console.log(`🔍 Checking Remote Config key "${key}":`, {
            exists: !!value,
            source: value?.getSource(),
            value: value?.asString ? value.asString() : value?._value
          });
          
          if (value) {
            const stringValue = value.asString ? value.asString() : (value._value || '');
            if (stringValue && stringValue.trim() !== '') {
              modeValue = stringValue;
              usedKey = key;
              break;
            }
          }
        } catch (keyError) {
          console.log(`⚠️ Key "${key}" not found in Remote Config`);
        }
      }
      
      if (modeValue) {
        const mode = modeValue.trim().toLowerCase();
        console.log(`🔍 Raw Remote Config value from "${usedKey}":`, modeValue);
        
        // Normalize mode values
        const normalizedMode = mode === 'live' ? 'production' : mode;
        
        if (['test', 'sandbox', 'live', 'production'].includes(normalizedMode)) {
          console.log(`✅ Stripe mode loaded from Remote Config (${usedKey}):`, normalizedMode);
          return normalizedMode;
        } else {
          console.error(`❌ Invalid mode value from Remote Config: "${modeValue}" (normalized: "${normalizedMode}")`);
          throw new Error(`Invalid Stripe mode in Remote Config: ${modeValue}`);
        }
      } else {
        console.error('❌ No stripe_mode found in Remote Config');
        throw new Error('stripe_mode parameter not found in Remote Config');
      }
    } catch (error) {
      console.error('❌ Error loading Stripe mode from Remote Config:', error);
      throw new Error(`Failed to load Stripe mode from Remote Config: ${error.message}`);
    }
  }

  // Get DataPlans environment (test/production)
  async getDataPlansEnvironment() {
    try {
      // Check URL parameters first for mode override
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlMode = urlParams.get('mode');
        if (urlMode && ['test', 'sandbox', 'live', 'production'].includes(urlMode)) {
          console.log('🌐 URL environment override detected:', urlMode);
          return urlMode;
        }
      }
      
      // Check API key mode from business dashboard
      try {
        const apiKeyMode = await this.getApiKeyMode();
        if (apiKeyMode === 'sandbox') {
          console.log('🔑 API key mode detected as sandbox');
          return 'sandbox';
        }
      } catch (error) {
        console.log('⚠️ Could not detect API key mode:', error);
      }
      
      // Default to production environment
      console.log('🚀 DEFAULT: Using PRODUCTION environment');
      return 'production';
    } catch (error) {
      console.error('❌ Error loading DataPlans environment:', error);
      return 'production';
    }
  }

  // Get Airalo API configuration
  async getAiraloConfig() {
    try {
      // First try to get from Firestore config/airalo
      const configRef = doc(db, 'config', 'airalo');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        if (configData.api_key) {
          console.log('✅ Airalo API key loaded from Firestore config');
          return {
            apiKey: configData.api_key,
            environment: configData.environment || 'sandbox',
            baseUrl: 'https://partners-api.airalo.com/v2'
          };
        }
      }
      
      // Try to get from business_users collection (business dashboard)
      try {
        const businessUsersRef = collection(db, 'business_users');
        const businessUsersSnapshot = await getDocs(businessUsersRef);
        
        for (const userDoc of businessUsersSnapshot.docs) {
          const userData = userDoc.data();
          if (userData.apiCredentials?.apiKey) {
            console.log('✅ Airalo API key loaded from business_users');
            return {
              apiKey: userData.apiCredentials.apiKey,
              environment: userData.apiCredentials.mode || 'sandbox',
              baseUrl: 'https://partners-api.airalo.com/v2'
            };
          }
        }
      } catch (error) {
        console.log('⚠️ Could not read from business_users:', error);
      }
      
      // Fallback to localStorage
      const savedKey = localStorage.getItem('airalo_api_key');
      const savedEnv = localStorage.getItem('airalo_environment') || 'test';
      
      if (savedKey) {
        console.log('✅ Airalo API key loaded from localStorage');
        return {
          apiKey: savedKey,
          environment: savedEnv,
          baseUrl: 'https://partners-api.airalo.com/v2'
        };
      }
      
      // Default configuration
      console.log('⚠️ No Airalo API key found, using default configuration');
      return {
        apiKey: null,
        environment: 'sandbox',
        baseUrl: 'https://sandbox-partners-api.airalo.com/v2'
      };
    } catch (error) {
      console.error('❌ Error loading Airalo configuration:', error);
      return {
        apiKey: null,
        environment: 'sandbox',
        baseUrl: 'https://sandbox-partners-api.airalo.com/v2'
      };
    }
  }

  // Get Stripe publishable key based on mode - Remote Config only
  async getStripePublishableKey(mode = 'production') {
    console.log('🔍 Getting Stripe publishable key for mode:', mode);
    
    // Hardcoded test key for test/sandbox mode
    if (mode === 'test' || mode === 'sandbox') {
      const testKey = 'pk_test_51QgvHMDAQpPJFhcuO3sh2pE1JSysFYHgJo781w5lzeDX6Qh9P026LaxpeilCyXx73TwCLHcF5O0VQU45jPZhLBK800G6bH5LdA';
      console.log('🔑 Using hardcoded TEST publishable key');
      return testKey;
    }
    
    // Only use Remote Config for production keys
    if (typeof window === 'undefined') {
      // Server-side: use environment variable as fallback
      const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (envKey) {
        console.log('🔑 Using LIVE publishable key from environment (server-side)');
        return envKey;
      }
      throw new Error('Stripe publishable key not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE in environment variables.');
    }
    
    try {
      const { remoteConfig } = await import('../firebase/config');
      const { fetchAndActivate, getValue } = await import('firebase/remote-config');
      
      if (!remoteConfig) {
        throw new Error('Remote Config not initialized');
      }
      
      await fetchAndActivate(remoteConfig);
      
      // Try different possible parameter names
      const possibleKeys = [
        'stripe_live_publishable_key',
        'stripeLivePublishableKey',
        'STRIPE_LIVE_PUBLISHABLE_KEY',
        'stripe_publishable_key',
        'stripePublishableKey'
      ];
      
      for (const key of possibleKeys) {
        try {
          const publishableKey = getValue(remoteConfig, key);
          const keyValue = publishableKey?.asString ? publishableKey.asString() : (publishableKey?._value || '');
          
          if (keyValue && keyValue.trim() !== '') {
            console.log(`🔑 Using LIVE publishable key from Remote Config (${key})`);
            return keyValue.trim();
          }
        } catch (keyError) {
          // Try next key
        }
      }
      
      // Fallback to environment variable if Remote Config doesn't have it
      const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (envKey) {
        console.log('🔑 Using LIVE publishable key from environment (Remote Config fallback)');
        return envKey;
      }
      
      throw new Error('Stripe publishable key not found in Remote Config or environment variables');
    } catch (error) {
      console.error('❌ Error loading Stripe publishable key:', error);
      
      // Log the error if it's related to expired keys
      if (error.message && error.message.includes('expired')) {
        this.logExpiredStripeKey('publishable', error);
      }
      
      throw new Error(`Stripe publishable key not configured: ${error.message}`);
    }
  }

  // Get Stripe secret key based on mode (for server-side)
  async getStripeSecretKey(mode = 'production') {
    try {
      // Try to get keys from Firestore first
      const configRef = doc(db, 'config', 'stripe');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        
        if (mode === 'live' || mode === 'production') {
          const liveKey = configData.liveSecretKey || configData.live_secret_key;
          if (liveKey) {
            console.log('🔑 Using live secret key from Firebase');
            return liveKey;
          }
        } else if (mode === 'test') {
          const testKey = configData.testSecretKey || configData.test_secret_key;
          if (testKey) {
            console.log('🔑 Using test secret key from Firebase');
            return testKey;
          }
        }
      }
      
      // Fallback to environment variables
      console.log('⚠️ No Stripe secret keys found in Firebase, falling back to environment variables');
      if (mode === 'live' || mode === 'production') {
        return process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
      } else {
        return process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
      }
    } catch (error) {
      console.error('❌ Error loading Stripe secret keys from Firestore:', error);
      
      // Final fallback to environment variables
      if (mode === 'live' || mode === 'production') {
        return process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
      } else {
        return process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
      }
    }
  }

  // Log expired Stripe key event
  async logExpiredStripeKey(keyType = 'unknown', error = null) {
    try {
      const logData = {
        type: 'stripe',
        level: 'error',
        message: `Expired Stripe ${keyType} key detected`,
        details: error ? `Error: ${error.message}` : 'Stripe key validation failed',
        timestamp: serverTimestamp(),
        metadata: {
          keyType,
          errorCode: error?.code || 'unknown',
          userAgent: navigator.userAgent,
          url: window.location.href
        }
      };

      await addDoc(collection(db, 'application_logs'), logData);
      console.log('✅ Expired Stripe key logged to application logs');
    } catch (logError) {
      console.error('❌ Failed to log expired Stripe key:', logError);
    }
  }

  // Log promocode usage event
  async logPromocodeUsage(promocode, userId, action, details = {}) {
    try {
      const logData = {
        type: 'promocode',
        level: action === 'used' ? 'success' : 'info',
        message: `Promocode "${promocode}" ${action}`,
        details: details.message || `Promocode ${action} by user`,
        timestamp: serverTimestamp(),
        userId: userId,
        metadata: {
          promocode,
          action,
          discountAmount: details.discountAmount || null,
          originalAmount: details.originalAmount || null,
          finalAmount: details.finalAmount || null,
          planId: details.planId || null,
          country: details.country || null,
          userAgent: navigator.userAgent,
          url: window.location.href,
          ip: details.ip || null
        }
      };

      await addDoc(collection(db, 'application_logs'), logData);
      console.log(`✅ Promocode ${action} logged to application logs`);
    } catch (logError) {
      console.error('❌ Failed to log promocode usage:', logError);
    }
  }

  // Get Coinbase Commerce API configuration
  async getCoinbaseConfig() {
    try {
      // First try to get from Firestore config/coinbase
      const configRef = doc(db, 'config', 'coinbase');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        if (configData.api_key || configData.apiKey) {
          console.log('✅ Coinbase API key loaded from Firestore');
          return {
            apiKey: configData.api_key || configData.apiKey,
            secret: configData.secret || configData.shared_secret || configData.webhookSecret,
            webhookSecret: configData.webhook_secret || configData.webhookSecret || configData.secret
          };
        }
      }
      
      // Fallback to environment variables
      const envApiKey = process.env.NEXT_PUBLIC_COINBASE_API_KEY;
      const envSecret = process.env.COINBASE_SECRET;
      const envWebhookSecret = process.env.COINBASE_WEBHOOK_SECRET;
      
      if (envApiKey) {
        console.log('✅ Coinbase API key loaded from environment variable');
        return {
          apiKey: envApiKey,
          secret: envSecret,
          webhookSecret: envWebhookSecret
        };
      }
      
      // No API key found
      console.log('⚠️ No Coinbase API key found');
      return {
        apiKey: null,
        secret: null,
        webhookSecret: null
      };
    } catch (error) {
      console.error('❌ Error loading Coinbase configuration:', error);
      return {
        apiKey: null,
        secret: null,
        webhookSecret: null
      };
    }
  }

  // Get OpenRouter API configuration (for AI-generated content)
  async getOpenRouterConfig() {
    try {
      // First try to get from Firestore config tab
      const configRef = doc(db, 'config', 'openrouter');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        if (configData.api_key) {
          console.log('✅ OpenRouter API key loaded from Firestore');
          return {
            apiKey: configData.api_key,
            model: configData.model || 'openai/gpt-3.5-turbo',
            baseUrl: 'https://openrouter.ai/api/v1',
            maxTokens: configData.max_tokens || 150,
            temperature: configData.temperature || 0.7,
            siteName: configData.site_name || 'RoamJet',
            siteUrl: configData.site_url || 'https://esim.roamjet.net'
          };
        }
      }
      
      // Fallback to environment variable
      const envKey = process.env.OPENROUTER_API_KEY;
      if (envKey) {
        console.log('✅ OpenRouter API key loaded from environment variable');
        return {
          apiKey: envKey,
          model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
          baseUrl: 'https://openrouter.ai/api/v1',
          maxTokens: parseInt(process.env.OPENROUTER_MAX_TOKENS) || 150,
          temperature: parseFloat(process.env.OPENROUTER_TEMPERATURE) || 0.7,
          siteName: process.env.OPENROUTER_SITE_NAME || 'RoamJet',
          siteUrl: process.env.OPENROUTER_SITE_URL || 'https://esim.roamjet.net'
        };
      }
      
      // No API key found
      console.log('⚠️ No OpenRouter API key found');
      return {
        apiKey: null,
        model: 'openai/gpt-3.5-turbo',
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: 150,
        temperature: 0.7,
        siteName: 'RoamJet',
        siteUrl: 'https://esim.roamjet.net'
      };
    } catch (error) {
      console.error('❌ Error loading OpenRouter configuration:', error);
      return {
        apiKey: null,
        model: 'openai/gpt-3.5-turbo',
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: 150,
        temperature: 0.7,
        siteName: 'RoamJet',
        siteUrl: 'https://roamjet.com'
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Listen to Firestore config changes and clear cache when updated
  listenToConfigChanges() {
    if (typeof window === 'undefined') return; // Skip on server-side

    // Listen to Stripe config changes
    const stripeConfigRef = doc(db, 'config', 'stripe');
    const stripeUnsubscribe = onSnapshot(stripeConfigRef, (doc) => {
      if (doc.exists()) {
        console.log('🔄 Stripe config updated in Firestore, clearing cache');
        this.cache.delete('stripe');
        this.cache.delete('stripeMode');
        this.cache.delete('stripePublishableKey');
      }
    });
    this.listeners.set('stripe', stripeUnsubscribe);

    // Listen to environment config changes
    const envConfigRef = doc(db, 'config', 'environment');
    const envUnsubscribe = onSnapshot(envConfigRef, (doc) => {
      if (doc.exists()) {
        console.log('🔄 Environment config updated in Firestore, clearing cache');
        this.cache.delete('environment');
        this.cache.delete('dataPlansEnvironment');
      }
    });
    this.listeners.set('environment', envUnsubscribe);

    // Listen to Airalo config changes
    const airaloConfigRef = doc(db, 'config', 'airalo');
    const airaloUnsubscribe = onSnapshot(airaloConfigRef, (doc) => {
      if (doc.exists()) {
        console.log('🔄 Airalo config updated in Firestore, clearing cache');
        this.cache.delete('airalo');
        this.cache.delete('airaloConfig');
      }
    });
    this.listeners.set('airalo', airaloUnsubscribe);
  }

  // Stop listening to config changes
  stopListening() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe();
    });
    this.listeners.clear();
  }

  // Detect if API key is in sandbox mode based on key prefix
  detectApiKeyMode(apiKey) {
    if (!apiKey) return 'unknown';
    
    // Check for sandbox/test key patterns
    if (apiKey.includes('test') || apiKey.includes('sandbox') || apiKey.includes('dev')) {
      return 'sandbox';
    }
    
    // Check for production key patterns
    if (apiKey.includes('live') || apiKey.includes('prod') || apiKey.includes('production')) {
      return 'production';
    }
    
    // Default to sandbox for safety
    return 'sandbox';
  }

  // Get current API key mode from business_users collection (RoamJet API key)
  async getApiKeyMode() {
    try {
      console.log('🔍 getApiKeyMode called');
      
      // Check if we have a RoamJet API key from environment
      const roamjetApiKey = process.env.NEXT_PUBLIC_ROAMJET_API_KEY;
      console.log('🔑 RoamJet API Key from env:', roamjetApiKey ? `${roamjetApiKey.substring(0, 15)}...` : 'Not set');
      
      // If we have an API key, try to find the user by API key directly
      if (roamjetApiKey) {
        console.log('🔍 Searching for user by API key...');
        
        // Search for user by API key in business_users collection
        const { collection, query, where, limit, getDocs } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        
        const usersRef = collection(db, 'business_users');
        const q = query(usersRef, where('apiCredentials.apiKey', '==', roamjetApiKey), limit(1));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          console.log('👤 Found user by API key:', {
            uid: userDoc.id,
            companyName: userData.companyName,
            email: userData.email,
            apiCredentials: userData.apiCredentials
          });
          
          const apiMode = userData.apiCredentials?.mode || 'sandbox';
          console.log('🔍 RoamJet API key mode detected:', apiMode);
          return apiMode;
        } else {
          console.log('❌ No user found with this API key');
        }
      }
      
      // Fallback: Get current user's business profile
      const { auth } = await import('../firebase/config');
      const currentUser = auth.currentUser;
      
      console.log('👤 Current user:', currentUser ? currentUser.uid : 'null');
      
      if (!currentUser) {
        console.log('🔍 No authenticated user, defaulting to sandbox');
        return 'sandbox';
      }
      
      // Get user's business profile
      const userRef = doc(db, 'business_users', currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      console.log('👤 User UID:', currentUser.uid);
      console.log('📄 Document exists:', userDoc.exists());
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('📊 User data:', {
          companyName: userData.companyName,
          email: userData.email,
          apiCredentials: userData.apiCredentials
        });
        const apiMode = userData.apiCredentials?.mode || 'sandbox';
        console.log('🔍 RoamJet API key mode detected:', apiMode);
        return apiMode;
      }
      
      console.log('🔍 No business profile found, defaulting to sandbox');
      return 'sandbox';
    } catch (error) {
      console.error('❌ Error detecting API key mode:', error);
      return 'sandbox';
    }
  }
}

export const configService = new ConfigService();

