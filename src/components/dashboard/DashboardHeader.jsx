import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';
import { getLanguageDirection, detectLanguageFromPath } from '../../utils/languageUtils';
import { usePathname } from 'next/navigation';

const DashboardHeader = ({ currentUser }) => {
  const { t, locale } = useI18n();
  const { logout } = useAuth();
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
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
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
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 rounded-lg transition-colors duration-200 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('dashboard.logout', 'Logout')}</span>
                </button>
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
