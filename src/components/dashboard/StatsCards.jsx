import React from 'react';
import { Globe, QrCode } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';

const StatsCards = ({ orders, activeOrders }) => {
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
    <section className="bg-white py-8 stats-card" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </div>
    </section>
  );
};

export default StatsCards;
