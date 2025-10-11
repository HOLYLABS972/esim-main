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
    <div className="w-full max-w-2xl mx-auto " dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={`${t('hero.countriesAvailable', 'Now available in 200+ countries')}`}
            className={`w-full ${isRTL ? 'pl-12 sm:pl-16 pr-6' : 'pr-14 sm:pr-16 pl-6'} text-base sm:text-lg border-4 border-gray-200/40 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-200/30 bg-white/70 focus:border-blue-200/20 backdrop-blur-md placeholder:text-gray-500 focus:ring-blue-200/20 placeholder:font-medium outline-none ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <button
            type="submit"
            className={`absolute ${isRTL ? 'left-2 sm:left-3' : 'right-2 sm:right-3'} top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white/95 border-2 border-cobalt-blue/30 hover:border-cobalt-blue p-1 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cobalt-blue/50 shadow-lg`}
            aria-label="Search"
          >
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          </button>
        </div>
        
        {/* Search Suggestions */}
        <div className="mt-3 flex flex-wrap justify-center gap-2 px-2">
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
              className="text-xs sm:text-sm px-3 py-1 rounded-full bg-white/60 hover:bg-cobalt-blue/10 border border-jordy-blue/30 hover:border-cobalt-blue transition-all duration-200 text-gray-700 hover:text-cobalt-blue font-medium"
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
