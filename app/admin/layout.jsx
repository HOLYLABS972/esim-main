'use client';

import AdminGuard from '../../src/components/AdminGuard';

export default function AdminLayout({ children }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </AdminGuard>
  );
}
