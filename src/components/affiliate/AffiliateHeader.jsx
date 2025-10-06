import React from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

const AffiliateHeader = ({ onBack }) => {
  const { t } = useI18n();

  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={onBack}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <ArrowLeft className="w-5 h-5 text-cool-black" />
      </button>
      <div className="flex items-center space-x-3">
        <div className="bg-tufts-blue/10 p-2 rounded-lg">
          <TrendingUp className="w-6 h-6 text-tufts-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-medium tracking-tight text-eerie-black">{t('affiliate.title', 'Affiliate Program')}</h1>
          <p className="text-cool-black">{t('affiliate.subtitle', 'Earn money by referring friends')}</p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateHeader;
