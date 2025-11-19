'use client';

import { Suspense, use, useEffect } from 'react';
import QRCodePage from '../../../src/components/QRCodePage';
import Loading from '../../../src/components/Loading';

export default function QRCodeDisplayPage({ params }) {
  // Handle both promise and non-promise params (Next.js 13+ compatibility)
  const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
  
  const iccidValue = resolvedParams?.iccid || resolvedParams?.slug || null;
  
  console.log('🔍 QRCodeDisplayPage params:', { 
    params, 
    resolvedParams, 
    iccidValue,
    paramKeys: Object.keys(resolvedParams || {})
  });
  
  // Set page title
  useEffect(() => {
    if (iccidValue) {
      document.title = `eSIM QR Code - ICCID ${iccidValue} | RoamJet`;
    }
  }, [iccidValue]);
  
  return (
    <Suspense fallback={<Loading />}>
      <QRCodePage iccid={iccidValue} />
    </Suspense>
  );
}

