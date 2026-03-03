// Payments disabled - Stripe removed
export const paymentService = {
  async getStripe() { return null; },
  async createPaymentIntent() { throw new Error('Payments are currently unavailable'); },
  async createCheckoutSession() { throw new Error('Payments are currently unavailable'); },
  async retrieveSession() { throw new Error('Payments are currently unavailable'); },
  async createCustomerPortalSession() { throw new Error('Payments are currently unavailable'); },
  async checkSubscriptionStatus() { throw new Error('Payments are currently unavailable'); },
};
