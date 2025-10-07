'use client';

import { useEffect } from 'react';

const FacebookPixel = () => {
  useEffect(() => {
    // Function to load Facebook Pixel
    const loadFacebookPixel = () => {
      if (typeof window === 'undefined') return;
      
      // Check if pixel is already loaded
      if (window.fbq) {
        console.log('Facebook Pixel already loaded');
        return;
      }

      // Facebook Pixel Code
      (function(f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

      // Initialize the pixel with your Pixel ID
      window.fbq('init', '1421838312138067');
      
      // Track page view
      window.fbq('track', 'PageView');
      
      console.log('Facebook Pixel loaded and initialized');
    };

    // Function to check marketing consent
    const hasMarketingConsent = () => {
      try {
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (cookieConsent) {
          const consent = JSON.parse(cookieConsent);
          return consent.marketing === true;
        }
        return false;
      } catch (error) {
        console.error('Error checking marketing consent:', error);
        return false;
      }
    };

    // Function to remove Facebook Pixel
    const removeFacebookPixel = () => {
      if (typeof window === 'undefined') return;
      
      // Remove fbq function
      if (window.fbq) {
        delete window.fbq;
        delete window._fbq;
        console.log('Facebook Pixel removed');
      }
      
      // Remove script tags
      const scripts = document.querySelectorAll('script[src*="fbevents.js"]');
      scripts.forEach(script => script.remove());
    };

    // Load pixel if user has consented
    if (hasMarketingConsent()) {
      loadFacebookPixel();
    } else {
      console.log('Facebook Pixel not loaded - no marketing consent');
    }

    // Listen for consent changes
    const handleConsentChange = (event) => {
      if (event.detail && event.detail.marketing) {
        loadFacebookPixel();
      } else {
        removeFacebookPixel();
      }
    };

    // Listen for custom consent events
    window.addEventListener('cookieConsentChanged', handleConsentChange);
    
    // Listen for storage changes (in case consent is changed in another tab)
    const handleStorageChange = (event) => {
      if (event.key === 'cookieConsent') {
        if (hasMarketingConsent()) {
          loadFacebookPixel();
        } else {
          removeFacebookPixel();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Cleanup
    return () => {
      window.removeEventListener('cookieConsentChanged', handleConsentChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <>
      {/* Noscript fallback for Facebook Pixel */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src="https://www.facebook.com/tr?id=1421838312138067&ev=PageView&noscript=1"
          alt=""
        />
      </noscript>
    </>
  );
};

export default FacebookPixel;