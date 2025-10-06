import React from 'react';
import { Globe, QrCode, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

const StatsCards = ({ orders, activeOrders, referralStats }) => {
  const router = useRouter();

  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Orders Card */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-cool-black">Total Orders</p>
                    <p className="text-2xl font-bold text-eerie-black mt-2 flex items-center">
                      <Globe className="w-6 h-6 text-tufts-blue mr-2" />
                      {orders.length}
                    </p>
                   
                  </div>
                 
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Active eSIMs Card */}
          <div className="relative">
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-cool-black">Active eSIMs</p>
                    <p className="text-2xl font-bold text-cool-black mt-2 flex items-center">
                      <QrCode className="w-6 h-6 text-tufts-blue mr-2" />
                      {activeOrders.length}
                    </p>
                  </div>
                 
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </div>

          {/* Performance Card */}
          <div 
            className="relative cursor-pointer group"
            onClick={() => router.push('/affiliate-program')}
          >
            <div className="absolute inset-px rounded-xl bg-white group-hover:bg-gray-50 transition-colors"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-medium text-cool-black">Your Performance</p>
                   
                    <div className="flex items-center space-x-4 mt-2">
                     
                      
                        <div className="flex items-center">
                          <Wallet className="w-6 h-6 text-tufts-blue mr-2" />
                          <p className="text-2xl font-bold text-cool-black">${referralStats.totalEarnings.toFixed(2)}</p>
                        </div>
                        <p className="text-xs text-cool-black">Total Earnings</p>
                      {(referralStats.usageCount || 0) > 0 && (
                        <div className="border-l border-gray-200 pl-4">
                          <p className="text-2xl font-bold text-cool-black">{Math.floor(referralStats.usageCount || 0)}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-tufts-blue mt-2 font-medium">Tap to join affiliate program →</p>
                  </div>
                  
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5 group-hover:ring-gray-300 transition-colors"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsCards;
