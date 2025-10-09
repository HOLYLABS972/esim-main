'use client';

import { useI18n } from '../../contexts/I18nContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { trackCustomFacebookEvent } from '../../utils/facebookPixel';
import CountrySearchBar from '../CountrySearchBar';
import toast from 'react-hot-toast';

export default function HeroSection() {
  const { t, isLoading, locale } = useI18n();
  const router = useRouter();
  
  // Check if current locale is RTL
  const isRTL = locale === 'ar' || locale === 'he';
  
  // Generate localized URLs
  const getLocalizedUrl = (path) => {
    if (locale === 'en') {
      return path;
    }
    return `/${locale}${path}`;
  };

  const handleDownloadApp = () => {
    // Track with Facebook Pixel
    trackCustomFacebookEvent('DownloadAppClick', {
      source: 'hero_section',
      content_type: 'download_button'
    });
    
    // OneLink handles platform detection automatically
    if (typeof window !== 'undefined' && window.APPSFLYER_ONELINK_URL) {
      console.log('Opening AppsFlyer OneLink - smart routing to correct store');
      window.open(window.APPSFLYER_ONELINK_URL, '_blank');
    } else {
      console.warn('OneLink URL not ready yet');
    }
  };

  const handleCopyDiscountCode = async () => {
    const discountCode = 'OCTOBER35';
    try {
      await navigator.clipboard.writeText(discountCode);
      toast.success('Discount code OCTOBER35 copied! 35% off your purchase!', {
        duration: 4000,
        icon: '🎉',
      });
    } catch (err) {
      toast.error('Failed to copy code. Please try again.');
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex flex-col">
        <div className="relative isolate px-6 pt-14 lg:px-8 flex-1 flex flex-col">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 flex-1 flex flex-col justify-center">
            <div className="text-center">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
                <div className="h-12 bg-gray-200 rounded w-1/3 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen ">
      <div className="relative isolate px-6 pt-10 lg:px-8 flex-1 flex flex-col">
        {/* Top Gradient Blob */}
        <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div 
            style={{ 
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              background: 'linear-gradient(to top right, #1A5798, #93BFEE)',
            }} 
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] opacity-40 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          ></div>
        </div>

        <div className="mx-auto max-w-5xl py-6 sm:py-12 lg:py-24  justify-center">
          {/* Country Search Bar */}
          <div className="mb-8 sm:mb-12">
            <CountrySearchBar showCountryCount={true} />
          </div>

          {/* Main Content */}  
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-semibold text-balance text-gray-600 relative">
              {/* Mobile Layout */}
              <div className="block sm:hidden space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-eerie-black font-semibold">{t('hero.stayConnected')}</span>
                  <span className="inline-block transform -rotate-12 pointer-events-none">
                    <div className="w-10 h-10 bg-white border-2 border-cobalt-blue rounded-lg shadow-lg flex items-center justify-center">
                      <Image src="/images/logo_icon/sx.png" alt="Globe" width={32} height={32} className="w-8 h-8 sm:w-6 sm:h-6" />
                    </div>
                  </span> 
                </div>
                <div>{t('hero.noMatterWhere')}</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-eerie-black font-semibold">{t('hero.with')}</span>
                  <div className="w-10 h-10 bg-alice-blue border-2 border-alice-blue rounded-xl shadow-lg flex items-center justify-center rotate-6">
                    <Image src="/images/logo_icon/ioslogo.png" alt="iOS Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
                  </div>
                  <span className="text-eerie-black font-semibold">Roam<span className="text-cobalt-blue font-semibold">Jet</span></span>
                </div>
                
              </div>
              
              {/* Desktop Layout */}
              <div className="hidden sm:flex flex-wrap items-center justify-center gap-3 lg:gap-4">
                <span>
                  <span className="text-eerie-black font-semibold">{t('hero.stayConnected')} </span> 
                  <span className="inline-block transform -rotate-12 pointer-events-none mr-2">
                    <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white border-3 lg:border-4 border-cobalt-blue rounded-xl shadow-lg shadow-cool-black flex items-center justify-center">
                      <Image src="/images/logo_icon/sx.png" alt="Globe" width={48} height={48} className="w-10 h-10 lg:w-12 lg:h-12" />
                    </div>
                  </span> 
                  {t('hero.noMatterWhere').split(' ')[0]} 
                </span>
                <span>{t('hero.noMatterWhere').split(' ').slice(1).join(' ')} <span className="text-eerie-black font-semibold">{t('hero.with')}</span></span>
                
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-alice-blue border-3 lg:border-4 border-alice-blue rounded-2xl shadow-lg shadow-cobalt-blue flex items-center justify-center rotate-6">
                  <Image src="/images/logo_icon/ioslogo.png" alt="iOS Logo" width={48} height={48} className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl" />
                </div>
                  
                <span className="text-eerie-black font-semibold">Roam<span className="text-cobalt-blue font-semibold">Jet</span></span>
              </div>
            </h1>
              
            <p className="mx-auto max-w-4xl py-6 text-base sm:text-lg lg:text-xl font-medium text-pretty text-gray-600 px-4 sm:px-0">
              {t('hero.description')}
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
              <button
                onClick={handleDownloadApp}
                className="btn-primary w-full sm:w-auto"
              >
                {t('hero.downloadApp')}
              </button>
              <button
                onClick={handleCopyDiscountCode}
                className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {t('discount.get35Off', 'Get 35% OFF')}
              </button>
            </div>
          </div>


          
        </div>

        {/* Bottom Gradient Blob */}
        <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div 
            style={{ 
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              background: 'linear-gradient(to top right, #1A5798, #93BFEE)',
              boxShadow: '0px 4px 16px rgba(70, 139, 230, 0.2)',
            }} 
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
      </div>
    </div>
  );
}