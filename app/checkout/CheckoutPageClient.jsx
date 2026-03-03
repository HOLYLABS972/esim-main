'use client';

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Checkout from '../../src/components/Checkout'
import Loading from '../../src/components/Loading'

export default function CheckoutPageClient() {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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

  if (loading) return <Loading />;

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
