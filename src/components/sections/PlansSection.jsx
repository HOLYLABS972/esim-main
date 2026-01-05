'use client';

import React, { Suspense } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';
import { usePathname } from 'next/navigation';
import CountrySearchBar from '../CountrySearchBar';
import AiraloPackagesSection from './AiraloPackagesSection';

export default function PlansSection() {
  const { t, locale, isLoading } = useI18n();
  const pathname = usePathname();

  // Get current language for RTL detection
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname) || 'en';
  };

  const currentLanguage = getCurrentLanguage();
  const isRTL = getLanguageDirection(currentLanguage) === 'rtl';

  if (isLoading) {
    return (
      <section className="py-16 bg-white relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 relative z-10">
          <div className="animate-pulse space-y-8">
            <div className="text-center">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </section>
    );
  }

  // Reduce top padding for Hebrew and Arabic since Features section is hidden
  const topPadding = (locale === 'he' || locale === 'ar') ? 'pt-8' : 'py-16';

  return (
    <section id="esim-plans" className={`${topPadding} pb-16 scroll-mt-20 bg-white relative overflow-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-8 max-w-4xl mx-auto">
          <p className="mx-auto max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
            {t('plans.subtitle')}
          </p>
          <div className="text-eerie-black max-w-3xl mx-auto mt-4 mb-8 text-center">
            {t('plans.description').split('\n').map((line, index) => (
              <p key={index} className={index > 0 ? 'mt-2' : ''}>{line}</p>
            ))}
          </div>

          {/* Search Bar */}
          <Suspense fallback={<div className="h-16" />}>
            <CountrySearchBar showCountryCount={true} />
          </Suspense>
        </div>

        {/* Airalo Packages Section with Tabs (Global, Regional, Countries) */}
        <Suspense fallback={
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">{t('plans.loadingPlans', 'Loading packages...')}</p>
          </div>
        }>
          <AiraloPackagesSection />
        </Suspense>

        {/* Bottom Gradient Blob */}
        <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div
            style={{
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              background: 'linear-gradient(to top right, #1A5798, #93BFEE)'
            }}
            className="relative right-[calc(50%-36rem)] aspect-[1155/678] w-[12.125rem] translate-x-1/2 opacity-30 sm:right-[calc(50%+36rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
      </div>
    </section>
  );
}
