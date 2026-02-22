/**
 * Store Payment Service - Coinbase only
 */
import { coinbaseService } from './coinbaseService';

export async function createStoreCheckout({ paymentMethod, orderData }) {
  // All payments go through Coinbase
  return await coinbaseService.createCheckoutSession(orderData);
}

export async function getStorePaymentMethods() {
  return ['coinbase'];
}
