'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '../../contexts/I18nContext';

const EsimPlans = dynamic(() => import('../EsimPlans'), {
  loading: () => <div className="animate-pulse">Loading plans...</div>,
  ssr: false
});

export default function PlansSection() {
  const { t } = useI18n();
  
  return (
    <section id="esim-plans" className="py-16 scroll-mt-20 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
        <h2 className="text-center text-xl font-semibold text-tufts-blue"> <span>{'{ '}</span>
          {t('plans.title')}
          <span>{' }'}</span>
         </h2>
         <p className="mx-auto mt-12 max-w-4xl text-center text-4xl font-semibold tracking-tight text-eerie-black sm:text-5xl ">
            {t('plans.subtitle')}
          </p>
          <p className="text-eerie-black max-w-3xl mx-auto mt-4">
            {t('plans.description')}
          </p>
        </div>

        {/* Plans Component */}
        <div>
          <Suspense fallback={
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 mx-auto" style={{ borderColor: '#9039FF' }}></div>
              <p className="mt-4 text-eerie-black" style={{
                fontSize: '16px',
                fontWeight: '400',
                lineHeight: '160%',
                letterSpacing: '0px'
              }}>{t('plans.loadingPlans')}</p>
            </div>
          }>
            <EsimPlans />
          </Suspense>
          {/* Bottom Gradient Blob */}
        <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div 
            style={{ 
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              background: 'linear-gradient(to top right, #1A5798, #93BFEE)'
            }} 
            className="relative right-[calc(50%-36rem)] aspect-[1155/678] w-[12.125rem] translate-x-1/2 opacity-30 sm:right-[calc(50%+36rem)] sm:w-[72.1875rem]"
          ></div>
        </div>
        </div>
      </div>
    </section>
  );
}
