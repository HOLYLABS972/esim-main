'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Globe, 
  Wifi, 
  Clock, 
  Shield, 
  Zap,
  Smartphone,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../../src/contexts/AuthContext';
import toast from 'react-hot-toast';

const SharePackagePage = () => {
  const params = useParams();
  const router = useRouter();
  const { currentUser } = useAuth();
  const packageId = params.packageId;
  
  // Get country info from URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const urlCountryCode = searchParams.get('country');
  const urlCountryFlag = searchParams.get('flag');
  
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadFromAiraloAPI = useCallback(async () => {
    try {
      const response = await fetch(`/api/airalo/plans`);
      const data = await response.json();
      
      if (data.success && data.plans) {
        const packageData = data.plans.find(pkg => pkg.slug === packageId || pkg.id === packageId);
        if (packageData) {
          console.log('📦 Airalo package data:', packageData);
          const transformedData = {
            id: packageData.slug || packageData.id,
            name: packageData.name,
            description: packageData.description,
            price: packageData.price,
            currency: packageData.currency || 'USD',
            data: packageData.capacity || packageData.data,
            dataUnit: packageData.data_unit || 'GB',
            period: packageData.period || packageData.validity,
            duration: packageData.period || packageData.validity,
            country_code: packageData.country_codes?.[0] || packageData.country_code,
            benefits: packageData.features || [],
            speed: packageData.speed,
            region_slug: packageData.region_slug
          };
          console.log('🔄 Transformed package data:', transformedData);
          setPackageData(transformedData);
        }
      }
    } catch (error) {
      console.error('Error loading from Airalo API:', error);
    }
  }, [packageId]);

  const loadPackageData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Try to load from Firebase plans collection
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../../src/firebase/config');
      
      const packageRef = doc(db, 'plans', packageId);
      const packageSnap = await getDoc(packageRef);
      
      if (packageSnap.exists()) {
        const data = packageSnap.data();
        console.log('📦 Firebase package data:', data);
        setPackageData({
          id: packageSnap.id,
          ...data
        });
      } else {
        // If not found in Firebase, try to load from Airalo API
        await loadFromAiraloAPI();
      }
    } catch (error) {
      console.error('Error loading package data:', error);
      toast.error('Failed to load package information');
    } finally {
      setLoading(false);
    }
  }, [packageId, loadFromAiraloAPI]);

  useEffect(() => {
    if (packageId) {
      loadPackageData();
    }
  }, [packageId, loadPackageData]);

  const handlePurchase = async () => {
    if (!currentUser) {
      toast.error('Please log in to purchase this package');
      router.push('/login');
      return;
    }
    
    if (!packageData) {
      toast.error('Package data not loaded yet');
      return;
    }
    
    // Store package data in localStorage for the checkout process
    const checkoutData = {
      packageId: packageId,
      packageName: packageData.name,
      packageDescription: packageData.description,
      price: parseFloat(packageData.price), // Ensure price is a number
      currency: packageData.currency || 'USD',
      data: packageData.data,
      dataUnit: packageData.dataUnit || 'GB',
      period: packageData.period || packageData.duration,
      country_code: packageData.country_code,
      benefits: packageData.benefits || [],
      speed: packageData.speed
    };
    
    console.log('💾 Storing checkout data:', checkoutData);
    
    localStorage.setItem('selectedPackage', JSON.stringify(checkoutData));
    
    // Call payment service directly instead of going to checkout page
    const { paymentService } = await import('../../../src/services/paymentService');
    
    try {
      // Create order data for payment service
      const orderData = {
        planId: packageId,
        planName: packageData.name,
        customerEmail: currentUser.email,
        amount: parseFloat(packageData.price),
        currency: 'usd'
      };
      
      console.log('💳 Order data for payment:', orderData);
      
      // Redirect to payment directly
      await paymentService.createCheckoutSession(orderData);
      
    } catch (error) {
      console.error('❌ Payment failed:', error);
      toast.error('Failed to process payment');
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const formatData = (data, unit = 'GB') => {
    if (data === 'Unlimited' || data === -1) {
      return 'Unlimited';
    }
    return `${data} ${unit}`;
  };

  const getCountryFlag = (countryCode) => {
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
      console.warn(`Invalid country code: ${countryCode}`, error);
      return '🌍';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading package information...</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe size={24} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Package Not Found</h3>
          <p className="text-gray-600 mb-4">
            The package you&apos;re looking for doesn&apos;t exist or has been removed
          </p>
          <button
            onClick={() => router.push('/esim-plans')}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Browse Available Packages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Package Details</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-lg overflow-hidden"
        >
          {/* Package Title */}
          <div className="bg-white p-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <span className="text-4xl">
                  {urlCountryFlag || (packageData.country_code ? getCountryFlag(packageData.country_code) : '🌍')}
                </span>
                <h2 className="text-4xl font-bold text-black">{packageData.name}</h2>
              </div>
              <p className="text-gray-600 text-lg mt-2">{packageData.description || 'Travel Package'}</p>
              {(urlCountryCode || packageData.country_code) && (
                <div className="flex items-center justify-center space-x-2 mt-3">
                  <span className="text-sm text-gray-500">Country:</span>
                  <span className="text-sm font-medium text-gray-700">
                    {urlCountryCode || packageData.country_code}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Package Stats */}
          <div className="bg-white px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Data</div>
                    <div className="font-semibold text-black">{formatData(packageData.data, packageData.dataUnit)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Validity</div>
                    <div className="font-semibold text-black">{packageData.period || packageData.duration || 'N/A'} days</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Price</div>
                    <div className="font-semibold text-green-600">{formatPrice(packageData.price, packageData.currency)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <div>
                    <div className="text-sm text-gray-600">Type</div>
                    <div className="font-semibold text-black">eSIM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Package Actions */}
          <div className="p-6">
            <div className="max-w-2xl mx-auto">
              {/* Get Package Section */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">Get This Package</h3>
                <button
                  onClick={handlePurchase}
                  className="w-full max-w-md mx-auto flex items-center justify-center space-x-3 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl transition-colors font-medium text-lg shadow-lg"
                >
                  <Smartphone className="w-6 h-6" />
                  <span>Purchase Now</span>
                </button>
              </div>

              {/* How to Use Section */}
              <div className="text-center">
                <h3 className="text-2xl font-semibold text-gray-900 mb-6">How to Use</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="bg-yellow-100 p-3 rounded-full mb-3">
                      <Zap className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Instant Activation</h4>
                    <p className="text-sm text-gray-600">Get connected immediately after purchase</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="bg-green-100 p-3 rounded-full mb-3">
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Secure & Reliable</h4>
                    <p className="text-sm text-gray-600">Trusted by millions of travelers worldwide</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                      <Globe className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Global Coverage</h4>
                    <p className="text-sm text-gray-600">Stay connected wherever you go</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SharePackagePage;
