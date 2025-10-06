import React from 'react';
import { useI18n } from '../../contexts/I18nContext';

const HowItWorks = () => {
  const { t } = useI18n();

  const steps = [
    {
      number: 1,
      title: t('affiliate.step1Title', 'Share Your Code'),
      description: t('affiliate.step1Desc', 'Copy and share your unique referral code with friends and family'),
      bgColor: 'from-tufts-blue/10 to-tufts-blue/20',
      textColor: 'text-tufts-blue'
    },
    {
      number: 2,
      title: t('affiliate.step2Title', 'Friend Signs Up'),
      description: t('affiliate.step2Desc', 'Your friend uses your code when creating their RoamJet account'),
      bgColor: 'from-tufts-blue/10 to-tufts-blue/20',
      textColor: 'text-tufts-blue'
    },
    {
      number: 3,
      title: t('affiliate.step3Title', 'Earn $1'),
      description: t('affiliate.step3Desc', 'You instantly earn $1 for each successful referral - no limits!'),
      bgColor: 'from-tufts-blue/10 to-tufts-blue/20',
      textColor: 'text-tufts-blue'
    }
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className="text-left mb-8">
                <h3 className="text-lg font-medium tracking-tight text-eerie-black mb-2">{t('affiliate.howItWorks', 'How It Works')}</h3>
                <p className="text-cool-black text-sm">{t('affiliate.howItWorksDesc', 'Simple steps to start earning with referrals')}</p>
              </div>
                
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Steps Section */}
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.number} className="flex items-start space-x-4">
                      <div className={`bg-gradient-to-br ${step.bgColor} p-3 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0`}>
                        <div className={`w-3 h-3 rounded-full ${step.textColor === 'text-blue-700' ? 'bg-blue-700' : step.textColor === 'text-green-700' ? 'bg-green-700' : 'bg-purple-700'}`}></div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-eerie-black mb-2 text-base">{step.title}</h4>
                        <p className="text-cool-black text-sm">{step.description}</p>
                        
                        {/* Vertical dashed line connector - only show between steps, not after the last one */}
                        {index < steps.length - 1 && (
                          <div className="ml-6 mt-4 mb-2">
                            <div className="border-l-2 border-dashed border-gray-300 h-8"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Image Section - Desktop Only */}
                <div className="hidden lg:flex items-center justify-center">
                  <div className="bg-gradient-to-br from-tufts-blue/10 to-cobalt-blue/10 rounded-2xl p-8 w-full h-full min-h-[400px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-tufts-blue to-cobalt-blue p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h4 className="text-xl font-medium text-eerie-black mb-3">Start Earning Today</h4>
                      <p className="text-cool-black text-sm">Join thousands of users earning passive income through our affiliate program</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
