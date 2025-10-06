import React from 'react';
import { User, Gift } from 'lucide-react';

const DashboardHeader = ({ currentUser, userProfile, onShowReferralSheet }) => {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-tufts-blue/10 p-3 rounded-full">
                    <User className="w-8 h-8 text-tufts-blue" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-medium tracking-tight text-eerie-black">
                      Welcome back, {currentUser.displayName || currentUser.email}!
                    </h1>
                    <p className="text-cool-black mt-2">
                      Manage your eSIM orders and account settings
                    </p>
                  </div>
                </div>
                {!userProfile?.referralCodeUsed && (
                  <button
                    onClick={onShowReferralSheet}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Gift className="w-4 h-4" />
                    <span>Apply Referral</span>
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
