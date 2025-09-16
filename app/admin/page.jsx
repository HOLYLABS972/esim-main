import { Suspense } from 'react'
import AdminDashboard from '../../src/components/AdminDashboard'
import Loading from '../../src/components/Loading'
import AdminGuard from '../../src/components/AdminGuard'

export const metadata = {
  title: 'Admin Dashboard - eSIM Plans',
  description: 'Administrative dashboard for managing eSIM plans, users, and system configuration.',
  keywords: ['admin dashboard', 'eSIM management', 'system administration'],
  openGraph: {
    title: 'Admin Dashboard - eSIM Plans',
    description: 'Administrative dashboard for managing eSIM plans, users, and system configuration.',
    url: '/admin',
  },
  alternates: {
    canonical: '/admin',
  },
}

export default function AdminPage() {
  return (
    <AdminGuard>
      <Suspense fallback={<Loading />}>
        <AdminDashboard />
      </Suspense>
    </AdminGuard>
  )
}
