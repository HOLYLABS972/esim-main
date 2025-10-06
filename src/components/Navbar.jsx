'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import LanguageSelector from './LanguageSelector';
import { detectPlatform } from '../utils/platformDetection';

const Navbar = ({ hideLanguageSelector = false }) => {
  const { t } = useI18n();
  const { currentUser, logout } = useAuth();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleDownloadApp = () => {
    const platform = detectPlatform();
    
    // For mobile users, open platform-specific app store link
    if (platform.isMobile && platform.downloadUrl) {
      window.open(platform.downloadUrl, '_blank');
    } else {
      // For desktop users, scroll to download section
      const appLinksSection = document.querySelector('[id="AppLinksSection"]');
      if (appLinksSection) {
        appLinksSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };
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

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className={`navbar-header fixed w-full top-0 transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`} style={{ zIndex: 9999 }}>
      <div className="bg-white/80 shadow-sm shadow-white/30 backdrop-blur-sm w-full">
      <nav aria-label="Global" className="mx-auto flex max-w-7xl items-center justify-between p-2 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center">
            <span className="sr-only">RoamJet Plans</span>
            <img
              src="/images/logo_icon/logo.png"
              alt="Roam Jet Plans Logo"
              className="h-8 w-auto"
            />
            <span className="ml-2 text-xl font-semibold text-gray-900">{t('navbar.logo', 'RoamJet')}</span>
          </Link>
        </div>
        
        <div className="flex lg:hidden items-center space-x-2">
          {!hideLanguageSelector && <LanguageSelector />}
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">{t('navbar.openMenu', 'Open main menu')}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className="size-6">
              <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        
        <div className="hidden lg:flex lg:gap-x-12">
          <button 
            onClick={handleDownloadApp}
            className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors bg-transparent border-none cursor-pointer"
          >
            {t('navbar.downloadApp', 'Download App')}
          </button>
          <Link href="/contact" className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors">
            {t('navbar.contactUs', 'Contact Us')}
          </Link>
          <Link href="/blog" className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors">
            {t('navbar.blog', 'Blog')}
          </Link>
          {currentUser ? (
            <>
              <Link href="/esim-plans" className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors">
                {t('navbar.plans', 'Plans')}
              </Link>
              <Link href="/dashboard" className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors">
                {t('navbar.dashboard', 'Dashboard')}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors"
              >
                {t('navbar.logout', 'Logout')}
              </button>
            </>
          ) : (
            <Link href="/login" className="text-sm/6 font-semibold text-gray-900 hover:text-tufts-blue transition-colors">
              {t('navbar.login', 'Login')}
            </Link>
          )}
        </div>
        
        {/* Right side with language selector */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end">
          {!hideLanguageSelector && <LanguageSelector />}
        </div>
      </nav>
      </div>

      {/* Mobile menu using Portal */}
      {isMenuOpen && mounted && createPortal(
        <div className="lg:hidden" style={{ zIndex: 99999, position: 'fixed', inset: 0 }}>
          <div 
            className="fixed inset-0 w-full h-full overflow-y-auto bg-white/80 backdrop-blur-sm" 
            style={{ zIndex: 99999 }}
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
                <span className="sr-only">{t('navbar.closeMenu', 'Close menu')}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="size-6">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            
            {/* Centered menu items */}
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6">
              <div className="space-y-8 text-center">
                {/* Language Selector */}
                {!hideLanguageSelector && (
                  <div className="mb-4">
                    <LanguageSelector />
                  </div>
                )}
                
                {/* Main Navigation Group */}
                <div className="p-4 w-full max-w-xs">
                  <button
                    onClick={() => {
                      handleDownloadApp();
                      setIsMenuOpen(false);
                    }}
                    className="block text-lg font-semibold text-gray-700 hover:text-tufts-blue hover:bg-white rounded-md transition-all duration-200 py-3 px-4 text-center mb-2 w-full bg-transparent border-none cursor-pointer"
                  >
                    {t('navbar.downloadApp', 'Download App')}
                  </button>
                  <Link
                    href="/contact"
                    className="block text-lg font-semibold text-gray-700 hover:text-tufts-blue hover:bg-white rounded-md transition-all duration-200 py-3 px-4 text-center mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navbar.contactUs', 'Contact Us')}
                  </Link>
                  <Link
                    href="/blog"
                    className="block text-lg font-semibold text-gray-700 hover:text-tufts-blue hover:bg-white rounded-md transition-all duration-200 py-3 px-4 text-center mb-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('navbar.blog', 'Blog')}
                  </Link>
                  {currentUser && (
                    <>
                      <Link
                        href="/esim-plans"
                        className="block text-lg font-semibold text-gray-700 hover:text-tufts-blue hover:bg-white rounded-md transition-all duration-200 py-3 px-4 text-center mb-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('navbar.plans', 'Plans')}
                      </Link>
                      <Link
                        href="/dashboard"
                        className="block text-lg font-semibold text-gray-700 hover:text-tufts-blue hover:bg-white rounded-md transition-all duration-200 py-3 px-4 text-center mb-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {t('navbar.dashboard', 'Dashboard')}
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="block w-full text-lg font-semibold text-gray-700 hover:text-tufts-blue hover:bg-white rounded-md transition-all duration-200 py-3 px-4 text-center mb-2"
                      >
                        {t('navbar.logout', 'Logout')}
                      </button>
                    </>
                  )}
                </div>
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