// Payments disabled - Stripe removed

export async function createStoreCheckout() {
  throw new Error('Payments are currently unavailable');
}

export async function getStorePaymentMethods() {
  return [];
}
