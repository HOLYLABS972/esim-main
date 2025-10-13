import React from 'react';
import { Globe, QrCode, Wallet } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';

const StatsCards = ({ orders, activeOrders, referralStats }) => {
  const router = useRouter();
  const { t, locale } = useI18n();
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

  const langPrefix = getLanguagePrefix();

  return (
    <section className="bg-white py-8 stats-card" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Orders Card */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className={`text-lg font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.totalOrders', 'Total Orders')}
                    </p>
                    <p className={`text-2xl font-bold text-eerie-black mt-2 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isRTL ? (
                        <>
                          {orders.length}
                          <Globe className="w-6 h-6 text-tufts-blue ml-2" />
                        </>
                      ) : (
                        <>
                          <Globe className="w-6 h-6 text-tufts-blue mr-2" />
                          {orders.length}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Active eSIMs Card */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className={`text-lg font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.activeEsims', 'Active eSIMs')}
                    </p>
                    <p className={`text-2xl font-bold text-cool-black mt-2 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {isRTL ? (
                        <>
                          {activeOrders.length}
                          <QrCode className="w-6 h-6 text-tufts-blue ml-2" />
                        </>
                      ) : (
                        <>
                          <QrCode className="w-6 h-6 text-tufts-blue mr-2" />
                          {activeOrders.length}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Performance Card */}
          <div 
            className="relative cursor-pointer group"
            onClick={() => router.push(`${langPrefix}/affiliate-program`)}
          >
            <div className="absolute inset-px rounded-xl bg-white group-hover:bg-gray-50 transition-colors"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <p className={`text-lg font-medium text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.yourPerformance', 'Your Performance')}
                    </p>
                   
                    <div className={`flex items-center mt-2 ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                      <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                        {isRTL ? (
                          <>
                            <p className="text-2xl font-bold text-cool-black">${referralStats.totalEarnings.toFixed(2)}</p>
                            <Wallet className="w-6 h-6 text-tufts-blue ml-2" />
                          </>
                        ) : (
                          <>
                            <Wallet className="w-6 h-6 text-tufts-blue mr-2" />
                            <p className="text-2xl font-bold text-cool-black">${referralStats.totalEarnings.toFixed(2)}</p>
                          </>
                        )}
                      </div>
                      <p className={`text-xs text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('dashboard.totalEarnings', 'Total Earnings')}
                      </p>
                      {(referralStats.usageCount || 0) > 0 && (
                        <div className={`${isRTL ? 'border-r border-gray-200 pr-4' : 'border-l border-gray-200 pl-4'}`}>
                          <p className="text-2xl font-bold text-cool-black">{Math.floor(referralStats.usageCount || 0)}</p>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs text-tufts-blue mt-2 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {isRTL ? 
                        `← ${t('dashboard.tapToJoinAffiliate', 'Tap to join affiliate program')}` : 
                        `${t('dashboard.tapToJoinAffiliate', 'Tap to join affiliate program')} →`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5 group-hover:ring-gray-300 transition-colors"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsCards;
