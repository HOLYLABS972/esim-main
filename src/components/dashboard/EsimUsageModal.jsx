import React from 'react';

const EsimUsageModal = ({ esimUsage, onClose }) => {
  if (!esimUsage) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-px rounded-xl bg-white"></div>
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
          <div className="px-8 pt-8 pb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium text-eerie-black">eSIM Usage & Status</h3>
              <button
                onClick={onClose}
                className="text-cool-black hover:text-eerie-black transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
        
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Status Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <p className={`text-gray-900 font-semibold ${
                      esimUsage.status === 'active' || esimUsage.status === 'ACTIVE' ? 'text-green-600' :
                      esimUsage.status === 'expired' || esimUsage.status === 'EXPIRED' ? 'text-red-600' :
                      esimUsage.status === 'finished' || esimUsage.status === 'FINISHED' ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {esimUsage.status?.toUpperCase() || 'UNKNOWN'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">ICCID:</span>
                    <p className="text-gray-900 font-mono text-xs">{esimUsage.iccid || 'N/A'}</p>
                  </div>
                  {esimUsage.expiresAt && (
                    <div>
                      <span className="font-medium text-gray-600">Expires At:</span>
                      <p className="text-gray-900">{new Date(esimUsage.expiresAt).toLocaleString()}</p>
                    </div>
                  )}
                  {esimUsage.lastUpdated && (
                    <div>
                      <span className="font-medium text-gray-600">Last Updated:</span>
                      <p className="text-gray-900">{new Date(esimUsage.lastUpdated).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Usage */}
              <div className="bg-tufts-blue/10 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Data Usage</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Data:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {esimUsage.dataTotal || esimUsage.total || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Used:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {esimUsage.dataUsed || esimUsage.used || '0MB'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Remaining:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {esimUsage.dataRemaining || esimUsage.remaining || '0MB'}
                    </span>
                  </div>
                  {esimUsage.usagePercentage !== undefined && (
                    <>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-tufts-blue h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(esimUsage.usagePercentage || 0, 100)}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-center">
                        {esimUsage.usagePercentage || 0}% used
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Validity Period */}
              {(esimUsage.daysUsed !== undefined || esimUsage.daysRemaining !== undefined) && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Validity Period</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {esimUsage.daysUsed !== undefined && (
                      <div>
                        <span className="font-medium text-gray-600">Days Used:</span>
                        <p className="text-gray-900 font-semibold">{esimUsage.daysUsed} days</p>
                      </div>
                    )}
                    {esimUsage.daysRemaining !== undefined && (
                      <div>
                        <span className="font-medium text-gray-600">Days Remaining:</span>
                        <p className={`font-semibold ${
                          esimUsage.daysRemaining < 3 ? 'text-red-600' : 
                          esimUsage.daysRemaining < 7 ? 'text-orange-600' : 
                          'text-green-600'
                        }`}>
                          {esimUsage.daysRemaining} days
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Voice Usage */}
              {esimUsage.total_voice > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Voice Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Voice:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.total_voice} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Remaining Voice:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.remaining_voice} minutes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((esimUsage.total_voice - esimUsage.remaining_voice) / esimUsage.total_voice) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((esimUsage.total_voice - esimUsage.remaining_voice) / esimUsage.total_voice) * 100)}% used
                    </div>
                  </div>
                </div>
              )}

              {/* Text Usage */}
              {esimUsage.total_text > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Text Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Text:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.total_text} SMS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Remaining Text:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.remaining_text} SMS</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((esimUsage.total_text - esimUsage.remaining_text) / esimUsage.total_text) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((esimUsage.total_text - esimUsage.remaining_text) / esimUsage.total_text) * 100)}% used
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
      </div>
    </div>
  );
};

export default EsimUsageModal;
