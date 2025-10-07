'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import { getLanguageName, getLanguageFlag } from '../utils/languageUtils';

const LanguageSelector = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, changeLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: getLanguageName('en'), flag: getLanguageFlag('en'), route: '/' },
    { code: 'he', name: getLanguageName('he'), flag: getLanguageFlag('he'), route: '/hebrew' },
    { code: 'ru', name: getLanguageName('ru'), flag: getLanguageFlag('ru'), route: '/russian' },
    { code: 'ar', name: getLanguageName('ar'), flag: getLanguageFlag('ar'), route: '/arabic' },
    { code: 'de', name: getLanguageName('de'), flag: getLanguageFlag('de'), route: '/german' },
    { code: 'fr', name: getLanguageName('fr'), flag: getLanguageFlag('fr'), route: '/french' },
    { code: 'es', name: getLanguageName('es'), flag: getLanguageFlag('es'), route: '/spanish' }
  ];

  // Determine current language from I18n context first, then pathname
  const getCurrentLanguage = () => {
    // First try to use the I18n context locale
    if (locale) {
      return languages.find(lang => lang.code === locale) || languages.find(lang => lang.code === 'en');
    }
    
    // Fallback to pathname detection
    if (pathname === '/hebrew') return languages.find(lang => lang.code === 'he');
    if (pathname === '/arabic') return languages.find(lang => lang.code === 'ar');
    if (pathname === '/russian') return languages.find(lang => lang.code === 'ru');
    if (pathname === '/german') return languages.find(lang => lang.code === 'de');
    if (pathname === '/french') return languages.find(lang => lang.code === 'fr');
    if (pathname === '/spanish') return languages.find(lang => lang.code === 'es');
    return languages.find(lang => lang.code === 'en'); // default to English
  };

  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = async (language) => {
    setIsOpen(false);
    
    // Check if we're on a blog page
    const isBlogPage = pathname.includes('/blog');
    
    if (isBlogPage) {
      // For blog pages, just change the language context without navigation
      await changeLanguage(language.code);
    } else {
      // For other pages, navigate to the language-specific route
      router.push(language.route);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-tufts-blue transition-colors rounded-md hover:bg-gray-100"
        aria-label="Select Language"
      >
        <span>{currentLanguage.flag}</span>
        <span className="hidden lg:inline text-xs">{currentLanguage.code.toUpperCase()}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center space-x-3 ${
                  language.code === locale || (language.route === pathname && !locale) ? 'bg-tufts-blue text-white hover:bg-tufts-blue' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
                {(language.code === locale || (language.route === pathname && !locale)) && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
