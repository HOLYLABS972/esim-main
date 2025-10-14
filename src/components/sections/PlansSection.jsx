'use client';

import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';
import { translateCountryName } from '../../utils/countryTranslations';
import { usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';

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
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();
  const isRTL = getLanguageDirection(currentLanguage) === 'rtl';
  
  // Function to handle plan card click - redirect to app download
  const handlePlanClick = () => {
    // Use OneLink for smart routing to correct app store
    if (typeof window !== 'undefined' && window.APPSFLYER_ONELINK_URL) {
      console.log('📱 Opening AppsFlyer OneLink from plan card');
      window.open(window.APPSFLYER_ONELINK_URL, '_blank');
      return;
    }
    
    // Fallback: scroll to download section if OneLink not ready
    console.log('🖥️ OneLink not ready, scrolling to download section');
    const downloadSection = document.getElementById('how-it-works');
    if (downloadSection) {
      downloadSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Hardcoded popular plans for landing page
  const popularPlans = [
    {
      country: 'United States',
      countryCode: 'US',
      flag: '🇺🇸',
      data: '1GB',
      days: '7 Days',
      price: '$4.00'
    },
    {
      country: 'Poland',
      countryCode: 'PL',
      flag: '🇵🇱',
      data: '1GB',
      days: '7 Days',
      price: '$4.00'
    },
    {
      country: 'Thailand',
      countryCode: 'TH',
      flag: '🇹🇭',
      data: '1GB',
      days: '7 Days',
      price: '$4.00'
    },
    {
      country: 'Japan',
      countryCode: 'JP',
      flag: '🇯🇵',
      data: '1GB',
      days: '7 Days',
      price: '$4.00'
    }
  ];
  
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
        <div className="text-center mb-16 max-w-4xl mx-auto">
        <h2 className="text-center text-xl font-semibold text-tufts-blue"> <span>{'{ '}</span>
          {t('plans.title')}
          <span>{' }'}</span>
         </h2>
         <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl">                                                                                        
            {t('plans.subtitle')}
          </p>
          <div className={`text-eerie-black max-w-3xl mx-auto mt-4 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('plans.description').split('\n').map((line, index) => (
              <p key={index} className={index > 0 ? 'mt-2' : ''}>{line}</p>
            ))}
          </div>
        </div>

        {/* Hardcoded Popular Plans Preview */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {popularPlans.map((plan, index) => (
              <button
                key={index}
                className={`w-full px-4 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}
                onClick={handlePlanClick}
              >
                {isRTL ? (
                  <>
                    <div className="text-left">
                      <div className="text-lg font-semibold text-gray-900">{plan.price}</div>
                    </div>
                    <div className={`flex items-center space-x-4`}>
                      <div className="text-right">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {translateCountryName(plan.countryCode, plan.country, locale)}
                        </h3>
                        <p className="text-sm text-gray-500">1GB • 7 Days</p>
                      </div>
                      <div className="flex-shrink-0" style={{ padding: '10px' }}>
                        <span className="text-2xl">{plan.flag}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={`flex items-center space-x-4`}>
                      <div className="flex-shrink-0">
                        <span className="text-2xl">{plan.flag}</span>
                      </div>
                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {translateCountryName(plan.countryCode, plan.country, locale)}
                        </h3>
                        <p className="text-sm text-gray-500">1GB • 7 Days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">{plan.price}</div>
                    </div>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Get 35% OFF Button */}
        <div className="text-center mt-12">
          <button
            onClick={handlePlanClick}
            className={`btn-secondary inline-flex items-center ${isRTL ? 'flex-row-reverse gap-2' : 'gap-2'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{t('discount.get35Off', 'Get 35% OFF')}</span>
          </button>
        </div>
        
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
