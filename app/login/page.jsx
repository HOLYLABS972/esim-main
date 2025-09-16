import { Suspense } from 'react'
import Login from '../../src/components/Login'
import Loading from '../../src/components/Loading'
import AuthRedirect from '../../src/components/AuthRedirect'

export const metadata = {
  title: 'Login - eSIM Plans',
  description: 'Sign in to your eSIM Plans account to manage your data plans and settings.',
  keywords: ['login', 'sign in', 'eSIM account', 'authentication'],
  openGraph: {
    title: 'Login - eSIM Plans',
    description: 'Sign in to your eSIM Plans account to manage your data plans and settings.',
    url: '/login',
  },
  alternates: {
    canonical: '/login',
  },
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthRedirect redirectTo="/dashboard">
        <Login />
      </AuthRedirect>
    </Suspense>
  )
}
