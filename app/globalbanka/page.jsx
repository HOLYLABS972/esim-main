'use client';

import { useState, useEffect } from 'react';

export default function GlobalBankaPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  const handleIframeLoad = () => {
    console.log('✅ GlobalBanka iframe loaded successfully');
    setIsLoading(false);
    setDebugInfo('Iframe loaded successfully');
  };

  const handleIframeError = () => {
    console.error('❌ GlobalBanka iframe failed to load');
    setIsLoading(false);
    setError(true);
    setDebugInfo('Iframe failed to load');
  };

  useEffect(() => {
    console.log('🔍 GlobalBanka page mounted, attempting to load iframe...');
    setDebugInfo('Page mounted, loading iframe...');
    
    // Set a timeout to handle cases where the iframe doesn't trigger load event
    const timeout = setTimeout(() => {
      console.log('⏰ Iframe load timeout reached');
      setIsLoading(false);
      setDebugInfo('Iframe load timeout - may still be loading');
    }, 10000); // 10 seconds timeout

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Debug Info */}
      {debugInfo && (
        <div className="bg-blue-50 border border-blue-200 p-2 text-sm text-blue-800">
          Debug: {debugInfo}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading GlobalBanka...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Unable to load GlobalBanka
          </h2>
          <p className="text-gray-600 mb-4">
            Please check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* GlobalBanka Iframe */}
      <div className="relative w-full" style={{ minHeight: '100vh' }}>
        <iframe
          src="https://globalbanka.roamjet.net"
          className={`w-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{ 
            height: '100vh',
            minHeight: '600px',
            display: 'block'
          }}
          title="GlobalBanka eSIM Store"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="payment; geolocation; microphone; camera; autoplay; clipboard-write"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-downloads"
          loading="eager"
        />
      </div>
    </div>
  );
}
