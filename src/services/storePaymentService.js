/**
 * Store Payment Service (esim-main) - Unified payment router
 * Routes payments based on store config:
 * - store=roamjet → Stripe + Coinbase
 * - store=globalbanka (if added) → Robokassa
 */

import { isPaymentMethodEnabled, getStorePaymentConfig } from './storeConfigService';
import { paymentService } from './paymentService';
import { coinbaseService } from './coinbaseService';

/**
 * Create checkout/payment and redirect based on store + payment method
 * @param {Object} params
 * @param {string} params.storeId - Store identifier (default: from env)
 * @param {string} params.paymentMethod - 'stripe' | 'coinbase' | 'robokassa'
 * @param {Object} params.orderData - { orderId, planId, planName, customerEmail, amount, currency, ... }
 */
// Map crypto → coinbase (crypto is config/UI alias for Coinbase)
const PAYMENT_METHOD_ALIASES = { crypto: 'coinbase' };
const resolveMethod = (m) => PAYMENT_METHOD_ALIASES[m] || m;

export async function createStoreCheckout({ storeId, paymentMethod, orderData }) {
  const effectiveStoreId = storeId || process.env.NEXT_PUBLIC_STORE_ID || 'roamjet';
  const resolvedMethod = resolveMethod(paymentMethod);

  const enabled = await isPaymentMethodEnabled(effectiveStoreId, resolvedMethod);
  if (!enabled) {
    throw new Error(`Payment method "${paymentMethod}" is not enabled for store "${effectiveStoreId}"`);
  }

  switch (resolvedMethod) {
    case 'stripe':
      return paymentService.createCheckoutSession(orderData);
    case 'coinbase':
      return coinbaseService.createCheckoutSession(orderData);
    case 'robokassa':
      // Add robokassaService when configured for this store
      throw new Error('Robokassa payment is not configured for this store');
    default:
      throw new Error(`Unknown payment method: ${paymentMethod}`);
  }
}

/**
 * Get available payment methods for the store (for UI)
 */
export async function getStorePaymentMethods(storeId) {
  const config = await getStorePaymentConfig(storeId);
  return config.paymentMethods;
}
