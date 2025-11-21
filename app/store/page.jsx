'use client';

import React, { Suspense } from 'react';
import AiraloPackagesSection from '../../src/components/sections/AiraloPackagesSection';
import CountrySearchBar from '../../src/components/CountrySearchBar';

export default function StorePage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-balance text-gray-600 mb-4">
            <span className="text-eerie-black font-semibold">Get instant mobile data worldwide</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Browse our complete selection of eSIM data plans for 200+ countries. Real-time pricing with instant activation.
          </p>
          
          {/* Search Bar */}
          <Suspense fallback={<div className="h-16" />}>
            <CountrySearchBar showCountryCount={true} />
          </Suspense>
        </div>
        
        {/* Airalo Packages Section with Tabs (Global, Regional, Countries) */}
        <Suspense fallback={
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading packages...</p>
          </div>
        }>
          <AiraloPackagesSection />
        </Suspense>
      </div>
    </div>
  );
}
