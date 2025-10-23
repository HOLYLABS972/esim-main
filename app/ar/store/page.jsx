'use client';

import { useState, useEffect } from 'react';

export default function StorePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setError(true);
  };

  useEffect(() => {
    // Set a timeout to handle cases where the iframe doesn't trigger load event
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">جاري تحميل المتجر...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            تعذر تحميل المتجر
          </h2>
          <p className="text-gray-600 mb-4">
            يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Store Iframe */}
      <div className="relative w-full" style={{ minHeight: '100vh' }}>
        <iframe
          src="https://store.roamjet.net/ar"
          className={`w-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{ 
            height: '100vh',
            minHeight: '600px'
          }}
          title="متجر RoamJet"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="payment; geolocation; microphone; camera"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>

    </div>
  );
}
