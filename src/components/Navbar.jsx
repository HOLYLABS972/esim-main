'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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

  return (
    <header className={`bg-white/80 shadow-sm shadow-white/30 backdrop-blur-sm fixed w-full top-0 z-50 transition-transform duration-300 ${
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

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-10 bg-black bg-opacity-25" onClick={() => setIsMenuOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
            <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center">
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
                className="-m-2.5 rounded-md p-2.5 text-gray-700"
              >
                <span className="sr-only">Close menu</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="size-6">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-6 flow-root">
              <div className="-my-6 divide-y divide-gray-500/10">
                <div className="space-y-2 py-6">
                  <Link
                    href="/#how-it-works"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Download App
                  </Link>
                  <Link
                    href="/contact"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Contact Us
                  </Link>
                  <Link
                    href="/blog"
                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-gray-900 hover:bg-gray-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Blog
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;