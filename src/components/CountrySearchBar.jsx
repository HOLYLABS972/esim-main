'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { translateCountryName } from '../utils/countryTranslations';

const CountrySearchBar = ({ onSearch, showCountryCount = true }) => {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Sync search value with URL params
  useEffect(() => {
    if (!mounted) return;
    const urlSearchTerm = searchParams.get('search') || '';
    setSearchValue(urlSearchTerm);
  }, [searchParams, mounted]);
  
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

  // Check if we're on an esim-plans page
  const isOnEsimPlansPage = pathname.includes('/esim-plans');

  const handleSearch = (e) => {
    e.preventDefault();
    
    const searchTerm = searchValue.trim();
    const langPrefix = getLanguagePrefix();
    
    if (searchTerm) {
      // If on esim-plans page, update URL query parameter
      if (isOnEsimPlansPage) {
        const params = new URLSearchParams(searchParams);
        params.set('search', searchTerm);
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      } else {
        // If on landing page, scroll to plans section and update URL with search param
        const plansSection = document.getElementById('esim-plans');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth' });
          // Update URL with search parameter without navigating
          const newUrl = `${window.location.pathname}?search=${encodeURIComponent(searchTerm)}`;
          window.history.pushState({}, '', newUrl);
        } else {
          // If plans section not found, navigate to home with search param
          router.push(`${langPrefix}/?search=${encodeURIComponent(searchTerm)}`);
        }
      }
      
      // Also call onSearch callback if provided
      if (onSearch) {
        onSearch(searchTerm);
      }
    } else {
      // Clear the search param from URL
      const params = new URLSearchParams(searchParams);
      params.delete('search');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      
      if (isOnEsimPlansPage) {
        router.push(newUrl, { scroll: false });
      } else {
        // On home page, update URL and scroll to plans section
        router.push(newUrl, { scroll: false });
        const plansSection = document.getElementById('esim-plans');
        if (plansSection) {
          plansSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
      
      // Also call onSearch callback if provided
      if (onSearch) {
        onSearch('');
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    
    // If input is cleared, also clear URL param immediately
    if (!value.trim() && mounted) {
      const params = new URLSearchParams(searchParams);
      params.delete('search');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
      
      // Also call onSearch callback if provided
      if (onSearch) {
        onSearch('');
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSearchValue('');
    
    // Clear URL param
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
    
    // Also call onSearch callback if provided
    if (onSearch) {
      onSearch('');
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
            className={`w-full px-6 py-4 sm:py-5 ${isRTL ? 'pr-24 sm:pr-28 pl-6' : 'pl-6 pr-24 sm:pr-28'} text-base sm:text-lg border-2 border-gray-200 rounded-full focus:outline-none focus:border-cobalt-blue focus:ring-2 focus:ring-cobalt-blue/20 transition-all duration-300 shadow-lg hover:shadow-xl bg-white/90 backdrop-blur-md placeholder:text-gray-500 placeholder:font-medium ${isRTL ? 'text-right' : 'text-left'}`}
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClear}
              className={`absolute ${isRTL ? 'left-14 sm:left-16' : 'right-14 sm:right-16'} top-1/2 transform -translate-y-1/2 bg-gray-200/80 hover:bg-gray-300/90 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400/50`}
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
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
      </form>
    </div>
  );
};

export default CountrySearchBar;
