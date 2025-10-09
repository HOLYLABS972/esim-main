'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

const CountrySearchBar = ({ onSearch, showCountryCount = true }) => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');
  
  // Check if current locale is RTL
  const isRTL = locale === 'ar' || locale === 'he';

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Force English language for search
    if (typeof window !== 'undefined') {
      localStorage.setItem('roamjet-language', 'en');
    }
    
    if (searchValue.trim()) {
      // Always use English URL for search
      const searchUrl = `/esim-plans?search=${encodeURIComponent(searchValue.trim())}`;
      router.push(searchUrl);
      
      // Also call onSearch callback if provided
      if (onSearch) {
        onSearch(searchValue.trim());
      }
    } else {
      // Always navigate to English plans page
      router.push('/esim-plans');
    }
  };

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={`🌍 ${t('hero.countriesAvailable', 'Now available in 200+ countries')}`}
            className={`w-full px-6 py-4 sm:py-5 ${isRTL ? 'pl-14 sm:pl-16 pr-6' : 'pr-14 sm:pr-16 pl-6'} text-base sm:text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:border-cobalt-blue focus:ring-2 focus:ring-cobalt-blue/20 transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-md placeholder:text-gray-500 placeholder:font-medium ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <button
            type="submit"
            className={`absolute ${isRTL ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white/95 border-2 border-cobalt-blue/30 hover:border-cobalt-blue p-3 sm:p-3.5 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cobalt-blue/50 shadow-lg`}
            aria-label="Search"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cobalt-blue" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Search Suggestions */}
        <div className="mt-3 flex flex-wrap justify-center gap-2 px-2">
          <span className="text-xs sm:text-sm text-gray-500">{t('search.popularDestinations', 'Popular:')}</span>
          {['France', 'USA', 'Thailand', 'Japan', 'Spain'].map((country) => (
            <button
              key={country}
              type="button"
              onClick={() => {
                setSearchValue(country);
                // Force English language
                if (typeof window !== 'undefined') {
                  localStorage.setItem('roamjet-language', 'en');
                }
                setTimeout(() => {
                  // Always use English URL
                  const searchUrl = `/esim-plans?search=${encodeURIComponent(country)}`;
                  router.push(searchUrl);
                }, 100);
              }}
              className="text-xs sm:text-sm px-3 py-1 rounded-full bg-white/80 hover:bg-cobalt-blue/10 border border-jordy-blue/30 hover:border-cobalt-blue transition-all duration-200 text-gray-700 hover:text-cobalt-blue font-medium"
            >
              {country}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};

export default CountrySearchBar;
