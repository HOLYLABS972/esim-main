/**
 * Store Configuration Service (esim-main)
 * Fetches payment methods per store. Uses Firestore config or env fallback.
 * For store=roamjet: Stripe + Coinbase
 * For store=globalbanka (if added): Robokassa
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Cache for store config (5 min TTL)
let configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Get current store ID (from env or default)
 */
export function getStoreId() {
  return process.env.NEXT_PUBLIC_STORE_ID || 'roamjet';
}

/**
 * Fetch store payment config from Firestore (config/stores/{storeId})
 * Falls back to default methods for roamjet: [stripe, coinbase]
 */
export async function getStorePaymentConfig(storeId) {
  const effectiveStoreId = storeId || getStoreId();
  const cacheKey = `store_config_${effectiveStoreId}`;
  const cached = configCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  // Default for roamjet: Stripe + Coinbase (crypto maps to coinbase)
  const defaultConfig = {
    storeId: effectiveStoreId,
    paymentMethods: ['stripe', 'coinbase'],
    defaultCurrency: 'USD',
  };

  // Map crypto → coinbase (crypto is UI/config alias for Coinbase)
  const PAYMENT_METHOD_ALIASES = { crypto: 'coinbase' };
  const resolveMethod = (m) => PAYMENT_METHOD_ALIASES[m] || m;

  try {
    if (!db) return defaultConfig;

    const configRef = doc(db, 'config', 'stores');
    const configDoc = await getDoc(configRef);

    if (!configDoc.exists()) {
      return defaultConfig;
    }

    const data = configDoc.data();
    const storeConfig = data[effectiveStoreId] || data.default;

    if (!storeConfig) {
      return defaultConfig;
    }

    const rawMethods = Array.isArray(storeConfig.payment_methods)
      ? storeConfig.payment_methods
      : defaultConfig.paymentMethods;
    const result = {
      storeId: effectiveStoreId,
      paymentMethods: rawMethods.map((m) => resolveMethod(m)),
      defaultCurrency: storeConfig.default_currency || defaultConfig.defaultCurrency,
    };

    configCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return result;
  } catch (err) {
    console.warn('⚠️ storeConfigService: Could not fetch config, using default:', err.message);
    return defaultConfig;
  }
}

// Map crypto → coinbase (alias)
const PAYMENT_METHOD_ALIASES = { crypto: 'coinbase' };
const resolveMethod = (m) => PAYMENT_METHOD_ALIASES[m] || m;

/**
 * Check if a payment method is enabled for the store
 * Accepts 'crypto' as alias for 'coinbase'
 */
export async function isPaymentMethodEnabled(storeId, paymentMethod) {
  const config = await getStorePaymentConfig(storeId);
  const resolved = resolveMethod(paymentMethod);
  return config.paymentMethods.includes(resolved) || config.paymentMethods.includes(paymentMethod);
}

/**
 * Get available payment methods for the current store
 */
export async function getAvailablePaymentMethods(storeId) {
  const config = await getStorePaymentConfig(storeId);
  return config.paymentMethods;
}
