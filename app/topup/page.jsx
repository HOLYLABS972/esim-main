'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function TopupContent() {
  const searchParams = useSearchParams();
  const cardId = searchParams?.get('cardId') || '';
  const amountParam = searchParams?.get('amount') || '0';
  const email = searchParams?.get('email') || '';
  const userId = searchParams?.get('userId') || '';
  const amount = parseFloat(amountParam) || 0;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cardId) {
      setError('Missing card ID');
      setLoading(false);
      return;
    }
    if (!email) {
      setError('Missing email');
      setLoading(false);
      return;
    }

    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const successUrl = `${base}/payment-success`;
    const cancelUrl = `${base}/`;

    setLoading(true);
    setError('');

    fetch(`${base}/api/paddle/create-topup-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        cardId,
        amount,
        userId: userId || undefined,
        successUrl,
        cancelUrl,
      }),
    })
      .then((r) => {
        if (!r.ok) {
          return r.json().then((d) => {
            throw new Error(d.error || d.message || 'Request failed');
          });
        }
        return r.json();
      })
      .then((data) => {
        const url = data.checkoutUrl || data.url;
        if (url) {
          window.location.href = url;
        } else {
          setError('No checkout URL');
          setLoading(false);
        }
      })
      .catch((e) => {
        setError(e.message || 'Checkout failed');
        setLoading(false);
      });
  }, [cardId, amount, email, userId]);

  return (
    <div className="min-h-screen bg-[#0F1322] flex flex-col items-center justify-center p-6">
      <div className="bg-[#1C2438] rounded-2xl p-8 max-w-sm w-full text-center">
        <h1 className="text-xl font-semibold text-white mb-2">Top Up</h1>
        <p className="text-white/60 text-sm mb-6">Preparing checkout…</p>
        <p className="text-2xl font-bold text-[#56A8E5] mb-6">
          ${amount.toFixed(2)}
        </p>
        {loading && (
          <div className="w-10 h-10 border-2 border-white/20 border-t-[#56A8E5] rounded-full animate-spin mx-auto mb-4" />
        )}
        {error && (
          <p className="text-[#F05A67] text-sm mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}

export default function VirtualCardTopupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F1322] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/20 border-t-[#56A8E5] rounded-full animate-spin" />
        </div>
      }
    >
      <TopupContent />
    </Suspense>
  );
}
