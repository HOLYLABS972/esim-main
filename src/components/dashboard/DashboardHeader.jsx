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
    <section className="bg-white py-2 lg:py-4 mt-10 lg:mt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 py-2 lg:py-4">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-4 pt-6 pb-6 sm:px-6 md:px-8 md:pt-8 md:pb-8">
              <div
                className={
                  `flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between ` +
                  (isRTL ? 'md:flex-row-reverse' : '')
                }
              >
                <div
                  className={
                    `flex items-center gap-4 ` +
                    (isRTL ? 'flex-row-reverse' : '')
                  }
                >
                  <div className="bg-tufts-blue/10 p-2.5 md:p-3 rounded-full">
                    <User className="w-8 h-8 text-tufts-blue" />
                  </div>
                  <div>
                    <h1 className={`text-2xl sm:text-3xl font-medium tracking-tight text-eerie-black ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.welcomeBack', 'Welcome back, {{name}}!', { name: currentUser.displayName || currentUser.email })}
                    </h1>
                    <p className={`text-cool-black mt-2 text-sm sm:text-base ${isRTL ? 'text-right' : 'text-left'}`}>
                      {t('dashboard.manageOrders', 'Manage your eSIM orders and account settings')}
                    </p>
                  </div>
                </div>
                <div className={`flex items-center gap-4 ${isRTL ? 'space-x-reverse ' : ''}`}>
                {!userProfile?.referralCodeUsed && (
                  <button
                    onClick={onShowReferralSheet}
                    className={`btn-primary flex items-center`}
                  >
                    <Gift className="w-4 h-4 mx-2" />
                    <span>{t('dashboard.applyReferral', 'Apply Referral')}</span>
                  </button>
                )}
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

export default DashboardHeader;
