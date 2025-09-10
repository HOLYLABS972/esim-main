// Configuration service to read admin settings
import { doc, getDoc } from 'firebase/firestore';
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
            environment: configData.environment || 'test',
            baseUrl: configData.environment === 'prod' ? 'https://api.airalo.com/v2' : 'https://api.airalo.com/v2'
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
          baseUrl: savedEnv === 'prod' ? 'https://api.airalo.com/v2' : 'https://api.airalo.com/v2'
        };
      }
      
      // Default configuration
      console.log('⚠️ No Airalo API key found, using default configuration');
      return {
        apiKey: null,
        environment: 'test',
        baseUrl: 'https://api.airalo.com/v2'
      };
    } catch (error) {
      console.error('❌ Error loading Airalo configuration:', error);
      return {
        apiKey: null,
        environment: 'test',
        baseUrl: 'https://api.airalo.com/v2'
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
        
        if (mode === 'live' || mode === 'production') {
          const liveKey = configData.livePublishableKey || configData.live_key;
          console.log('🔍 Live/Production key from DB:', liveKey ? 'Yes' : 'No');
          if (liveKey) return liveKey;
        } else if (mode === 'test') {
          const testKey = configData.testPublishableKey || configData.test_key;
          console.log('🔍 Test key from DB:', testKey ? 'Yes' : 'No');
          if (testKey) return testKey;
        }
      }
      
      // Fallback to environment variables if Firestore doesn't have keys
      console.log('🔍 Falling back to environment variables');
      console.log('🔍 Available env vars:', {
        live: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE,
        test: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST,
        default: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      });
      
      if (mode === 'live' || mode === 'production') {
        const liveKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE;
        console.log('🔍 Live/Production key from env:', liveKey ? 'Yes' : 'No');
        if (!liveKey) {
          console.warn('⚠️ Live key not found in env, falling back to test key');
          return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
        }
        return liveKey;
      } else if (mode === 'test') {
        const testKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
        console.log('🔍 Test key from env:', testKey ? 'Yes' : 'No');
        if (!testKey) {
          console.warn('⚠️ Test key not found in env');
          return null;
        }
        return testKey;
      } else {
        const defaultKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
        console.log('🔍 Default key from env:', defaultKey ? 'Yes' : 'No');
        return defaultKey;
      }
    } catch (error) {
      console.error('❌ Error loading Stripe keys from Firestore:', error);
      
      // Fallback to environment variables on error
      if (mode === 'live' || mode === 'production') {
        return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE;
      } else if (mode === 'test') {
        return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST;
      } else {
        return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      }
    }
  }

  // Get Stripe secret key based on mode (for server-side)
  getStripeSecretKey(mode = 'test') {
    if (mode === 'live' || mode === 'production') {
      return process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY;
    } else {
      return process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export const configService = new ConfigService();
