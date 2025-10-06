import React from 'react';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';

const AffiliateHeader = ({ onBack }) => {
  const { t } = useI18n();

  return (
    <div className="bg-gradient-to-r from-tufts-blue to-cobalt-blue shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('affiliate.title', 'Affiliate Program')}</h1>
              <p className="text-blue-100">{t('affiliate.subtitle', 'Earn money by referring friends')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateHeader;
