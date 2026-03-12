'use client';

import { useI18n } from '../../contexts/I18nContext';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function HeroSection() {
  const { t, isLoading, locale } = useI18n();

  // Check if current locale is RTL
  const isRTL = locale === 'ar' || locale === 'he';

  // Generate localized URLs
  const getLocalizedUrl = (path) => {
    if (locale === 'en') {
      return path;
    }
    return `/${locale}${path}`;
  };

  const handleScrollToPlans = () => {
    const el = document.getElementById('esim-plans');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          <div className="mb-8 flex justify-center">
            <a
              href="http://foxywall.xyz/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex max-w-3xl items-center gap-3 rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 via-white to-red-100 px-4 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md sm:px-5"
            >
              <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                30% OFF
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-red-700 sm:text-base">
                  {t('hero.vpnBannerTitle', 'VPN discount available now')}
                </div>
                <div className="text-xs text-gray-600 sm:text-sm">
                  {t('hero.vpnBannerSubtitle', 'Redeem now on Foxywall')}
                </div>
              </div>
              <span className={`shrink-0 text-sm font-semibold text-red-700 transition-transform duration-200 group-hover:translate-x-0.5 ${isRTL ? 'mr-auto' : 'ml-auto'}`}>
                {t('hero.vpnBannerCta', 'Redeem now')} →
              </span>
            </a>
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
            {/* Browse Plans - search bar look, button behavior (in hero, not fixed) */}
            <div className="mt-[60px] w-full max-w-3xl mx-auto px-4" dir={isRTL ? 'rtl' : 'ltr'}>
              <button
                type="button"
                onClick={handleScrollToPlans}
                className="relative w-full group cursor-pointer text-left border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-cobalt-blue/50 focus:ring-offset-2"
                aria-label={t('hero.learnMore', 'Browse Plans')}
              >
                <div className={`relative flex items-center w-full px-6 py-4 sm:py-5 text-base sm:text-lg border-2 border-gray-200 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 ${isRTL ? 'pr-6 pl-24 sm:pl-28' : 'pl-6 pr-24 sm:pr-28'}`}>
                  <span className="text-gray-500 font-medium pointer-events-none">
                    {t('hero.learnMore', 'Browse Plans')}
                  </span>
                  <span className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/80 backdrop-blur-md border-2 border-cobalt-blue/30 group-hover:border-cobalt-blue group-hover:bg-white/95 transition-all duration-300 group-hover:scale-105 shadow-lg pointer-events-none ${isRTL ? 'left-2 sm:left-3' : 'right-2 sm:right-3'}`}>
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-cobalt-blue" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </span>
                </div>
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
