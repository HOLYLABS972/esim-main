'use client';

import { useI18n } from '../../contexts/I18nContext';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function FeaturesSection() {
  const { t, locale, isLoading } = useI18n();
  const pathname = usePathname();

  // Get language prefix from pathname
  const getLanguagePrefix = () => {
    const languageCodes = ['ar', 'he', 'ru', 'de', 'fr', 'es'];
    for (const code of languageCodes) {
      if (pathname.startsWith(`/${code}/`) || pathname === `/${code}`) {
        return `/${code}`;
      }
    }
    return '';
  };

  const langPrefix = getLanguagePrefix();
  
  if (isLoading) {
    return (
      <div className="bg-alice-blue py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="animate-pulse space-y-8">
            <div className="text-center">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 space-y-4">
                  <div className="h-6 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="features-section bg-white py-16 sm:py-24 lg:py-32">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:max-w-7xl lg:px-8">
        <h2 className="text-center text-lg sm:text-xl font-semibold text-tufts-blue">
          <span>{'{ '}</span>
          {t('features.title')}
          <span>{' }'}</span>
        </h2>
        <p className="mx-auto mt-6 sm:mt-12 max-w-4xl text-center text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold tracking-tight text-eerie-black">
          {t('features.subtitle')}
        </p>
        
        {/* 3 Feature Blocks */}
        <div className="mt-12 sm:mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* 1. Global Coverage */}
          <div className="bg-blue-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-6">
              <Image 
                src="/images/frontend/home/361053945_fb50482a-76fc-47ca-82b4-9fd33e920ad6.svg" 
                alt="World Globe" 
                width={120}
                height={120}
                className="w-24 h-24 sm:w-28 sm:h-28"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
              {t('features.globalCoverage.title')}
            </h3>
            <p className="text-gray-600 text-center mb-4 text-sm">
              {t('features.globalCoverage.description')}
            </p>
            <div className="text-center pt-4 border-t border-gray-200">
              <div className="text-2xl font-bold text-tufts-blue">{t('features.globalCoverage.countriesCount')}</div>
              <div className="text-sm text-gray-500">{t('features.globalCoverage.countriesLabel')}</div>
            </div>
          </div>

          {/* 2. Device Compatibility */}
          <div className="bg-blue-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="flex justify-center mb-4">
              <span className="text-5xl">📱</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
              {t('features.deviceCompatibility.title')}
            </h3>
            <p className="text-gray-600 text-center mb-6 text-sm">
              {t('features.deviceCompatibility.description')}
            </p>
            <div className="space-y-3 mb-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{t('features.deviceCompatibility.supportedBrands')}</div>
                <div className="text-sm font-medium text-gray-900">{t('features.deviceCompatibility.supportedBrandsList')}</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-xs text-gray-500 mb-1">{t('features.deviceCompatibility.requirements')}</div>
                <div className="text-sm font-medium text-gray-900">{t('features.deviceCompatibility.requirementsList')}</div>
              </div>
            </div>
            <div className="text-center pt-4 border-t border-gray-200">
              <Link 
                href={`${langPrefix}/device-compatibility`}
                className="text-tufts-blue hover:text-cobalt-blue font-medium transition-colors inline-flex items-center"
              >
                {t('features.deviceCompatibility.checkYourDevice')}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* 3. Secure Payment */}
          <div className="bg-blue-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
              {t('features.securePayment.title')}
            </h3>
            <p className="text-gray-600 text-center mb-6 text-sm">
              {t('features.securePayment.description')}
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                <Image 
                  src="/images/frontend/home/visa.png" 
                  alt="Visa" 
                  width={56}
                  height={56}
                  className="h-12 w-auto"
                />
              </div>
              <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                <Image 
                  src="/images/frontend/home/card.png" 
                  alt="Mastercard" 
                  width={56}
                  height={56}
                  className="h-12 w-auto"
                />
              </div>
              <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                <Image 
                  src="/images/frontend/home/paypal.png" 
                  alt="PayPal" 
                  width={56}
                  height={56}
                  className="h-12 w-auto"
                />
              </div>
              <div className="bg-white rounded-lg p-3 flex items-center justify-center">
                <Image 
                  src="/images/frontend/home/apple-pay.png" 
                  alt="Apple Pay" 
                  width={56}
                  height={56}
                  className="h-12 w-auto"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center flex-wrap gap-4 text-xs text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>Powered by Stripe</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <span>PCI DSS Compliant</span>
                </div>
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}
