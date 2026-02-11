'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import AdminDashboard from '../../../src/components/AdminDashboard';
import Loading from '../../../src/components/Loading';

const VALID_TABS = ['countries', 'plans', 'topups', 'esim', 'admins', 'orders', 'affiliate', 'notifications', 'blog', 'config', 'overview'];

export default function AdminPage() {
  const params = useParams();
  const tabSegment = params?.tab?.[0];
  const initialTab = VALID_TABS.includes(tabSegment) ? tabSegment : 'esim';

  return (
    <Suspense fallback={<Loading />}>
      <AdminDashboard initialTab={initialTab} />
    </Suspense>
  );
}
