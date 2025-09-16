import { Suspense } from 'react'
import Register from '../../src/components/Register'
import Loading from '../../src/components/Loading'
import AuthRedirect from '../../src/components/AuthRedirect'

export const metadata = {
  title: 'Register - eSIM Plans',
  description: 'Create your eSIM Plans account to start buying and managing data plans worldwide.',
  keywords: ['register', 'sign up', 'create account', 'eSIM plans'],
  openGraph: {
    title: 'Register - eSIM Plans',
    description: 'Create your eSIM Plans account to start buying and managing data plans worldwide.',
    url: '/register',
  },
  alternates: {
    canonical: '/register',
  },
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Loading />}>
      <AuthRedirect redirectTo="/dashboard">
        <Register />
      </AuthRedirect>
    </Suspense>
  )
}
