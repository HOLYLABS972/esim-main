'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const EsimPlans = dynamic(() => import('../../src/components/EsimPlans'), {
  loading: () => <div className="animate-pulse">Loading plans...</div>,
  ssr: false
});

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        
        {/* Page Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          <h1 className="text-center text-xl font-semibold text-tufts-blue mb-4">
            <span>{'{ '}</span>
            eSIM Plans
            <span>{' }'}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
            Choose Your Perfect eSIM Plan
          </p>
          <p className="text-eerie-black max-w-3xl mx-auto mt-4">
            Browse our selection of eSIM plans from around the world. Instant activation, global coverage, and competitive pricing.
          </p>
        </div>

        {/* eSIM Plans Component */}
        <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded"></div>}>
          <EsimPlans />
        </Suspense>
      </div>
    </div>
  );
}
