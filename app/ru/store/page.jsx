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
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center">
            Магазин RoamJet
          </h1>
          <p className="text-center mt-2 text-blue-100">
            Откройте для себя наш полный ассортимент туристических продуктов и услуг
          </p>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Загрузка магазина...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Не удалось загрузить магазин
          </h2>
          <p className="text-gray-600 mb-4">
            Пожалуйста, проверьте подключение к интернету и попробуйте снова.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Store Iframe */}
      <div className="relative w-full" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <iframe
          src="https://store.roamjet.net/ru"
          className={`w-full border-0 ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{ 
            height: 'calc(100vh - 200px)',
            minHeight: '600px'
          }}
          title="Магазин RoamJet"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="payment; geolocation; microphone; camera"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        />
      </div>

      {/* Fallback Link */}
      <div className="bg-gray-50 py-8 text-center">
        <p className="text-gray-600 mb-4">
          Проблемы с просмотром магазина?
        </p>
        <a
          href="https://store.roamjet.net/ru"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span>Открыть магазин в новой вкладке</span>
          <svg 
            className="ml-2 w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
