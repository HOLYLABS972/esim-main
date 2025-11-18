import React from 'react';
import { Globe, QrCode } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';
import { usePathname } from 'next/navigation';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  // Handle special cases like PT-MA, multi-region codes, etc.
  if (countryCode.includes('-') || countryCode.length > 2) {
    return '🌍';
  }
  
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    console.warn('Invalid country code: ' + countryCode, error);
    return '🌍';
  }
};

const RecentOrders = ({ orders, loading, onViewQRCode }) => {
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
    <section className="bg-white recent-orders" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className="mb-6">
                <h2 className={`text-lg font-medium tracking-tight text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('dashboard.recentOrders', 'Recent Orders')}
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tufts-blue"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-cool-black/40 mx-auto mb-4" />
                  <p className="text-cool-black">{t('dashboard.noOrders', 'No orders yet')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    order && (
                      <div
                        key={order.id || order.orderId || Math.random()}
                        className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                          <div className="text-2xl">
                            {getFlagEmoji(order.countryCode)}
                          </div>
                          <div>
                            <p className={`font-medium text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`}>
                              {order.planName || t('dashboard.unknownPlan', 'Unknown Plan')}
                            </p>
                            <p className={`hidden md:block text-sm text-cool-black ${isRTL ? 'text-right' : 'text-left'}`}>
                              {t('dashboard.orderNumber', 'Order #{{number}}', { number: order.orderId || order.id || t('dashboard.unknown', 'Unknown') })}
                            </p>
                            <p className={`text-xs text-cool-black/60 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {order.countryName || order.countryCode || t('dashboard.unknownCountry', 'Unknown Country')}
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                          <div className={isRTL ? 'text-left' : 'text-right'}>
                            <p className="font-medium text-eerie-black">${Math.round(order.amount || 0)}</p>
                            <div className={`hidden md:flex items-center ${isRTL ? 'justify-start space-x-reverse space-x-2' : 'justify-end space-x-2'}`}>
                              <div className={`w-2 h-2 rounded-full ${
                                order.status === 'active' ? 'bg-green-500' :
                                order.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`}></div>
                              <p className="text-sm text-cool-black capitalize">
                                {t(`dashboard.status.${order.status}`, order.status || t('dashboard.unknown', 'unknown'))}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => onViewQRCode(order)}
                            className={`flex items-center px-3 py-2 bg-tufts-blue/10 text-tufts-blue rounded-lg hover:bg-tufts-blue/20 transition-colors duration-200 ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}
                          >
                            <QrCode className="w-4 h-4" />
                            <span className="text-sm">{t('dashboard.viewQR', 'View QR')}</span>
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
        </div>
      </div>
    </section>
  );
};

export default RecentOrders;
