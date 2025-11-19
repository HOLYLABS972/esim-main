'use client';

import React, { Suspense } from 'react';
import Image from 'next/image';
import AiraloPackagesSection from '../../src/components/sections/AiraloPackagesSection';
import CountrySearchBar from '../../src/components/CountrySearchBar';
import { useI18n } from '../../src/contexts/I18nContext';

export default function StorePage() {
  const { t, locale } = useI18n();
  
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-balance text-gray-600 mb-6">
            <span className="text-eerie-black font-semibold">Get instant mobile data worldwide</span>
          </h1>
          
          {/* Search Bar */}
          <Suspense fallback={<div className="h-16" />}>
            <CountrySearchBar showCountryCount={true} />
          </Suspense>
        </div>
        
        {/* Airalo Packages Section with Tabs (Global, Regional, Countries) */}
        <AiraloPackagesSection />
      </div>
    </div>
  );
}
