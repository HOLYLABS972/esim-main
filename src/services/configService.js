// Configuration service - reads from Supabase app_config table
import { supabase } from '../supabase/config';

class ConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getConfig(key) {
    // Check cache
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.ts < this.cacheTimeout) {
      return cached.value;
    }

    try {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .single();

      if (error || !data) return null;
      this.cache.set(key, { value: data.value, ts: Date.now() });
      return data.value;
    } catch (e) {
      console.error(`Error loading config "${key}":`, e);
      return null;
    }
  }

  // Coinbase Commerce API configuration
  async getCoinbaseConfig() {
    const config = await this.getConfig('coinbase');
    if (config?.api_key) {
      console.log('✅ Coinbase API key loaded from Supabase');
      return {
        apiKey: config.api_key,
        secret: config.secret || null,
        webhookSecret: config.webhook_secret || null,
      };
    }

    // Fallback to environment variables
    const envKey = process.env.NEXT_PUBLIC_COINBASE_API_KEY;
    if (envKey) {
      console.log('✅ Coinbase API key loaded from env');
      return {
        apiKey: envKey,
        secret: process.env.COINBASE_SECRET || null,
        webhookSecret: process.env.COINBASE_WEBHOOK_SECRET || null,
      };
    }

    console.log('⚠️ No Coinbase API key found');
    return { apiKey: null, secret: null, webhookSecret: null };
  }

  // Airalo API configuration
  async getAiraloConfig() {
    const config = await this.getConfig('airalo');
    if (config?.api_key) {
      console.log('✅ Airalo config loaded from Supabase');
      return {
        apiKey: config.api_key,
        clientId: config.client_id || config.api_key,
        environment: config.environment || 'production',
        baseUrl: 'https://partners-api.airalo.com/v2',
      };
    }

    return {
      apiKey: null,
      environment: 'sandbox',
      baseUrl: 'https://sandbox-partners-api.airalo.com/v2',
    };
  }

  // OpenRouter API configuration
  async getOpenRouterConfig() {
    const config = await this.getConfig('openrouter');
    if (config?.api_key) {
      console.log('✅ OpenRouter config loaded from Supabase');
      return {
        apiKey: config.api_key,
        model: config.model || 'openai/gpt-3.5-turbo',
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: config.max_tokens || 150,
        temperature: config.temperature || 0.7,
        siteName: config.site_name || 'RoamJet',
        siteUrl: config.site_url || 'https://roamjet.com',
      };
    }

    const envKey = process.env.OPENROUTER_API_KEY;
    if (envKey) {
      return {
        apiKey: envKey,
        model: 'openai/gpt-3.5-turbo',
        baseUrl: 'https://openrouter.ai/api/v1',
        maxTokens: 150,
        temperature: 0.7,
        siteName: 'RoamJet',
        siteUrl: 'https://roamjet.com',
      };
    }

    return { apiKey: null, model: 'openai/gpt-3.5-turbo', baseUrl: 'https://openrouter.ai/api/v1', maxTokens: 150, temperature: 0.7, siteName: 'RoamJet', siteUrl: 'https://roamjet.com' };
  }

  // Stripe removed — no-op stubs
  async getStripeMode() { return 'disabled'; }
  async getStripePublishableKey() { return null; }
  async getStripeSecretKey() { return null; }

  // DataPlans environment
  async getDataPlansEnvironment() { return 'production'; }

  clearCache() { this.cache.clear(); }
  listenToConfigChanges() {}
  stopListening() {}
}

export const configService = new ConfigService();
