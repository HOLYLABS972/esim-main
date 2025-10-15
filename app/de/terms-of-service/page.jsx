'use client';

import { useEffect } from 'react';

export default function TermsOfServiceRedirect() {
  useEffect () => {
    window.location.href = '/terms-of-service';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Redirecting...</h1>
        <p className="text-gray-600">You will be redirected to our terms of service.</p>
      </div>
    </div>
  );
}

