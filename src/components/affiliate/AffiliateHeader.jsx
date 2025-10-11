import React from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

const AffiliateHeader = ({ onBack }) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center space-x-3 sm:space-x-4">
      <button
        onClick={onBack}
        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-cool-black" />
      </button>
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <div className="bg-tufts-blue/10 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-tufts-blue" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-medium tracking-tight text-eerie-black truncate">{t('affiliate.title', 'Affiliate Program')}</h1>
          <p className="text-sm sm:text-base text-cool-black truncate">{t('affiliate.subtitle', 'Earn money by referring friends')}</p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateHeader;
