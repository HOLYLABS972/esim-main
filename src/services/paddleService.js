/**
 * Paddle Checkout - card/debit payment via Paddle Billing
 * Uses NEXT_PUBLIC_PDL_API_KEY for client and server.
 */
const PADDLE_SCRIPT = 'https://cdn.paddle.com/paddle/v2/paddle.js';

function loadPaddle() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Paddle) return Promise.resolve(window.Paddle);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.Paddle || null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });
}

async function ensurePaddleInitialized() {
  const Paddle = await loadPaddle();
  if (!Paddle) throw new Error('Paddle.js failed to load');
  const token = process.env.NEXT_PUBLIC_PDL_API_KEY;
  if (!token) throw new Error('Paddle API key not configured (NEXT_PUBLIC_PDL_API_KEY)');
  if (!window.__paddleInitialized) {
    Paddle.Initialize({ token });
    window.__paddleInitialized = true;
  }
  return Paddle;
}

export const paddleService = {
  async createCheckoutSession(orderData) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch(`${baseUrl}/api/paddle/create-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderData,
        successUrl: `${baseUrl}/payment-success`,
        cancelUrl: `${baseUrl}/payment-success?cancel=1`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Checkout failed: ${res.status}`);
    }

    const { transactionId, checkoutUrl } = await res.json();
    if (!transactionId) throw new Error('No transaction ID from Paddle');

    if (checkoutUrl && window !== window.top) {
      // Only use redirect for iframe context — otherwise open overlay directly
      let finalUrl = checkoutUrl;
      if (orderData.customerEmail || orderData.countryCode || orderData.country) {
        try {
          if (typeof sessionStorage !== 'undefined') {
            if (orderData.customerEmail) sessionStorage.setItem('paddle_customer_email', orderData.customerEmail);
            const country = orderData.countryCode || orderData.country;
            if (country) sessionStorage.setItem('paddle_customer_country', country);
          }
          const url = new URL(checkoutUrl);
          if (orderData.customerEmail) url.searchParams.set('email', orderData.customerEmail);
          const country = orderData.countryCode || orderData.country;
          if (country) url.searchParams.set('country', country);
          finalUrl = url.toString();
        } catch (_) {}
      }
      window.open(finalUrl, '_blank');
      return { transactionId };
    }

    const Paddle = await ensurePaddleInitialized();
    if (orderData.customerEmail) {
      try {
        Paddle.Update({ pwCustomer: { email: orderData.customerEmail } });
      } catch (_) {}
    }
    const openOptions = { transactionId };
    const country = orderData.countryCode || orderData.country;
    if (orderData.customerEmail || country) {
      openOptions.customer = {
        ...(orderData.customerEmail && { email: orderData.customerEmail }),
        ...(country && { address: { countryCode: String(country).toUpperCase().slice(0, 2) } }),
      };
    }
    Paddle.Checkout.open(openOptions);
    return { transactionId };
  },
};
