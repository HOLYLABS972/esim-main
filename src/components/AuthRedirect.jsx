"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

const AuthRedirect = ({ children, redirectTo = '/dashboard' }) => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  const effectiveRedirect = (returnUrl && decodeURIComponent(returnUrl).startsWith('/')) ? decodeURIComponent(returnUrl) : redirectTo;

  useEffect(() => {
    if (!loading && currentUser) {
      router.push(effectiveRedirect);
    }
  }, [currentUser, loading, router, effectiveRedirect]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tufts-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render children if user is logged in
  if (!loading && currentUser) {
    return null;
  }

  return children;
};

export default AuthRedirect;
