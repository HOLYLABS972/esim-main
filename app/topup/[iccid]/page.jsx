'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import TopupPage from '../../../src/components/TopupPage';
import Loading from '../../../src/components/Loading';

function TopupPageWrapper({ params }) {
  // Handle both promise and non-promise params (Next.js 13+ compatibility)
  const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
  const searchParams = useSearchParams();
  
  const iccidValue = resolvedParams?.iccid || resolvedParams?.slug || null;
  const countryCode = searchParams?.get('country') || searchParams?.get('countryCode') || null;
  
  console.log('🔍 TopupDisplayPage params:', { 
    params, 
    resolvedParams, 
    iccidValue,
    countryCode,
    paramKeys: Object.keys(resolvedParams || {})
  });
  
  // Set page title
  useEffect(() => {
    if (iccidValue) {
      document.title = `Add Data (Topup) - ICCID ${iccidValue} | RoamJet`;
    }
  }, [iccidValue]);
  
  return (
    <TopupPage iccid={iccidValue} countryCode={countryCode} />
  );
}

export default function TopupDisplayPage({ params }) {
  return (
    <Suspense fallback={<Loading />}>
      <TopupPageWrapper params={params} />
    </Suspense>
  );
}

