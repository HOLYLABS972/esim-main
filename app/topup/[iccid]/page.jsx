'use client';

import { Suspense, use, useEffect } from 'react';
import TopupPage from '../../../src/components/TopupPage';
import Loading from '../../../src/components/Loading';

export default function TopupDisplayPage({ params }) {
  // Handle both promise and non-promise params (Next.js 13+ compatibility)
  const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
  
  const iccidValue = resolvedParams?.iccid || resolvedParams?.slug || null;
  
  console.log('🔍 TopupDisplayPage params:', { 
    params, 
    resolvedParams, 
    iccidValue,
    paramKeys: Object.keys(resolvedParams || {})
  });
  
  // Set page title
  useEffect(() => {
    if (iccidValue) {
      document.title = `Add Data (Topup) - ICCID ${iccidValue} | RoamJet`;
    }
  }, [iccidValue]);
  
  return (
    <Suspense fallback={<Loading />}>
      <TopupPage iccid={iccidValue} />
    </Suspense>
  );
}

