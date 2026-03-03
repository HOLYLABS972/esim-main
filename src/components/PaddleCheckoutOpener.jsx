'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const PADDLE_SCRIPT = 'https://cdn.paddle.com/paddle/v2/paddle.js';

/**
 * When the default payment link is the site root (e.g. roamjet.net),
 * Paddle redirects to https://roamjet.net?_ptxn=txn_xxx.
 * This component opens Paddle checkout when that query param is present.
 */
export default function PaddleCheckoutOpener() {
  const searchParams = useSearchParams();
  const openedRef = useRef(false);

  useEffect(() => {
    const txnId = searchParams.get('_ptxn') || searchParams.get('transaction_id');
    if (!txnId || openedRef.current) return;

    const openCheckout = () => {
      if (typeof window === 'undefined' || !window.Paddle) return;
      openedRef.current = true;
      let customerEmail = searchParams.get('email') || null;
      if (!customerEmail && typeof sessionStorage !== 'undefined') {
        try {
          customerEmail = sessionStorage.getItem('paddle_customer_email');
          if (customerEmail) sessionStorage.removeItem('paddle_customer_email');
        } catch (_) {}
      }
      if (customerEmail) {
        try {
          window.Paddle.Update({ pwCustomer: { email: customerEmail } });
        } catch (_) {}
      }
      const options = { transactionId: txnId };
      if (customerEmail) options.customer = { email: customerEmail };
      window.Paddle.Checkout.open(options);
    };

    if (window.Paddle) {
      openCheckout();
      return;
    }

    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT;
    script.async = true;
    script.onload = () => {
      const token = process.env.NEXT_PUBLIC_PDL_API_KEY;
      if (token && window.Paddle) {
        window.Paddle.Initialize({ token });
        openCheckout();
      }
    };
    document.body.appendChild(script);
  }, [searchParams]);

  return null;
}
