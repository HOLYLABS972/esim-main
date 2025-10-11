'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';
import { usePathname } from 'next/navigation';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';

const EsimPlans = dynamic(() => import('../EsimPlans'), {
  loading: () => <div className="animate-pulse">Loading plans...</div>,
  ssr: false
});

export const handleCopyDiscountCode = async (t) => {
  const discountCode = 'OCTOBER35';
  try {
    await navigator.clipboard.writeText(discountCode);
    toast.success(t('discount.copied', 'Discount code OCTOBER35 copied! 35% off your purchase!'), {
      duration: 4000,
      icon: '🎉',
    });
  } catch (err) {
    toast.error(t('discount.copyFailed', 'Failed to copy code. Please try again.'));
  }
};

export default function PlansSection() {
  const { t, locale, isLoading } = useI18n();
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
  
  if (isLoading) {
    return (
      <section className="py-12 lg:py-16 bg-white relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 relative z-10">
          <div className="animate-pulse space-y-8">
            <div className="text-center">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            </div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </section>
    );
  }
  
  // Reduce top padding for Hebrew and Arabic since Features section is hidden
  const topPadding = (locale === 'he' || locale === 'ar') ? 'pt-8' : 'py-12 lg:py-16';
  
  return (
    <section id="esim-plans" className={`${topPadding} pb-12 lg:pb-16 scroll-mt-20 bg-white relative overflow-hidden`} dir={isRTL ? 'rtl' : 'ltr'}>                                                                                                          
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <div className="text-center mb-8 lg:mb-16 max-w-4xl mx-auto">
        <h2 className="text-center text-lg lg:text-xl font-semibold text-tufts-blue"> <span>{'{ '}</span>
          {t('plans.title')}
          <span>{' }'}</span>
         </h2>
         <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
        <button
                onClick={() => handleCopyDiscountCode(t)}
                className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2"
              ><Copy className="w-5 h-5 mr-2" />
                {t('discount.get35Off', '35% OFF')}
              </button>
        </div>
         <p className="mx-auto mt-12 max-w-4xl text-center text-2xl lg:text-3xl font-semibold tracking-tight text-eerie-black sm:text-5xl">                                                                                        
            {t('plans.subtitle')}
          </p>
          <p className={`text-eerie-black max-w-3xl mx-auto mt-4 items-center text-center text-sm lg:text-base ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('plans.description')}
          </p>
        </div>

        {/* Plans Component */}
        <div>
          <Suspense fallback={
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 mx-auto" style={{ borderColor: '#9039FF' }}></div>                                                                                         
              <p className={`mt-4 text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`} style={{
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
