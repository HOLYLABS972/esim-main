// Configuration service to read admin settings
import { doc, getDoc, addDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../firebase/config';

class ConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Get Stripe mode (test/live) from admin configuration
  async getStripeMode() {
    try {
      // First try to get from Firestore (admin panel)
      const configRef = doc(db, 'config', 'stripe');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        if (configData.mode) {
          console.log('✅ Stripe mode loaded from Firestore:', configData.mode);
          return configData.mode;
        }
      }
      
      // Fallback to localStorage (admin panel fallback)
      const savedMode = localStorage.getItem('esim_stripe_mode');
      if (savedMode) {
        console.log('✅ Stripe mode loaded from localStorage:', savedMode);
        return savedMode;
      }
      
      // Default to test mode
      console.log('⚠️ No Stripe mode found, defaulting to test');
      return 'test';
    } catch (error) {
      console.error('❌ Error loading Stripe mode:', error);
      // Fallback to localStorage
      const savedMode = localStorage.getItem('esim_stripe_mode');
      if (savedMode) {
        console.log('✅ Stripe mode loaded from localStorage fallback:', savedMode);
        return savedMode;
      }
      console.log('⚠️ No Stripe mode found in fallback, defaulting to test');
      return 'test';
    }
  }

  // Get DataPlans environment (test/production)
  async getDataPlansEnvironment() {
    try {
      // First try to get from Firestore (admin panel)
      const configRef = doc(db, 'config', 'environment');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        if (configData.mode) {
          console.log('✅ DataPlans environment loaded from Firestore:', configData.mode);
          return configData.mode;
        }
      }
      
      // Fallback to localStorage (admin panel fallback)
      const savedEnv = localStorage.getItem('esim_environment');
      if (savedEnv) {
        console.log('✅ DataPlans environment loaded from localStorage:', savedEnv);
        return savedEnv;
      }
      
      // Default to test environment
      console.log('⚠️ No DataPlans environment found, defaulting to test');
      return 'test';
    } catch (error) {
      console.error('❌ Error loading DataPlans environment:', error);
      // Fallback to localStorage
      const savedEnv = localStorage.getItem('esim_environment');
      return savedEnv || 'test';
    }
  }

  // Get Airalo API configuration
  async getAiraloConfig() {
    try {
      // First try to get from Firestore
      const configRef = doc(db, 'config', 'airalo');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        if (configData.api_key) {
          console.log('✅ Airalo API key loaded from Firestore');
          return {
            apiKey: configData.api_key,
            environment: configData.environment || 'sandbox',
            baseUrl: 'https://partners-api.airalo.com/v2'
          };
        }
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

  // Get Stripe publishable key based on mode
  async getStripePublishableKey(mode = 'test') {
    console.log('🔍 Getting Stripe key for mode:', mode);
    
    try {
      // Try to get keys from Firestore first
      const configRef = doc(db, 'config', 'stripe');
      const configDoc = await getDoc(configRef);
      
      if (configDoc.exists()) {
        const configData = configDoc.data();
        console.log('🔍 Stripe config from Firestore:', configData);
        
        // Always use live key (only one key supported now)
        const liveKey = configData.livePublishableKey || configData.live_publishable_key;
        console.log('🔍 Live key from DB:', liveKey ? 'Yes' : 'No');
        if (liveKey) {
          console.log('🔑 Using live key from Firebase');
          return liveKey;
        }
      }
      
      // No fallback - show error if keys not found
      console.error('❌ No Stripe keys found in Firebase');
      throw new Error('Stripe keys not configured. Please contact administrator.');
    } catch (error) {
      console.error('❌ Error loading Stripe keys from Firestore:', error);
      
      // Log the error if it's related to expired keys
      if (error.message && error.message.includes('expired')) {
        this.logExpiredStripeKey('publishable', error);
      }
      
      throw new Error('Stripe keys not configured. Please contact administrator.');
    }
  }

  // Get Stripe secret key based on mode (for server-side)
  async getStripeSecretKey(mode = 'test') {
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
}

export const configService = new ConfigService();
