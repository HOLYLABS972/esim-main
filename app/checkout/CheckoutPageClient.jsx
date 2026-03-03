'use client';

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Checkout from '../../src/components/Checkout'
import Loading from '../../src/components/Loading'

const PADDLE_SCRIPT = 'https://cdn.paddle.com/paddle/v2/paddle.js';

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paddleOpening, setPaddleOpening] = useState(false);

  // Paddle default payment link: URL has ?_ptxn=txn_xxx or ?transaction_id=txn_xxx
  useEffect(() => {
    const txnId = searchParams.get('_ptxn') || searchParams.get('transaction_id');
    if (!txnId) return;

    setPaddleOpening(true);
    setLoading(false);

    const openPaddleCheckout = () => {
      if (typeof window === 'undefined' || !window.Paddle) return;
      window.Paddle.Checkout.open({ transactionId: txnId });
      setPaddleOpening(false);
    };

    if (window.Paddle) {
      openPaddleCheckout();
      return;
    }

    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT;
    script.async = true;
    script.onload = () => {
      const token = process.env.NEXT_PUBLIC_PDL_API_KEY;
      const env = process.env.NEXT_PUBLIC_PADDLE_ENV === 'sandbox' ? 'sandbox' : 'production';
      if (token && window.Paddle) {
        window.Paddle.Initialize({ token, environment: env });
        openPaddleCheckout();
      }
      setPaddleOpening(false);
    };
    script.onerror = () => {
      setError('Payment failed to load. Please try again.');
      setPaddleOpening(false);
    };
    document.body.appendChild(script);
  }, [searchParams]);

  // Normal checkout (plan from localStorage or plan id)
  useEffect(() => {
    const txnId = searchParams.get('_ptxn') || searchParams.get('transaction_id');
    if (txnId) return; // Paddle default payment link mode — don't load plan

    const loadPlan = async () => {
      try {
        const planId = searchParams.get('plan');
        const planType = searchParams.get('type');
        
        // Check localStorage first (from share page)
        const selectedPackage = localStorage.getItem('selectedPackage');
        if (selectedPackage) {
          try {
            const packageData = JSON.parse(selectedPackage);
            setPlan({
              id: packageData.packageId,
              name: packageData.packageName,
              description: packageData.packageDescription,
              price: packageData.price,
              currency: packageData.currency,
              data: packageData.data,
              dataUnit: packageData.dataUnit,
              period: packageData.period,
              duration: packageData.period,
              country_code: packageData.country_code,
              benefits: packageData.benefits,
              speed: packageData.speed,
              type: 'package'
            });
            setLoading(false);
            return;
          } catch (parseError) {
            console.error('Error parsing selected package:', parseError);
          }
        }
        
        if (!planId) {
          setError('No plan selected');
          setLoading(false);
          return;
        }

        // Load plan from Supabase
        const { createClient } = await import('@supabase/supabase-js');
        const sb = createClient(
          'https://uhpuqiptxcjluwsetoev.supabase.co',
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHVxaXB0eGNqbHV3c2V0b2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTE4OTYsImV4cCI6MjA3MjY2Nzg5Nn0.D_t-dyA4Z192kAU97Oi79At_IDT_5putusXrR0bQ6z8'
        );
        const { data } = await sb.from('dataplans').select('*').eq('id', planId).single();
        if (data) {
          setPlan({ ...data, type: planType || 'country' });
        } else {
          setError('Plan not found');
        }
      } catch (err) {
        console.error('Error loading plan:', err);
        setError('Failed to load plan');
      } finally {
        setLoading(false);
      }
    };

    loadPlan();
  }, [searchParams]);

  // Paddle default payment link mode: show loading while opening checkout
  if (paddleOpening) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Opening secure checkout...</p>
        </div>
      </div>
    );
  }

  const txnId = searchParams.get('_ptxn') || searchParams.get('transaction_id');
  if (txnId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <p className="text-gray-600 mb-4">If checkout did not open, try again or return to the store.</p>
          <a href="/" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Return to store
          </a>
        </div>
      </div>
    );
  }

  if (error && !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Plan Selected</h2>
          <p className="text-gray-600 mb-4">Please select a plan from the plans page to continue.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  if (loading || (!plan && !paddleOpening)) return <Loading />;

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-gray-400 text-6xl mb-4">📱</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Plan Selected</h2>
          <p className="text-gray-600 mb-4">Please select a plan from the plans page to continue.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  return <Checkout plan={plan} />;
}
