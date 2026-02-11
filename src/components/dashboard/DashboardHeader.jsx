import React from 'react';
import { User, LogOut } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';

const DashboardHeader = ({ currentUser }) => {
  const { t } = useI18n();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try { await logout(); } catch (e) { console.error('Logout error:', e); }
  };

  const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';

  return (
    <section className="bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-tufts-blue/10 p-2.5 rounded-full flex-shrink-0">
              <User className="w-6 h-6 text-tufts-blue" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">
                {t('dashboard.welcomeBack', 'Welcome back, {{name}}!', { name: displayName })}
              </h1>
              <p className="text-sm text-gray-500 hidden sm:block">
                {t('dashboard.manageOrders', 'Manage your eSIM orders and account settings')}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex-shrink-0 p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors"
            title={t('dashboard.logout', 'Logout')}
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;
