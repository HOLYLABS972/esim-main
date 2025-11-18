'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
  CreditCard,
  Coins,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useI18n } from '../../../src/contexts/I18nContext';
import { getLanguageDirection } from '../../../src/utils/languageUtils';
import toast from 'react-hot-toast';

const SharePackagePage = () => {
  console.log('🎯 SharePackagePage component loaded');
  console.log('🎯 Component is rendering');
  
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const { t, locale } = useI18n();
  const packageId = params.packageId;
  
  console.log('🔐 Auth Debug:', {
    currentUser: currentUser,
    hasUser: !!currentUser,
    userUid: currentUser?.uid,
    userEmail: currentUser?.email
  });
  
  console.log('🎯 Package ID:', packageId);
  console.log('🎯 Current user:', currentUser ? 'logged in' : 'not logged in');
  
  // RTL support
  const isRTL = getLanguageDirection(locale) === 'rtl';
  
  // Get country info from URL parameters
  const [urlCountryCode, setUrlCountryCode] = useState(null);
  const [urlCountryFlag, setUrlCountryFlag] = useState(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlCountryCode(searchParams.get('country'));
      setUrlCountryFlag(searchParams.get('flag'));
    }
  }, []);
  
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regularSettings, setRegularSettings] = useState({ discountPercentage: 10, minimumPrice: 0.5 });

  const [balanceInfo, setBalanceInfo] = useState({ balance: 0, hasInsufficientFunds: false, minimumRequired: 4, mode: 'production' });
  const [acceptedRefund, setAcceptedRefund] = useState(false);
  const [coinbaseAvailable, setCoinbaseAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const loadFromAPI = useCallback(async () => {
    try {
      console.log('🔍 Searching for package:', packageId);
      // Packages are now loaded from Firestore dataplans collection
      // This function is kept for backwards compatibility
      return false;
    } catch (error) {
      console.error('❌ Error loading package:', error);
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
        console.log('❌ Package not found in Firebase dataplans');
        console.log('Package ID:', packageId);
        console.log('URL Country Code:', urlCountryCode);
      }
    } catch (error) {
      console.error('❌ Error loading package data:', error);
      toast.error('Failed to load package information');
    } finally {
      setLoading(false);
    }
  }, [packageId, loadFromAPI, urlCountryCode]);

  // Load discount settings
  const loadDiscountSettings = useCallback(async () => {
    try {
      const { getRegularSettings } = await import('../../../src/services/settingsService');
      const regular = await getRegularSettings();
      setRegularSettings(regular);
      console.log('⚙️ Loaded discount settings:', { regular });
    } catch (error) {
      console.error('Error loading discount settings:', error);
    }
  }, []);

  useEffect(() => {
    if (packageId) {
      loadPackageData();
    }
  }, [packageId, loadPackageData]);

  useEffect(() => {
    loadDiscountSettings();
  }, [loadDiscountSettings]);

  // Check business balance and detect API key mode
  useEffect(() => {
    console.log('🚀 Balance check useEffect triggered');
    console.log('🚀 Current user from useAuth:', currentUser ? currentUser.uid : 'null');
    
    // Only run balance check if user is authenticated
    if (!currentUser) {
      console.log('⏳ User not authenticated yet, skipping balance check');
      return;
    }
    
    const checkMode = async () => {
      try {
        console.log('🔍 Starting mode detection...');
        const { configService } = await import('../../../src/services/configService');
        
        // Detect API key mode from frontend (no backend needed)
        const apiKeyMode = await configService.getApiKeyMode();
        console.log('🔑 Detected API key mode:', apiKeyMode);
        
        // Get API key for debugging
        const { configService: configService2 } = await import('../../../src/services/configService');
        const airaloConfig = await configService2.getAiraloConfig();
        
        // Set balance info with mode detection
        const balanceInfo = {
          balance: 0,
          hasInsufficientFunds: false, // Allow purchases in both sandbox and production
          minimumRequired: 4,
          mode: apiKeyMode,
          apiKey: airaloConfig?.apiKey || 'No API key found (localhost)'
        };
        
        setBalanceInfo(balanceInfo);
        
        console.log('🔑 Final mode used:', apiKeyMode);
        console.log('🚫 Will show error banner:', balanceInfo.hasInsufficientFunds && apiKeyMode !== 'sandbox');
        console.log('🔒 Will disable purchase button:', balanceInfo.hasInsufficientFunds && apiKeyMode !== 'sandbox');
        console.log('📊 Debug info:', {
          hasInsufficientFunds: balanceInfo.hasInsufficientFunds,
          mode: apiKeyMode,
          showBanner: balanceInfo.hasInsufficientFunds && apiKeyMode !== 'sandbox',
          disableButton: balanceInfo.hasInsufficientFunds && apiKeyMode !== 'sandbox'
        });
        
        // Log URL parameters for debugging
        if (urlCountryCode || urlCountryFlag) {
          console.log('🌐 URL parameters detected:', {
            country: urlCountryCode,
            flag: urlCountryFlag,
            detectedMode: apiKeyMode,
            balance: balanceInfo
          });
        }
      } catch (error) {
        console.error('Error detecting mode:', error);
      }
    };
    checkMode();
  }, [currentUser, urlCountryCode, urlCountryFlag]); // Run when user authentication changes

  // Check if Coinbase is available
  useEffect(() => {
    const checkCoinbaseAvailability = async () => {
      try {
        const { coinbaseService } = await import('../../../src/services/coinbaseService');
        const available = await coinbaseService.initialize();
        console.log('🔍 Coinbase availability check:', available);
        setCoinbaseAvailable(available);
        
        // If initialization failed, still show the button but log for debugging
        if (!available) {
          console.log('⚠️ Coinbase credentials not found. Please configure in Firestore config/coinbase or environment variables.');
        }
      } catch (err) {
        console.error('❌ Error checking Coinbase availability:', err);
        // Still show button even if check fails - let the actual purchase handle the error
        setCoinbaseAvailable(true);
      }
    };

    checkCoinbaseAvailability();
  }, []);

  const handlePurchase = async (paymentMethod = 'stripe') => {
    // Allow non-authenticated users to purchase
    if (!acceptedRefund) {
      toast.error('Please accept the refund policy to continue');
      return;
    }
    
    if (!packageData) {
      toast.error('Package data not loaded yet');
      return;
    }

    if (isProcessing) {
      return;
    }

    // Get email from URL params, currentUser, or prompt
    let customerEmail = searchParams.get('email') || currentUser?.email;
    
    // If no email, prompt user
    if (!customerEmail) {
      const emailInput = prompt('Please enter your email address to receive your eSIM:');
      if (!emailInput) {
        toast.error('Email is required to complete purchase');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInput)) {
        toast.error('Please enter a valid email address');
        return;
      }
      customerEmail = emailInput;
    }

    setSelectedPaymentMethod(paymentMethod);
    setIsProcessing(true);
    
    // Calculate discounted price - use EITHER basic OR referral discount (not both)
    const originalPrice = parseFloat(packageData.price);
    
    // Apply regular discount
    const appliedDiscountPercent = regularSettings.discountPercentage || 10;
    let finalPrice = originalPrice * (100 - appliedDiscountPercent) / 100;
    
    // Apply minimum price constraint
    const minimumPrice = regularSettings.minimumPrice || 0.5;
    finalPrice = Math.max(minimumPrice, finalPrice);
    
    console.log('💰 Pricing calculation:', {
      originalPrice,
      appliedDiscountPercent,
      finalPrice,
      minimumPrice,
      paymentMethod,
      customerEmail,
      isAuthenticated: !!currentUser
    });
    
    // Store package data in localStorage for the checkout process (for iframe compatibility, also pass in URL)
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
      speed: packageData.speed
    };
    
    console.log('💾 Storing checkout data:', checkoutData);
    
    // Store in localStorage (may not work in iframe, so we'll also pass in URL)
    try {
      localStorage.setItem('selectedPackage', JSON.stringify(checkoutData));
    } catch (e) {
      console.warn('⚠️ Could not store in localStorage (likely in iframe):', e);
    }
    
    try {
      // Generate unique order ID for each purchase
      const uniqueOrderId = `${packageId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order data for payment service
      const orderData = {
        orderId: uniqueOrderId, // Unique order ID for each purchase
        planId: packageId,
        planName: packageData.name,
        customerEmail: customerEmail,
        amount: finalPrice, // Use discounted price
        currency: 'usd',
        originalAmount: originalPrice, // Include original amount for reference
        userId: currentUser?.uid || null, // null for guest users
        isGuest: !currentUser // Flag to indicate guest purchase
      };
      
      console.log('💳 Order data for payment:', orderData);

      // Store order info (for iframe compatibility, also pass in URL)
      const pendingOrder = {
        orderId: uniqueOrderId,
        planId: packageId,
        customerEmail: customerEmail,
        amount: finalPrice,
        currency: 'usd',
        paymentMethod: paymentMethod,
        isGuest: !currentUser
      };
      
      try {
        localStorage.setItem('pendingEsimOrder', JSON.stringify(pendingOrder));
      } catch (e) {
        console.warn('⚠️ Could not store in localStorage (likely in iframe):', e);
      }
      
      // Redirect to payment based on selected method
      // Pass email and order info in URL params for iframe compatibility
      if (paymentMethod === 'coinbase') {
        const { coinbaseService } = await import('../../../src/services/coinbaseService');
        // Modify createCheckoutSession to accept email in URL params
        await coinbaseService.createCheckoutSession(orderData);
      } else {
        const { paymentService } = await import('../../../src/services/paymentService');
        // Modify createCheckoutSession to accept email in URL params
        await paymentService.createCheckoutSession(orderData);
      }
      
    } catch (error) {
      console.error('❌ Payment failed:', error);
      toast.error(error.message || 'Failed to process payment');
      setIsProcessing(false);
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
          <p className="text-gray-600">{t('sharePackage.loadingPackageInfo', 'Loading package information...')}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('sharePackage.packageNotFound', 'Package Not Found')}</h3>
          <p className="text-gray-600 mb-4">
            {t('sharePackage.packageNotFoundDesc', 'The package you\'re looking for doesn\'t exist or has been removed')}
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

  // Use actual mode detection
  const currentMode = balanceInfo.mode || 'production'; // Default to production if not detected yet
  const showBanner = false; // Disable banner to prevent service unavailable message
  
  // FORCE SANDBOX MODE FOR TESTING
  const forceMode = 'sandbox';
  
  console.log('🔍 CURRENT MODE:', currentMode);
  console.log('🔍 BALANCE INFO:', balanceInfo);
  console.log('🧪 FORCE MODE:', forceMode);

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
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
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">{t('sharePackage.packageDetails', 'Package Details')}</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sandbox Mode Banner - Allow purchases */}
      {currentMode === 'sandbox' && showBanner && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Test Mode - Sandbox Environment
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You are currently in sandbox mode. This is a test environment with mock data. Purchases are allowed for testing purposes.
                </p>
                <p className="mt-1 font-mono text-xs">
                  RoamJet API Key: {process.env.NEXT_PUBLIC_ROAMJET_API_KEY || 'Not set'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Production Mode Banner - Block purchases */}
      {currentMode === 'production' && showBanner && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Technical Issues - Service Temporarily Unavailable
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  Our service is currently experiencing technical difficulties. Please check back later or contact support for assistance.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <h2 className="text-4xl font-bold text-black">{packageData.name}</h2>
              <p className="text-gray-600 text-lg mt-2">{t('sharePackage.noPhoneNumber', 'This eSIM doesn\'t come with a number')}</p>
            </div>
          </div>
          
          {/* Package Stats */}
          <div className="bg-white px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Wifi className="w-5 h-5 text-gray-600" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-600">{t('sharePackage.data', 'Data')}</div>
                    <div className="font-semibold text-black">{formatData(packageData.data, packageData.dataUnit)}</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <Clock className="w-5 h-5 text-gray-600" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-600">{t('sharePackage.validity', 'Validity')}</div>
                    <div className="font-semibold text-black">{packageData.period || packageData.duration || 'N/A'} days</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <DollarSign className="w-5 h-5 text-gray-600" />
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-600">{t('sharePackage.price', 'Price')}</div>
                    {(() => {
                      const originalPrice = parseFloat(packageData.price);
                      // Apply regular discount
                      const discountPercent = regularSettings.discountPercentage || 10;
                      let finalPrice = originalPrice * (100 - discountPercent) / 100;
                      
                      // Apply minimum price constraint
                      const minimumPrice = regularSettings.minimumPrice || 0.5;
                      finalPrice = Math.max(minimumPrice, finalPrice);
                      
                      return (
                        <div>
                          <div className="font-semibold text-red-600">
                            ${finalPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500 line-through">${formatPrice(packageData.price)}</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                  <span className="text-2xl">
                    {urlCountryFlag || (packageData.country_code ? getCountryFlag(packageData.country_code) : '🌍')}
                  </span>
                  <div className={isRTL ? 'text-right' : 'text-left'}>
                    <div className="text-sm text-gray-600">{t('sharePackage.country', 'Country')}</div>
                    <div className="font-semibold text-black">{urlCountryCode || packageData.country_code || 'DE'}</div>
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
                <h3 className={`text-2xl font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.getThisPackage', 'Get This Package')}</h3>
                <div className="max-w-md mx-auto mb-4 text-left">
                  <label htmlFor="acceptRefund" className="flex items-start gap-3 text-sm text-gray-700">
                    <input
                      id="acceptRefund"
                      type="checkbox"
                      checked={acceptedRefund}
                      onChange={(e) => setAcceptedRefund(e.target.checked)}
                      className={"mt-1 h-4 w-4 rounded border-gray-300 focus:ring-blue-500 " + (acceptedRefund ? 'text-blue-600' : 'checkbox-red')}
                    />
                    <span>
                      I accept the <a href="https://esim.roamjet.net/refund-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Refund Policy</a>
                    </span>
                  </label>
                </div>

                {/* Payment Method Buttons */}
                <div className="space-y-3 max-w-md mx-auto">
                  {/* Stripe Payment Button */}
                  <button
                    onClick={() => handlePurchase('stripe')}
                    disabled={!acceptedRefund || isProcessing}
                    className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg text-white ${
                      selectedPaymentMethod === 'stripe' 
                        ? 'bg-blue-700 ring-2 ring-blue-300' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } ${!acceptedRefund || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing && selectedPaymentMethod === 'stripe' ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <CreditCard className="w-6 h-6" />
                    )}
                    <span>
                      {t('sharePackage.purchaseNow', 'Purchase Now')} - Credit/Debit Card
                    </span>
                  </button>

                  {/* Coinbase Payment Button - Always show */}
                  <button
                    onClick={() => handlePurchase('coinbase')}
                    disabled={!acceptedRefund || isProcessing}
                    className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg text-white ${
                      selectedPaymentMethod === 'coinbase' 
                        ? 'bg-gray-900 ring-2 ring-gray-400' 
                        : 'bg-black hover:bg-gray-900'
                    } ${!acceptedRefund || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isProcessing && selectedPaymentMethod === 'coinbase' ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Coins className="w-6 h-6" />
                    )}
                    <span>
                      {t('sharePackage.purchaseNow', 'Purchase Now')} - Cryptocurrency
                    </span>
                  </button>
                </div>
              </div>

              {/* How to Use Section */}
              <div className="text-center">
                <h3 className={`text-2xl font-semibold text-gray-900 mb-6 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.howToUse', 'How to Use')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="bg-yellow-100 p-3 rounded-full mb-3">
                      <Zap className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h4 className={`font-semibold text-gray-900 mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.instantActivation', 'Instant Activation')}</h4>
                    <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.instantActivationDesc', 'Get connected immediately after purchase')}</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="bg-green-100 p-3 rounded-full mb-3">
                      <Shield className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className={`font-semibold text-gray-900 mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.secureReliable', 'Secure & Reliable')}</h4>
                    <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.secureReliableDesc', 'Trusted by millions of travelers worldwide')}</p>
                  </div>
                  <div className="flex flex-col items-center text-center p-4">
                    <div className="bg-blue-100 p-3 rounded-full mb-3">
                      <Globe className="w-8 h-8 text-blue-600" />
                    </div>
                    <h4 className={`font-semibold text-gray-900 mb-2 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.globalCoverage', 'Global Coverage')}</h4>
                    <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.globalCoverageDesc', 'Stay connected wherever you go')}</p>
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
