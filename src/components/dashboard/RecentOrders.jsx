import React from 'react';
import { Globe, QrCode, ChevronRight } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { getOrderFlag, getOrderCountryName } from '../../utils/countryFlags';

const RecentOrders = ({ orders, loading, onViewQRCode }) => {
  const { t } = useI18n();

  return (
    <section className="bg-white py-4">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          {t('dashboard.recentOrders', 'My eSIMs')}
        </h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tufts-blue"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t('dashboard.noOrders', 'No eSIMs yet')}</p>
            <p className="text-gray-400 text-xs mt-1">Your purchased eSIMs will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              if (!order) return null;
              const countryName = order.countryName || getOrderCountryName(order) || order.countryCode || '';
              const statusColor = order.status === 'active' ? 'bg-green-500' :
                                  order.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-400';

              return (
                <button
                  key={order.id || order.orderId || Math.random()}
                  onClick={() => onViewQRCode(order)}
                  className="w-full flex items-center gap-3 p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors active:scale-[0.98] text-left"
                >
                  {/* Flag */}
                  <div className="text-2xl flex-shrink-0 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm">
                    {order.flagEmoji || getOrderFlag(order)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {order.planName || t('dashboard.unknownPlan', 'Unknown Plan')}
                      </p>
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor}`}></div>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {countryName}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default RecentOrders;
