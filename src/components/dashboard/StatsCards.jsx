import React from 'react';
import { Globe, QrCode, Wallet, Users } from 'lucide-react';
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

  return (
    <section className="bg-white py-4 stats-card" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl px-4 lg:max-w-7xl lg:px-8 py-2 lg:py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Orders Card */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl border-2 border-gray-200/50 shadow-xl shadow-gray-200/50 bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-4 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8">
                <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="w-full">
                    <p className={`text-base font-medium text-cool-black mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.totalOrders', 'Total Orders')}
                    </p>
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Globe className={`w-6 h-6 text-tufts-blue ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <span className="text-2xl sm:text-3xl font-bold text-cool-black">
                        {orders.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Active eSIMs Card */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl border-2 border-gray-200/50 shadow-xl shadow-gray-200/50 bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-4 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8">
                <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="w-full">
                    <p className={`text-base font-medium text-cool-black mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.activeEsims', 'Active eSIMs')}
                    </p>
                    <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <QrCode className={`w-6 h-6 text-tufts-blue ${isRTL ? 'ml-2' : 'mr-2'}`} />
                      <span className="text-2xl sm:text-3xl font-bold text-cool-black">
                        {activeOrders.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Performance Card */}
          <div 
            className="relative cursor-pointer group"
            onClick={() => router.push('/affiliate-program')}
          >
            <div className="absolute inset-px rounded-xl border-2 border-gray-200/50 shadow-xl shadow-gray-200/50 bg-white group-hover:bg-gray-50 transition-colors"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-4 pt-6 pb-6 md:px-8 md:pt-8 md:pb-8">
                <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="w-full">
                    <p className={`text-base font-medium text-cool-black mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.yourPerformance', 'Your Performance')}
                    </p>
                   
                    <div className="space-y-2">
                      <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Wallet className={`w-6 h-6 text-tufts-blue ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        <span className="text-2xl sm:text-3xl font-bold text-cool-black">
                          ${referralStats.totalEarnings.toFixed(2)}
                        </span>
                      </div>
                      
                      <p className={`text-xs text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('dashboard.totalEarnings', 'Total Earnings')}:
                      </p>
                      
                      {(referralStats.usageCount || 0) > 0 && (
                        <div className={`flex ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Users className={`w-6 h-6 text-tufts-blue ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          <span className="text-xl sm:text-2xl font-bold text-cool-black">
                            {Math.floor(referralStats.usageCount || 0)} {t('dashboard.uses', 'uses')}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <p className={`text-xs text-tufts-blue mt-3 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
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
