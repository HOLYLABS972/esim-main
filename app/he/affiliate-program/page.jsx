'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '../../src/contexts/I18nContext';

// Affiliate Components
import AffiliateHeader from '../../src/components/affiliate/AffiliateHeader';
import HowItWorks from '../../src/components/affiliate/HowItWorks';

const AffiliateProgramPage = () => {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <section className="bg-white py-8">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-6 pb-6">
                <AffiliateHeader onBack={() => router.back()} />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>
        </div>
      </section>

      {/* How It Works - Main content */}
      <HowItWorks />

      {/* Call to Action */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-eerie-black mb-4">
              {t('affiliate.cta', 'Ready to Start Earning?')}
            </h3>
            <p className="text-cool-black mb-8">
              {t('affiliate.ctaDesc', 'Contact us to learn more about our affiliate program')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:affiliate@roamjet.net?subject=Affiliate Program Inquiry"
                className="btn-primary px-8 py-3 text-white font-semibold rounded-full transition-all duration-200 inline-block text-center"
              >
                {t('affiliate.contactUs', 'Contact Us')}
              </a>
              <button
                onClick={() => router.push('/contact')}
                className="bg-white text-tufts-blue border-2 border-tufts-blue hover:bg-tufts-blue hover:text-white px-8 py-3 rounded-full font-semibold transition-all duration-200"
              >
                {t('affiliate.learnMore', 'Learn More')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing after content */}
      <div className="h-20"></div>
    </div>
  );
};

export default AffiliateProgramPage;
