'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Handle scroll behavior
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        const currentScrollY = window.scrollY;
        
        // Show navbar when at top or scrolling up
        if (currentScrollY < 10 || currentScrollY < lastScrollY) {
          setIsVisible(true);
        } else {
          // Hide navbar when scrolling down
          setIsVisible(false);
        }
        
        setLastScrollY(currentScrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => window.removeEventListener('scroll', controlNavbar);
    }
  }, [lastScrollY]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className={`navbar-header bg-white/80 shadow-sm shadow-white/30 backdrop-blur-sm w-full top-0 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-2 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center">
            <span className="sr-only">RoamJet Plans</span>
            <img
              src="/images/logo_icon/logo.png"
              alt="Roam Jet Plans Logo"
              className="h-8 w-auto"
            />
            <span className="ml-1 text-xl font-bold text-gray-900">RoamJet</span>
          </Link>
        </div>
        
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="size-6">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-12">
          <Link href="/#how-it-works" className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors">
            Download App
          </Link>
          <Link href="/contact" className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors">
            Contact Us
          </Link>
          <Link href="/blog" className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors">
            Blog
          </Link>
        </div>
        
        {/* Right side spacer */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end"></div>
      </nav>

      {/* Mobile menu using Portal */}
      {isMenuOpen && mounted && createPortal(
        <div className="lg:hidden" style={{ zIndex: 999999, position: 'fixed', inset: 0 }}>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            style={{ zIndex: 999998 }}
            onClick={() => setIsMenuOpen(false)}
          ></div>
          <div 
            className="fixed inset-0 w-full h-full overflow-y-auto bg-white" 
            style={{ zIndex: 999999 }}
          >
            {/* Header with logo and close button */}
            <div className="flex items-center justify-between p-6">
              <Link href="/" className="
               flex items-center" onClick={() => setIsMenuOpen(false)}>
                <span className="sr-only">RoamJet Plans</span>
                <img
                  src="/images/logo_icon/logo.png"
                  alt="RoamJet Plans Logo"
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-bold text-gray-900">RoamJet</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="-m-2.5 rounded-md p-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="sr-only">Close menu</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="size-6">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            
            {/* Centered menu items */}
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6">
              <div className="space-y-8 text-center">
                <Link
                  href="/#how-it-works"
                  className="block text-2xl font-semibold text-gray-900 hover:text-tufts-blue transition-colors py-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Download App
                </Link>
                <Link
                  href="/contact"
                  className="block text-2xl font-semibold text-gray-900 hover:text-tufts-blue transition-colors py-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Contact Us
                </Link>
                <Link
                  href="/blog"
                  className="block text-2xl font-semibold text-gray-900 hover:text-tufts-blue transition-colors py-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Blog
                </Link>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};

export default Navbar;