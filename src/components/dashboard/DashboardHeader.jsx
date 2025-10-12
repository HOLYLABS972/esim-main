import React from 'react';
import { User, Gift } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';
import { usePathname } from 'next/navigation';

const DashboardHeader = ({ currentUser, userProfile, onShowReferralSheet }) => {
  const { t, locale } = useI18n();
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
  return (
    <section className="bg-white" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
                  <div className="bg-tufts-blue/10 p-3 rounded-full">
                    <User className="w-8 h-8 text-tufts-blue" />
                  </div>
                  <div>
                    <h1 className={`text-3xl font-medium tracking-tight text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.welcomeBack', 'Welcome back, {{name}}!', { name: currentUser.displayName || currentUser.email })}
                    </h1>
                    <p className={`text-cool-black mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.manageOrders', 'Manage your eSIM orders and account settings')}
                    </p>
                  </div>
                </div>
                {!userProfile?.referralCodeUsed && (
                  <button
                    onClick={onShowReferralSheet}
                    className={`btn-primary flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>{t('dashboard.applyReferral', 'Apply Referral')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;
