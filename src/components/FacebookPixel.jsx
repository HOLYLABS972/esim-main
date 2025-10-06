'use client';

import { useEffect } from 'react';

const FacebookPixel = () => {
  useEffect(() => {
    // Function to load Facebook Pixel
    const loadFacebookPixel = () => {
      // Check if Facebook Pixel is already loaded
      if (window.fbq) return;

      // Initialize Facebook Pixel function
      window.fbq = function(...args) {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, args);
        } else {
          window.fbq.queue.push(args);
        }
      };
      
      if (!window._fbq) window._fbq = window.fbq;
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.version = '2.0';
      window.fbq.queue = [];

      // Load the Facebook Pixel script
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript.parentNode.insertBefore(script, firstScript);
      
      // Initialize with your pixel ID and track page view
      window.fbq('init', '1421838312138067');
      window.fbq('track', 'PageView');

      console.log('Facebook Pixel loaded successfully');
    };

    // Function to check cookie consent and load pixel if consent given
    const checkConsentAndLoadPixel = () => {
      try {
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (cookieConsent) {
          const consent = JSON.parse(cookieConsent);
          // Load Facebook Pixel if user consented to marketing cookies
          if (consent.marketing === true) {
            loadFacebookPixel();
          }
        }
      } catch (error) {
        console.error('Error checking cookie consent:', error);
      }
    };

    // Check consent immediately
    checkConsentAndLoadPixel();

    // Listen for changes in localStorage (when user updates consent)
    const handleStorageChange = (e) => {
      if (e.key === 'cookieConsent') {
        checkConsentAndLoadPixel();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events from cookie consent component
    const handleConsentUpdate = () => {
      checkConsentAndLoadPixel();
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
    };
  }, []);

  // Add noscript fallback
  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (cookieConsent) {
      const consent = JSON.parse(cookieConsent);
      if (consent.marketing === true) {
        // Add noscript image for users with JavaScript disabled
        const noscriptImg = document.createElement('noscript');
        noscriptImg.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1421838312138067&ev=PageView&noscript=1" />`;
        document.head.appendChild(noscriptImg);
      }
    }
  }, []);

  return null; // This component doesn't render anything
};

export default FacebookPixel;
