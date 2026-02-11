import React from 'react';
import { Globe, QrCode } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

const StatsCards = ({ orders, activeOrders }) => {
  const { t } = useI18n();

  return (
    <section className="bg-white pb-2">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Total Orders */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 text-tufts-blue" />
              <span className="text-xs text-gray-500 font-medium">
                {t('dashboard.totalOrders', 'Total Orders')}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>

          {/* Active eSIMs */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-4 h-4 text-tufts-blue" />
              <span className="text-xs text-gray-500 font-medium">
                {t('dashboard.activeEsims', 'Active eSIMs')}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{activeOrders.length}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsCards;
