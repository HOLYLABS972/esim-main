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
  Gift
} from 'lucide-react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { hasUserUsedReferralCode } from '../../../src/services/referralService';
import { getReferralSettings } from '../../../src/services/settingsService';
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
  const [hasReferralDiscount, setHasReferralDiscount] = useState(false);
  const [referralSettings, setReferralSettings] = useState({ discountPercentage: 10, minimumPrice: 0.5 });

  const loadFromAiraloAPI = useCallback(async () => {
    try {
      console.log('🔍 Searching for package in Airalo API:', packageId);
      const response = await fetch(`/api/airalo/plans`);
      const data = await response.json();
      
      if (data.success && data.plans) {
        console.log(`📋 Found ${data.plans.length} plans in API response`);
        const packageData = data.plans.find(pkg => 
          pkg.slug === packageId || 
          pkg.id === packageId ||
          pkg.name?.toLowerCase().includes(packageId.toLowerCase())
        );
        
        if (packageData) {
          console.log('📦 Airalo package data found:', packageData);
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
          return true; // Package found
        } else {
          console.log('❌ Package not found in Airalo API response');
          console.log('Available package IDs:', data.plans.map(p => p.slug || p.id).slice(0, 10));
        }
      } else {
        console.error('❌ Airalo API response failed:', data);
      }
      return false; // Package not found
    } catch (error) {
      console.error('❌ Error loading from Airalo API:', error);
      return false;
    }
  }, [packageId]);

  const loadPackageData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading package data for ID:', packageId);
      
      // Try to load from Firebase dataplans collection first
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../../../src/firebase/config');
      
      const packageRef = doc(db, 'dataplans', packageId);
      const packageSnap = await getDoc(packageRef);
      
      if (packageSnap.exists()) {
        const data = packageSnap.data();
        console.log('✅ Found package in Firebase dataplans:', data);
        setPackageData({
          id: packageSnap.id,
          ...data
        });
        return; // Package found, exit early
      } else {
        console.log('❌ Package not found in Firebase dataplans, trying Airalo API...');
      }
      
      // If not found in Firebase, try to load from Airalo API
      const foundInAPI = await loadFromAiraloAPI();
      
      if (!foundInAPI && urlCountryCode) {
        console.log('🔍 Package not found by ID, trying to find by country code:', urlCountryCode);
        // Try to find a package for the country from the URL
        try {
          const response = await fetch(`/api/airalo/plans?country=${urlCountryCode}`);
          const data = await response.json();
          
          if (data.success && data.plans && data.plans.length > 0) {
            // Use the first available plan for this country
            const fallbackPackage = data.plans[0];
            console.log('✅ Using fallback package for country:', fallbackPackage);
            setPackageData({
              id: fallbackPackage.slug || fallbackPackage.id,
              name: fallbackPackage.name,
              description: fallbackPackage.description,
              price: fallbackPackage.price,
              currency: fallbackPackage.currency || 'USD',
              data: fallbackPackage.capacity || fallbackPackage.data,
              dataUnit: fallbackPackage.data_unit || 'GB',
              period: fallbackPackage.period || fallbackPackage.validity,
              duration: fallbackPackage.period || fallbackPackage.validity,
              country_code: fallbackPackage.country_codes?.[0] || fallbackPackage.country_code,
              benefits: fallbackPackage.features || [],
              speed: fallbackPackage.speed,
              region_slug: fallbackPackage.region_slug
            });
            return;
          }
        } catch (fallbackError) {
          console.error('❌ Error with fallback country search:', fallbackError);
        }
      }
      
      if (!foundInAPI) {
        console.log('❌ Package not found in either Firebase or Airalo API');
        console.log('Package ID:', packageId);
        console.log('URL Country Code:', urlCountryCode);
        // Don't set packageData to null here, let the component handle the "not found" state
      }
    } catch (error) {
      console.error('❌ Error loading package data:', error);
      toast.error('Failed to load package information');
    } finally {
      setLoading(false);
    }
  }, [packageId, loadFromAiraloAPI]);

  // Load referral settings
  const loadReferralSettings = useCallback(async () => {
    try {
      const settings = await getReferralSettings();
      setReferralSettings(settings);
      console.log('⚙️ Loaded referral settings:', settings);
    } catch (error) {
      console.error('Error loading referral settings:', error);
    }
  }, []);

  // Check if user has referral discount
  const checkReferralDiscount = useCallback(async () => {
    if (currentUser) {
      try {
        const hasUsed = await hasUserUsedReferralCode(currentUser.uid);
        setHasReferralDiscount(hasUsed);
        console.log('🎁 User has referral discount:', hasUsed);
      } catch (error) {
        console.error('Error checking referral discount:', error);
      }
    }
  }, [currentUser]);

  useEffect(() => {
    if (packageId) {
      loadPackageData();
    }
  }, [packageId, loadPackageData]);

  useEffect(() => {
    loadReferralSettings();
  }, [loadReferralSettings]);

  useEffect(() => {
    checkReferralDiscount();
  }, [checkReferralDiscount]);

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
    
    // Calculate discounted price if user has referral discount
    const originalPrice = parseFloat(packageData.price);
    const discountPercentage = referralSettings.discountPercentage || 10;
    const minimumPrice = referralSettings.minimumPrice || 0.5;
    
    // Calculate percentage-based discount
    const discountedPrice = hasReferralDiscount 
      ? Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100)
      : originalPrice;
    const finalPrice = hasReferralDiscount ? discountedPrice : originalPrice;
    
    console.log('💰 Pricing calculation:', {
      originalPrice,
      hasReferralDiscount,
      discountPercentage,
      minimumPrice,
      discountedPrice,
      finalPrice
    });
    
    // Store package data in localStorage for the checkout process
    const checkoutData = {
      packageId: packageId,
      packageName: packageData.name,
      packageDescription: packageData.description,
      price: finalPrice, // Use discounted price
      originalPrice: originalPrice, // Keep original price for reference
      currency: packageData.currency || 'USD',
      data: packageData.data,
      dataUnit: packageData.dataUnit || 'GB',
      period: packageData.period || packageData.duration,
      country_code: packageData.country_code,
      benefits: packageData.benefits || [],
      speed: packageData.speed,
      hasReferralDiscount: hasReferralDiscount
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
        amount: finalPrice, // Use discounted price
        currency: 'usd',
        originalAmount: originalPrice, // Include original amount for reference
        hasReferralDiscount: hasReferralDiscount
      };
      
      console.log('💳 Order data for payment:', orderData);
      
      // Redirect to payment directly
      await paymentService.createCheckoutSession(orderData);
      
    } catch (error) {
      console.error('❌ Payment failed:', error);
      toast.error('Failed to process payment');
    }
  };

  const formatPrice = (price) => {
    // Handle cases where price might already be a string with currency symbol
    let numericPrice = price;
    if (typeof price === 'string') {
      // Remove any existing currency symbols and parse as number
      numericPrice = parseFloat(price.replace(/[$€£¥]/g, '')) || 0;
    }
    
    // Return just the number without currency symbol
    return numericPrice.toFixed(2);
  };

  const formatData = (data, unit = 'GB') => {
    if (data === 'Unlimited' || data === -1) {
      return 'Unlimited';
    }
    
    // Handle cases where data might already contain the unit
    if (typeof data === 'string' && data.includes(unit)) {
      return data; // Return as-is if unit is already included
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
      console.warn('Invalid country code: ' + countryCode, error);
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
                    {hasReferralDiscount ? (
                      <div>
                        <div className="font-semibold text-red-600">
                          ${Math.max(referralSettings.minimumPrice, parseFloat(packageData.price) * (100 - referralSettings.discountPercentage) / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 line-through">${formatPrice(packageData.price)}</div>
                        <div className="text-xs text-red-600 font-medium">
                          Save ${(parseFloat(packageData.price) - Math.max(referralSettings.minimumPrice, parseFloat(packageData.price) * (100 - referralSettings.discountPercentage) / 100)).toFixed(2)}!
                        </div>
                      </div>
                    ) : (
                      <div className="font-semibold text-green-600">${formatPrice(packageData.price)}</div>
                    )}
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
                {hasReferralDiscount && (
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4 max-w-md mx-auto">
                    <div className="flex items-center justify-center space-x-2">
                      <Gift className="w-5 h-5 text-green-600" />
                      <span className="text-green-800 font-medium">Referral Discount Applied!</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      You're saving ${(parseFloat(packageData.price) - Math.max(referralSettings.minimumPrice, parseFloat(packageData.price) * (100 - referralSettings.discountPercentage) / 100)).toFixed(2)} on this purchase ({referralSettings.discountPercentage}% off)
                    </p>
                  </div>
                )}
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
