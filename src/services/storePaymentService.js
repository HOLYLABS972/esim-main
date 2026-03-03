/**
 * Store Payment Service - Paddle (card) and Coinbase (crypto)
 */
import { paddleService } from './paddleService';
import { coinbaseService } from './coinbaseService';

export async function createStoreCheckout({ paymentMethod, orderData }) {
  if (paymentMethod === 'paddle') {
    return await paddleService.createCheckoutSession(orderData);
  }
  return await coinbaseService.createCheckoutSession(orderData);
}

export async function getStorePaymentMethods() {
  return ['paddle', 'coinbase'];
}
