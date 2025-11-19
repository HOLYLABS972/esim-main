'use client';

import { Suspense, use } from 'react';
import DataUsagePage from '../../../src/components/DataUsagePage';
import Loading from '../../../src/components/Loading';

export default function DataUsageDisplayPage({ params, searchParams }) {
  // Handle both promise and non-promise params (Next.js 13+ compatibility)
  const resolvedParams = typeof params === 'object' && 'then' in params ? use(params) : params;
  const resolvedSearchParams = typeof searchParams === 'object' && 'then' in searchParams ? use(searchParams) : searchParams;
  
  const iccidValue = resolvedParams?.iccid || null;
  const orderIdValue = resolvedSearchParams?.orderId || resolvedSearchParams?.order_id || null;
  
  console.log('🔍 DataUsageDisplayPage params:', { 
    params: resolvedParams, 
    searchParams: resolvedSearchParams,
    iccidValue,
    orderIdValue
  });
  
  return (
    <Suspense fallback={<Loading />}>
      <DataUsagePage iccid={iccidValue} orderId={orderIdValue} />
    </Suspense>
  );
}

