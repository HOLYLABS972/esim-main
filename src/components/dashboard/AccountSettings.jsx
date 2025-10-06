import React from 'react';
import { Settings } from 'lucide-react';

const AccountSettings = ({ currentUser, userProfile, onLoadUserProfile }) => {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className="flex items-center space-x-3 mb-6">
                <Settings className="w-6 h-6 text-tufts-blue" />
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black">Account Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cool-black">Email</label>
                    <p className="mt-1 text-eerie-black">{currentUser.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cool-black">Name</label>
                    <p className="mt-1 text-eerie-black">{currentUser.displayName || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-cool-black">Account Created</label>
                    <p className="mt-1 text-eerie-black">
                      {userProfile?.createdAt ? 
                        (userProfile.createdAt.toDate ? 
                          new Date(userProfile.createdAt.toDate()).toLocaleDateString() :
                          new Date(userProfile.createdAt).toLocaleDateString()
                        ) : 
                        'Unknown'
                      }
                    </p>
                    {!userProfile?.createdAt && (
                      <button 
                        onClick={async () => {
                          console.log('Manual refresh triggered');
                          await onLoadUserProfile();
                        }}
                        className="mt-2 text-sm text-tufts-blue hover:text-cobalt-blue underline transition-colors"
                      >
                        Refresh Profile
                      </button>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-cool-black">Role</label>
                    <p className="mt-1 text-eerie-black capitalize">{userProfile?.role || 'customer'}</p>
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

export default AccountSettings;
