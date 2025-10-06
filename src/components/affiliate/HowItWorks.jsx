import React from 'react';
import { useI18n } from '../../contexts/I18nContext';

const HowItWorks = () => {
  const { t } = useI18n();

  const steps = [
    {
      number: 1,
      title: t('affiliate.step1Title', 'Share Your Code'),
      description: t('affiliate.step1Desc', 'Copy and share your unique referral code with friends and family'),
      bgColor: 'from-blue-100 to-blue-200',
      textColor: 'text-blue-700'
    },
    {
      number: 2,
      title: t('affiliate.step2Title', 'Friend Signs Up'),
      description: t('affiliate.step2Desc', 'Your friend uses your code when creating their RoamJet account'),
      bgColor: 'from-green-100 to-green-200',
      textColor: 'text-green-700'
    },
    {
      number: 3,
      title: t('affiliate.step3Title', 'Earn $1'),
      description: t('affiliate.step3Desc', 'You instantly earn $1 for each successful referral - no limits!'),
      bgColor: 'from-purple-100 to-purple-200',
      textColor: 'text-purple-700'
    }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('affiliate.howItWorks', 'How It Works')}</h3>
        <p className="text-gray-600">{t('affiliate.howItWorksDesc', 'Simple steps to start earning with referrals')}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.number} className="text-center">
            <div className={`bg-gradient-to-br ${step.bgColor} p-6 rounded-2xl w-20 h-20 mx-auto mb-6 flex items-center justify-center shadow-lg`}>
              <span className={`text-2xl font-bold ${step.textColor}`}>{step.number}</span>
            </div>
            <h4 className="font-bold text-gray-900 mb-3 text-lg">{step.title}</h4>
            <p className="text-gray-600">{step.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HowItWorks;
