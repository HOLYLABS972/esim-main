import React, { useState, useEffect } from 'react';
import { Battery, X, Loader2, CreditCard, Coins } from 'lucide-react';
import { apiService } from '../../services/apiService';
import { paymentService } from '../../services/paymentService';
import { coinbaseService } from '../../services/coinbaseService';
import toast from 'react-hot-toast';

const TopupModal = ({ 
  show, 
  selectedOrder, 
  onClose, 
  onTopup,
  loadingTopup,
  customerEmail,
}) => {
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [acceptedRefund, setAcceptedRefund] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [coinbaseAvailable, setCoinbaseAvailable] = useState(false);

  useEffect(() => {
    if (show && selectedOrder) {
      fetchTopupPackages();
      checkCoinbaseAvailability();
    }
  }, [show, selectedOrder]);

  const checkCoinbaseAvailability = async () => {
    try {
      const available = await coinbaseService.initialize();
      console.log('🔍 Coinbase availability check:', available);
      setCoinbaseAvailable(available);
      
      if (!available) {
        console.log('⚠️ Coinbase credentials not found. Please configure in Firestore config/coinbase or environment variables.');
      }
    } catch (err) {
      console.error('❌ Error checking Coinbase availability:', err);
      setCoinbaseAvailable(true); // Still show button even if check fails
    }
  };

  const fetchTopupPackages = async () => {
    try {
      setLoadingPackages(true);
      
      // Fetch real topup packages from Firebase
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const { db } = await import('../../firebase/config');
      
      const topupQuery = query(
        collection(db, 'dataplans'),
        where('status', '==', 'active'),
        where('is_topup', '==', true)
      );
      
      const snapshot = await getDocs(topupQuery);
      const packages = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.enabled !== false) {
          packages.push({
            id: data.slug || doc.id, // Use slug as the package ID for Airalo API
            name: data.name || data.title,
            data: data.data || data.data_amount || 'N/A',
            price: data.price || 0,
            validity: data.validity || data.days || 'N/A'
          });
        }
      });
      
      // Sort by price
      packages.sort((a, b) => a.price - b.price);
      
      console.log('📦 Loaded topup packages:', packages);
      
      if (packages.length === 0) {
        console.warn('⚠️ No topup packages found. Using fallback packages.');
        // Fallback to example packages if none found
        setAvailablePackages([
          { id: 'global-1gb-7days', name: '1GB Topup', data: '1GB', price: 4.50, validity: '7 days' },
          { id: 'global-3gb-30days', name: '3GB Topup', data: '3GB', price: 12.00, validity: '30 days' },
          { id: 'global-5gb-30days', name: '5GB Topup', data: '5GB', price: 18.00, validity: '30 days' },
          { id: 'global-10gb-30days', name: '10GB Topup', data: '10GB', price: 32.00, validity: '30 days' },
        ]);
      } else {
        setAvailablePackages(packages);
      }
    } catch (error) {
      console.error('❌ Error fetching topup packages:', error);
      toast.error('Failed to load topup packages');
      // Set fallback packages on error
      setAvailablePackages([
        { id: 'global-1gb-7days', name: '1GB Topup', data: '1GB', price: 4.50, validity: '7 days' },
        { id: 'global-3gb-30days', name: '3GB Topup', data: '3GB', price: 12.00, validity: '30 days' },
        { id: 'global-5gb-30days', name: '5GB Topup', data: '5GB', price: 18.00, validity: '30 days' },
        { id: 'global-10gb-30days', name: '10GB Topup', data: '10GB', price: 32.00, validity: '30 days' },
      ]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleTopup = async (paymentMethod = 'stripe') => {
    if (!acceptedRefund) {
      toast.error('Please accept the refund policy to continue');
      return;
    }

    if (!selectedPackage) {
      toast.error('Please select a topup package');
      return;
    }

    if (!selectedOrder?.iccid) {
      toast.error('No ICCID found. Cannot create topup.');
      return;
    }

    try {
      setIsProcessingPayment(true);
      setSelectedPaymentMethod(paymentMethod);
      
      // Generate unique topup order ID
      const topupOrderId = `topup-${selectedOrder.iccid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order data for payment
      const orderData = {
        orderId: topupOrderId,
        planId: selectedPackage.id,
        planName: selectedPackage.name,
        customerEmail: customerEmail || selectedOrder.customerEmail || 'customer@example.com',
        amount: selectedPackage.price,
        currency: 'usd',
        type: 'topup', // Mark as topup
        iccid: selectedOrder.iccid,
        packageId: selectedPackage.id
      };

      console.log('💳 Topup order data for payment:', orderData);

      // Store topup info in localStorage for after payment
      localStorage.setItem('pendingTopupOrder', JSON.stringify({
        orderId: topupOrderId,
        iccid: selectedOrder.iccid,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        amount: selectedPackage.price,
        customerEmail: orderData.customerEmail,
        type: 'topup',
        paymentMethod: paymentMethod
      }));

      // Redirect to payment based on selected method
      if (paymentMethod === 'coinbase') {
        await coinbaseService.createCheckoutSession(orderData);
      } else {
        await paymentService.createCheckoutSession(orderData);
      }
      
    } catch (error) {
      console.error('❌ Payment redirect failed:', error);
      toast.error(error.message || 'Failed to start payment process');
      setIsProcessingPayment(false);
      setSelectedPaymentMethod(null);
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

            {/* Terms Checkbox */}
            {selectedPackage && (
              <div className="mb-6">
                <label htmlFor="acceptRefundTopup" className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                  <input
                    id="acceptRefundTopup"
                    type="checkbox"
                    checked={acceptedRefund}
                    onChange={(e) => setAcceptedRefund(e.target.checked)}
                    className={`mt-1 h-4 w-4 rounded border-gray-300 focus:ring-blue-500 ${
                      acceptedRefund ? 'text-blue-600' : ''
                    }`}
                  />
                  <span>
                    I accept the <a href="https://esim.roamjet.net/refund-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Refund Policy</a>
                  </span>
                </label>
              </div>
            )}

            {/* Payment Method Buttons */}
            {selectedPackage && (
              <div className="space-y-3 mb-6">
                {/* Stripe Payment Button */}
                <button
                  onClick={() => handleTopup('stripe')}
                  disabled={!acceptedRefund || isProcessingPayment}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg text-white ${
                    selectedPaymentMethod === 'stripe' 
                      ? 'bg-blue-700 ring-2 ring-blue-300' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } ${!acceptedRefund || isProcessingPayment ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessingPayment && selectedPaymentMethod === 'stripe' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                  <span>
                    Pay ${selectedPackage.price.toFixed(2)} - Credit/Debit Card
                  </span>
                </button>

                {/* Coinbase Payment Button */}
                <button
                  onClick={() => handleTopup('coinbase')}
                  disabled={!acceptedRefund || isProcessingPayment || !coinbaseAvailable}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg text-white ${
                    selectedPaymentMethod === 'coinbase' 
                      ? 'bg-gray-900 ring-2 ring-gray-400' 
                      : 'bg-black hover:bg-gray-900'
                  } ${!acceptedRefund || isProcessingPayment || !coinbaseAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isProcessingPayment && selectedPaymentMethod === 'coinbase' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Coins className="w-6 h-6" />
                  )}
                  <span>
                    Pay ${selectedPackage.price.toFixed(2)} - Cryptocurrency
                  </span>
                </button>
              </div>
            )}

            {/* Cancel Button */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
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

