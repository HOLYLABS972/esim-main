/**
 * Store Configuration Service - Coinbase only, no Firebase
 */

export function getStoreId() {
  return process.env.NEXT_PUBLIC_STORE_ID || 'roamjet';
}

export async function getStorePaymentConfig(storeId) {
  return {
    storeId: storeId || getStoreId(),
    paymentMethods: ['coinbase'],
    defaultCurrency: 'USD',
  };
}

export async function isPaymentMethodEnabled(storeId, method) {
  return method === 'coinbase';
}

export async function getStorePaymentMethods(storeId) {
  return ['coinbase'];
}
