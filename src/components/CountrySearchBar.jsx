'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { translateCountryName } from '../utils/countryTranslations';

const CountrySearchBar = ({ onSearch, showCountryCount = true }) => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  
  // Sync search value with URL params
  useEffect(() => {
    const urlSearchTerm = searchParams.get('search') || '';
    if (urlSearchTerm !== searchValue) {
      setSearchValue(urlSearchTerm);
    }
  }, [searchParams, searchValue]);
  
  // Check if current locale is RTL
  const isRTL = locale === 'ar' || locale === 'he';
  
  // Popular countries with their codes for translation
  const popularCountries = [
    { code: 'FR', name: 'France' },
    { code: 'US', name: 'USA' },
    { code: 'TH', name: 'Thailand' },
    { code: 'JP', name: 'Japan' },
    { code: 'ES', name: 'Spain' },
  ];

  // Helper function to get language prefix from pathname
  const getLanguagePrefix = () => {
    const languageCodes = ['ar', 'he', 'ru', 'de', 'fr', 'es'];
    for (const code of languageCodes) {
      if (pathname.startsWith(`/${code}/`) || pathname === `/${code}`) {
        return `/${code}`;
      }
    }
    return '';
  };

  // Check if we're on a store or esim-plans page
  const isOnStorePage = pathname.includes('/store') || pathname.includes('/esim-plans');

  const handleSearch = (e) => {
    e.preventDefault();
    
    const searchTerm = searchValue.trim();
    const langPrefix = getLanguagePrefix();
    
    if (searchTerm) {
      // If on store/esim-plans page, update URL query parameter
      if (isOnStorePage) {
        const params = new URLSearchParams(searchParams);
        params.set('search', searchTerm);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      } else {
        // If on landing page, navigate to store page with search
        const storePath = `${langPrefix}/store?search=${encodeURIComponent(searchTerm)}`;
        router.push(storePath);
      }
      
      // Also call onSearch callback if provided
      if (onSearch) {
        onSearch(searchTerm);
      }
    } else {
      // If no search term and on store page, just clear the search param
      if (isOnStorePage) {
        const params = new URLSearchParams(searchParams);
        params.delete('search');
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.push(newUrl, { scroll: false });
      } else {
        // Navigate to store page without search
        const storePath = `${langPrefix}/store`;
        router.push(storePath);
      }
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
            placeholder={isRTL ? `${t('hero.countriesAvailable', 'Now available in 200+ countries')} 🌍` : `🌍 ${t('hero.countriesAvailable', 'Now available in 200+ countries')}`}
            className={`w-full px-6 py-4 sm:py-5 ${isRTL ? 'pr-14 sm:pr-16 pl-6' : 'pr-14 sm:pr-16 pl-6'} text-base sm:text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:border-cobalt-blue focus:ring-2 focus:ring-cobalt-blue/20 transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-md placeholder:text-gray-500 placeholder:font-medium ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <button
            type="submit"
            className={`absolute ${isRTL ? 'right-2 sm:right-3' : 'right-2 sm:right-3'} top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white/95 border-2 border-cobalt-blue/30 hover:border-cobalt-blue p-3 sm:p-3.5 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cobalt-blue/50 shadow-lg`}
            aria-label="Search"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cobalt-blue" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Search Suggestions */}
        <div className="mt-3 flex flex-wrap justify-center gap-2 px-2">
          {popularCountries.map((country) => {
            const translatedName = translateCountryName(country.code, country.name, locale);
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  setSearchValue(country.name); // Use English name for search
                  const langPrefix = getLanguagePrefix();
                  
                  // If on store/esim-plans page, update URL query parameter
                  if (isOnStorePage) {
                    const params = new URLSearchParams(searchParams);
                    params.set('search', country.name);
                    router.push(`${pathname}?${params.toString()}`, { scroll: false });
                  } else {
                    // If on landing page, navigate to store page with search
                    const storePath = `${langPrefix}/store?search=${encodeURIComponent(country.name)}`;
                    router.push(storePath);
                  }
                  
                  // Also call onSearch callback if provided
                  if (onSearch) {
                    onSearch(country.name);
                  }
                }}
                className="text-xs sm:text-sm px-3 py-1 rounded-full bg-white/80 hover:bg-cobalt-blue/10 border border-jordy-blue/30 hover:border-cobalt-blue transition-all duration-200 text-gray-700 hover:text-cobalt-blue font-medium"
              >
                {translatedName}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
};

export default CountrySearchBar;
