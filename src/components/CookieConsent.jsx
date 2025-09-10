'use client';

import React, { useState, useEffect } from 'react';
import { Cookie, X, Check } from 'lucide-react';
import Link from 'next/link';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay
      setTimeout(() => setShowBanner(true), 1000);
    }

    // For testing: Add a way to reset cookie consent
    // You can call this in browser console: window.resetCookieConsent()
    window.resetCookieConsent = () => {
      localStorage.removeItem('cookieConsent');
      setShowBanner(true);
      console.log('Cookie consent reset - banner should appear');
    };
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    const consent = {
      essential: true, // Essential cookies cannot be rejected
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('cookieConsent', JSON.stringify(consent));
    setShowBanner(false);
  };

  return (
    <>
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
          <div className="mx-auto max-w-7xl">
            <div className="relative">
              <div className="absolute inset-px rounded-xl bg-white"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl border-t border-tufts-blue/20 shadow-2xl">
                <div className="px-8 pt-6 pb-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <Cookie className="w-6 h-6 text-tufts-blue mr-3 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-medium tracking-tight text-eerie-black mb-1">
                          We use cookies to enhance your experience
                        </h3>
                        <p className="text-sm text-cool-black leading-relaxed">
                          We use cookies to provide you with the best possible experience on our website. 
                          Some cookies are essential for the site to function, while others help us improve our services and understand how you use our site.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowBanner(false)}
                      className="p-2 text-cool-black hover:text-eerie-black transition-colors duration-200 flex-shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Links */}
                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <Link 
                      href="/cookies" 
                      className="text-tufts-blue hover:text-cobalt-blue underline transition-colors duration-200"
                    >
                      Cookie Policy
                    </Link>
                    <Link 
                      href="/privacy" 
                      className="text-tufts-blue hover:text-cobalt-blue underline transition-colors duration-200"
                    >
                      Privacy Policy
                    </Link>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-tufts-blue/20">
                    <button
                      onClick={handleRejectAll}
                      className="px-6 py-2 border border-tufts-blue/30 text-cool-black rounded-xl hover:bg-tufts-blue/5 transition-colors duration-200 font-medium"
                    >
                      Reject All
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="btn-primary px-6 py-2 flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Accept All
                    </button>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;