'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import CountryCard from './CountryCard';

const CountriesGrid = ({ 
  countries, 
  isPlansPage, 
  searchTerm,
  onCountrySelect,
  userProfile,
  referralSettings,
  regularSettings,
  isLoading 
}) => {
  const { t } = useI18n();
  const router = useRouter();

  // Determine how many countries to show
  const displayedCountries = isPlansPage || searchTerm ? countries : countries.slice(0, 8);
  const showShowAllButton = !isPlansPage && !searchTerm && countries.length > 8;

  if (isLoading && countries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 shadow-lg mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('plans.loadingPlans', 'Loading countries...')}</p>
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm lg:text-base">
          {searchTerm 
            ? t('plans.noCountriesFound', 'No countries found matching your search')
            : t('plans.noCountriesAvailable', 'No countries available yet')
          }
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Grid Layout */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {displayedCountries.map((country) => (
          <CountryCard
            key={country.id}
            country={country}
            onClick={() => onCountrySelect(country)}
            userProfile={userProfile}
            referralSettings={referralSettings}
            regularSettings={regularSettings}
            isMobile={false}
          />
        ))}
      </div>
      
      {/* Show All Button for Desktop - Only on Landing Page */}
      {showShowAllButton && (
        <div className="hidden sm:block text-center mt-8">
          <button
            onClick={() => router.push('/esim-plans')}
            className="btn-primary px-8 py-3 text-white font-semibold rounded-full hover:bg-tufts-blue transition-all duration-200 shadow-lg"
          >
            {t('plans.showAll', 'Show All')}
          </button>
        </div>
      )}
      
      {/* Mobile List Layout */}
      <div className="sm:hidden grid grid-cols-2 gap-4">
        {displayedCountries.map((country) => (
          <CountryCard
            key={country.id}
            country={country}
            onClick={() => onCountrySelect(country)}
            userProfile={userProfile}
            referralSettings={referralSettings}
            regularSettings={regularSettings}
            isMobile={true}
          />
        ))}
      </div>
      
      {/* Show All Button for Mobile - Only on Landing Page */}
      {showShowAllButton && (
        <div className="sm:hidden text-center mt-8">
          <button
            onClick={() => router.push('/esim-plans')}
            className="btn-primary px-8 py-3 text-white font-semibold rounded-full hover:bg-tufts-blue transition-all duration-200 shadow-lg"
          >
            {t('plans.showAll', 'Show All')}
          </button>
        </div>
      )}
    </>
  );
};

export default CountriesGrid;

