'use client';

import { Suspense } from 'react';
import AdminDashboard from '../../src/components/AdminDashboard';
import Loading from '../../src/components/Loading';

export default function AdminPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminDashboard />
    </Suspense>
  );
}
