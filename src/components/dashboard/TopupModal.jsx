import React, { useState, useEffect } from 'react';
import { Battery, X, Loader2 } from 'lucide-react';
import { apiService } from '../../services/apiService';
import toast from 'react-hot-toast';

const TopupModal = ({ 
  show, 
  selectedOrder, 
  onClose, 
  onTopup,
  loadingTopup,
}) => {
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    if (show && selectedOrder) {
      fetchTopupPackages();
    }
  }, [show, selectedOrder]);

  const fetchTopupPackages = async () => {
    try {
      setLoadingPackages(true);
      // Fetch packages - you can filter for topup packages or use all packages
      // For now, we'll fetch all packages and let user select
      const result = await apiService.healthCheck(); // Placeholder
      
      // In a real implementation, you'd fetch topup-specific packages
      // For now, we'll show some example packages
      setAvailablePackages([
        { id: 'topup-1gb', name: '1GB Topup', data: '1GB', price: 4.50, validity: '7 days' },
        { id: 'topup-3gb', name: '3GB Topup', data: '3GB', price: 12.00, validity: '30 days' },
        { id: 'topup-5gb', name: '5GB Topup', data: '5GB', price: 18.00, validity: '30 days' },
        { id: 'topup-10gb', name: '10GB Topup', data: '10GB', price: 32.00, validity: '30 days' },
      ]);
    } catch (error) {
      console.error('❌ Error fetching topup packages:', error);
      toast.error('Failed to load topup packages');
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleTopup = () => {
    if (!selectedPackage) {
      toast.error('Please select a topup package');
      return;
    }
    
    if (onTopup) {
      onTopup(selectedPackage.id);
    }
  };

  if (!show || !selectedOrder) return null;

  const iccid = selectedOrder.qrCode?.iccid || selectedOrder.iccid;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-px rounded-xl bg-white"></div>
        <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
          <div className="px-8 pt-8 pb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Battery className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-medium text-eerie-black">Add Data (Topup)</h3>
              </div>
              <button
                onClick={onClose}
                className="text-cool-black hover:text-eerie-black transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Order Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-1">eSIM Order</p>
              <p className="font-semibold text-gray-900">{selectedOrder.planName || 'Unknown Plan'}</p>
              {iccid && (
                <>
                  <p className="text-xs text-gray-500 mt-2">ICCID</p>
                  <p className="font-mono text-xs text-gray-700">{iccid}</p>
                </>
              )}
            </div>

            {/* Package Selection */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Select Topup Package</h4>
              
              {loadingPackages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading packages...</span>
                </div>
              ) : availablePackages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No topup packages available at the moment.</p>
                  <p className="text-sm mt-2">Please try again later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availablePackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{pkg.name}</h5>
                          {selectedPackage?.id === pkg.id && (
                            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">Data: {pkg.data}</p>
                        <p className="text-sm text-gray-600 mb-2">Validity: {pkg.validity}</p>
                        <p className="text-lg font-bold text-gray-900">${pkg.price.toFixed(2)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleTopup}
                disabled={!selectedPackage || loadingTopup}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loadingTopup ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Battery className="w-5 h-5 mr-2" />
                    Add Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
      </div>
    </div>
  );
};

export default TopupModal;

