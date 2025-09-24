'use client';

import React from 'react';
import EsimPlans from '../../src/components/EsimPlans';

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your eSIM Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse our complete selection of eSIM data plans for 200+ countries. 
            Real-time pricing with instant activation.
          </p>
        </div>
        
        <EsimPlans />
      </div>
    </div>
  );
}
