import React from 'react';
import { Globe, QrCode } from 'lucide-react';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  // Handle special cases like PT-MA, multi-region codes, etc.
  if (countryCode.includes('-') || countryCode.length > 2) {
    return '🌍';
  }
  
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    console.warn('Invalid country code: ' + countryCode, error);
    return '🌍';
  }
};

const RecentOrders = ({ orders, loading, onViewQRCode }) => {
  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="relative">
          <div className="absolute inset-px rounded-xl bg-white"></div>
          <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
            <div className="px-8 pt-8 pb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-medium tracking-tight text-eerie-black">Recent Orders</h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tufts-blue"></div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-cool-black/40 mx-auto mb-4" />
                  <p className="text-cool-black">No orders yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    order && (
                      <div
                        key={order.id || order.orderId || Math.random()}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getFlagEmoji(order.countryCode)}
                          </div>
                          <div>
                            <p className="font-medium text-eerie-black">{order.planName || 'Unknown Plan'}</p>
                            <p className="text-sm text-cool-black">Order #{order.orderId || order.id || 'Unknown'}</p>
                            <p className="text-xs text-cool-black/60">
                              {order.countryName || order.countryCode || 'Unknown Country'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-medium text-eerie-black">${Math.round(order.amount || 0)}</p>
                            <div className="flex items-center justify-end space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                order.status === 'active' ? 'bg-green-500' :
                                order.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                              }`}></div>
                              <p className="text-sm text-cool-black capitalize">{order.status || 'unknown'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => onViewQRCode(order)}
                            className="flex items-center space-x-2 px-3 py-2 bg-tufts-blue/10 text-tufts-blue rounded-lg hover:bg-tufts-blue/20 transition-colors duration-200"
                          >
                            <QrCode className="w-4 h-4" />
                            <span className="text-sm">View QR</span>
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
        </div>
      </div>
    </section>
  );
};

export default RecentOrders;
