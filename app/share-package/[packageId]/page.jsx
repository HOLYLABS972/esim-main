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
  DollarSign,
  CreditCard,
  Coins,
  Loader2,
  ChevronDown,
  HelpCircle
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
  let packageId = params.packageId;
  
  // Redirect topup packages to base SIM package
  if (packageId && packageId.endsWith('-topup')) {
    const baseId = packageId.slice(0, -'-topup'.length);
    if (typeof window !== 'undefined') {
      window.location.replace(window.location.pathname.replace(packageId, baseId) + window.location.search);
    }
    packageId = baseId;
  }
  
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
  
  // Get country info and affiliate ref from URL parameters
  const [urlCountryCode, setUrlCountryCode] = useState(null);
  const [urlCountryFlag, setUrlCountryFlag] = useState(null);
  const [affiliateRef, setAffiliateRef] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState(null);

  // Approximate exchange rates from USD (updated periodically)
  const EXCHANGE_RATES = {
    USD: { rate: 1, symbol: '$' },
    EUR: { rate: 0.92, symbol: '€' },
    GBP: { rate: 0.79, symbol: '£' },
    AUD: { rate: 1.55, symbol: 'A$' },
    CAD: { rate: 1.36, symbol: 'C$' },
    NZD: { rate: 1.71, symbol: 'NZ$' },
    JPY: { rate: 149, symbol: '¥' },
    CHF: { rate: 0.88, symbol: 'CHF ' },
    SGD: { rate: 1.34, symbol: 'S$' },
    HKD: { rate: 7.82, symbol: 'HK$' },
    KRW: { rate: 1320, symbol: '₩' },
    INR: { rate: 83.5, symbol: '₹' },
    MYR: { rate: 4.47, symbol: 'RM ' },
    THB: { rate: 35.5, symbol: '฿' },
    PHP: { rate: 56.5, symbol: '₱' },
    IDR: { rate: 15700, symbol: 'Rp ' },
    BRL: { rate: 4.95, symbol: 'R$' },
    MXN: { rate: 17.2, symbol: 'MX$' },
    ZAR: { rate: 18.8, symbol: 'R ' },
    AED: { rate: 3.67, symbol: 'د.إ ' },
    SAR: { rate: 3.75, symbol: 'ر.س ' },
    TRY: { rate: 30.5, symbol: '₺' },
    PLN: { rate: 4.02, symbol: 'zł ' },
    SEK: { rate: 10.5, symbol: 'kr ' },
    NOK: { rate: 10.7, symbol: 'kr ' },
    DKK: { rate: 6.88, symbol: 'kr ' },
    ILS: { rate: 3.65, symbol: '₪' },
    TWD: { rate: 31.5, symbol: 'NT$' },
    CNY: { rate: 7.24, symbol: '¥' },
    RUB: { rate: 92, symbol: '₽' },
  };

  const convertPrice = (usdPrice) => {
    if (!displayCurrency || !EXCHANGE_RATES[displayCurrency]) {
      return { price: usdPrice, symbol: '$', code: 'USD' };
    }
    const { rate, symbol } = EXCHANGE_RATES[displayCurrency];
    return { price: usdPrice * rate, symbol, code: displayCurrency };
  };

  const formatDisplayPrice = (usdPrice) => {
    const { price, symbol, code } = convertPrice(usdPrice);
    // For currencies with large values (JPY, KRW, IDR), no decimals
    if (['JPY', 'KRW', 'IDR', 'RUB'].includes(code)) {
      return `${symbol}${Math.round(price)}`;
    }
    return `${symbol}${price.toFixed(2)}`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setUrlCountryCode(searchParams.get('country'));
      setUrlCountryFlag(searchParams.get('flag'));
      const ref = searchParams.get('ref');
      if (ref) {
        setAffiliateRef(ref);
        console.log('🤝 Affiliate ref detected:', ref);
      }
      const curr = searchParams.get('currency');
      if (curr) {
        const upper = curr.toUpperCase();
        setDisplayCurrency(upper);
        console.log('💱 Display currency:', upper);
      }
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

  // FAQ
  const [openFaq, setOpenFaq] = useState(null);
  const FAQ_ITEMS = [
    {
      q: t('sharePackage.faq.q1', 'What is an eSIM?'),
      a: t('sharePackage.faq.a1', 'An eSIM is a digital SIM that allows you to activate a cellular plan without a physical SIM card. It\'s built into most modern smartphones and works instantly after purchase.')
    },
    {
      q: t('sharePackage.faq.q2', 'How do I install my eSIM?'),
      a: t('sharePackage.faq.a2', 'After purchase, you\'ll receive a QR code via email. Simply scan it with your phone\'s camera or go to Settings > Cellular > Add eSIM and follow the instructions.')
    },
    {
      q: t('sharePackage.faq.q3', 'Is my device compatible?'),
      a: t('sharePackage.faq.a3', 'Most smartphones released after 2018 support eSIM, including iPhone XS and newer, Samsung Galaxy S20 and newer, and Google Pixel 3 and newer. Check your device settings for eSIM support.')
    },
    {
      q: t('sharePackage.faq.q4', 'When does the data plan start?'),
      a: t('sharePackage.faq.a4', 'Your data plan starts when you first connect to a mobile network in your destination country, not when you install the eSIM. You can install it before your trip.')
    },
    {
      q: t('sharePackage.faq.q5', 'Can I get a refund?'),
      a: t('sharePackage.faq.a5', 'Yes, unused eSIMs are eligible for a refund within the policy terms. Once the eSIM has been activated and data has been used, it cannot be refunded. Please review our refund policy for details.')
    }
  ];

  // Data variant selection
  const DATA_VARIANTS = [1, 2, 5, 10, 20];
  const [selectedDataGB, setSelectedDataGB] = useState(1);
  const [allPlans, setAllPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

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

      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        'https://uhpuqiptxcjluwsetoev.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHVxaXB0eGNqbHV3c2V0b2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTE4OTYsImV4cCI6MjA3MjY2Nzg5Nn0.D_t-dyA4Z192kAU97Oi79At_IDT_5putusXrR0bQ6z8'
      );

      const { data: pkgRow } = await sb.from('dataplans').select('*').eq('id', packageId).single();

      if (pkgRow) {
        const data = pkgRow;
        console.log('✅ Found package in Supabase dataplans:', data);
        const mainPkg = { id: data.id, ...data };
        setPackageData(mainPkg);

        const isGlobalPlan = data.is_global === true || data.type === 'global' || data.region === 'global';
        const isRegionalPlan = data.is_regional === true || data.type === 'regional';
        const countryCode = data.country_code || (data.country_codes && data.country_codes[0]) || urlCountryCode;
        if (countryCode) {
          setPlansLoading(true);
          try {
            let plans = [];

            if (isGlobalPlan || isRegionalPlan || countryCode === 'REGIONAL') {
              const operatorPrefix = (packageId || '').split('-')[0];
              const { data: regionalData } = await sb
                .from('dataplans')
                .select('*')
                .contains('country_codes', ['REGIONAL']);
              const plansMap = new Map();
              (regionalData || []).forEach(row => {
                if (row.id.startsWith(operatorPrefix + '-')) {
                  plansMap.set(row.id, row);
                }
              });
              plans = Array.from(plansMap.values()).filter(p => p.enabled !== false && p.hidden !== true && !p.id.endsWith('-topup') && p.type !== 'topup');
            } else {
              const [{ data: d1 }, { data: d2 }] = await Promise.all([
                sb.from('dataplans').select('*').eq('country_code', countryCode),
                sb.from('dataplans').select('*').contains('country_codes', [countryCode])
              ]);
              const plansMap = new Map();
              (d1 || []).forEach(row => plansMap.set(row.id, row));
              (d2 || []).forEach(row => plansMap.set(row.id, row));
              plans = Array.from(plansMap.values()).filter(p => p.enabled !== false && p.hidden !== true && !p.id.endsWith('-topup') && p.type !== 'topup');
            }
            console.log(`✅ Found ${plans.length} plans for country ${countryCode}`, plans.map(p => ({ id: p.id, data: p.data, price: p.price })));
            setAllPlans(plans);

            // Auto-select 1GB if available, otherwise keep current package's data
            const currentData = parseFloat(data.data);
            if (DATA_VARIANTS.includes(currentData)) {
              setSelectedDataGB(currentData);
            } else {
              setSelectedDataGB(1);
            }
          } catch (err) {
            console.error('Error loading related plans:', err);
          } finally {
            setPlansLoading(false);
          }
        }
        return;
      } else {
        console.log('❌ Package not found in Firebase dataplans');
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

  // Derive the active plan based on selected data variant
  const activePlan = React.useMemo(() => {
    if (!packageData) return null;
    if (allPlans.length === 0) return packageData;

    // Find the cheapest plan matching selected GB
    const matching = allPlans
      .filter(p => parseFloat(p.data) === selectedDataGB)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return matching.length > 0 ? matching[0] : packageData;
  }, [packageData, allPlans, selectedDataGB]);

  // Check which data variants are actually available
  const availableVariants = React.useMemo(() => {
    if (allPlans.length === 0) return DATA_VARIANTS;
    return DATA_VARIANTS.filter(gb =>
      allPlans.some(p => parseFloat(p.data) === gb)
    );
  }, [allPlans]);

  // Update browser URL when active plan changes
  useEffect(() => {
    if (activePlan && activePlan.id !== packageId) {
      const params = new URLSearchParams(window.location.search);
      const newUrl = `/share-package/${activePlan.id}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [activePlan, packageId]);

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
    
    const planToUse = activePlan || packageData;
    if (!planToUse) {
      toast.error('Package data not loaded yet');
      return;
    }

    console.log('🛒 Purchase plan:', { planId: planToUse.id, planName: planToUse.name, data: planToUse.data, price: planToUse.price, selectedDataGB });

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
    
    // Calculate discounted price
    const originalPrice = parseFloat(planToUse.price);

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
      isAuthenticated: !!currentUser,
      selectedDataGB
    });

    // Store package data in localStorage for the checkout process
    const checkoutData = {
      packageId: planToUse.id,
      packageName: planToUse.name,
      packageDescription: planToUse.description,
      price: finalPrice,
      originalPrice: originalPrice,
      currency: planToUse.currency || 'USD',
      data: planToUse.data,
      dataUnit: planToUse.dataUnit || 'GB',
      period: planToUse.period || planToUse.duration,
      country_code: planToUse.country_code,
      benefits: planToUse.benefits || [],
      speed: planToUse.speed
    };

    console.log('💾 Storing checkout data:', checkoutData);

    try {
      localStorage.setItem('selectedPackage', JSON.stringify(checkoutData));
    } catch (e) {
      console.warn('⚠️ Could not store in localStorage (likely in iframe):', e);
    }

    try {
      // Generate unique order ID for each purchase
      const uniqueOrderId = `${planToUse.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create order data for payment service
      const orderData = {
        orderId: uniqueOrderId,
        planId: planToUse.id,
        planName: planToUse.name,
        customerEmail: customerEmail,
        amount: finalPrice, // Use discounted price
        currency: 'usd',
        originalAmount: originalPrice, // Include original amount for reference
        userId: currentUser?.uid || null, // null for guest users
        isGuest: !currentUser, // Flag to indicate guest purchase
        affiliateRef: affiliateRef || null // Affiliate tracking
      };
      
      console.log('💳 Order data for payment:', orderData);

      // Store order info (for iframe compatibility, also pass in URL)
      const pendingOrder = {
        orderId: uniqueOrderId,
        planId: planToUse.id,
        customerEmail: customerEmail,
        amount: finalPrice,
        currency: 'usd',
        paymentMethod: paymentMethod,
        isGuest: !currentUser,
        affiliateRef: affiliateRef || null
      };
      
      try {
        localStorage.setItem('pendingEsimOrder', JSON.stringify(pendingOrder));
      } catch (e) {
        console.warn('⚠️ Could not store in localStorage (likely in iframe):', e);
      }
      
      const isInIframe = window !== window.top;

      if (paymentMethod === 'coinbase') {
        const { coinbaseService } = await import('../../../src/services/coinbaseService');
        await coinbaseService.createCheckoutSession(orderData);
      } else {
        const { paymentService } = await import('../../../src/services/paymentService');
        await paymentService.createCheckoutSession(orderData);
      }

      // When inside an iframe, payment opens in a new tab so re-enable the button
      if (isInIframe) {
        setIsProcessing(false);
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
          {/* Package Title & Country */}
          <div className="bg-white p-4 pb-2">
            <div className="text-center">
              <span className="text-4xl mb-2 block">
                {urlCountryFlag || ((activePlan || packageData).country_code ? getCountryFlag((activePlan || packageData).country_code) : '🌍')}
              </span>
              <h2 className="text-2xl font-bold text-black">
                {(activePlan || packageData).country_name || (activePlan || packageData).name}
              </h2>
            </div>
          </div>

          {/* Data Variant Selector */}
          <div className="px-4 py-4">
            <p className={`text-sm font-medium text-gray-600 mb-3 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('sharePackage.selectData', 'Select Data Plan')}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DATA_VARIANTS.map((gb) => {
                const isAvailable = availableVariants.includes(gb);
                const isSelected = selectedDataGB === gb;
                return (
                  <button
                    key={gb}
                    onClick={() => isAvailable && setSelectedDataGB(gb)}
                    disabled={!isAvailable}
                    className={`flex-1 min-w-[64px] py-3 px-2 rounded-xl text-center font-semibold text-sm transition-all duration-200 border-2 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                        : isAvailable
                          ? 'bg-white text-gray-800 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                          : 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    {gb} GB
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Plan Details */}
          {activePlan && (
            <div className="bg-white px-4 pb-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Wifi className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">{t('sharePackage.data', 'Data')}</div>
                  <div className="font-bold text-black">{formatData(activePlan.data, activePlan.dataUnit)}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">{t('sharePackage.validity', 'Validity')}</div>
                  <div className="font-bold text-black">{activePlan.period || activePlan.duration || 'N/A'} {t('sharePackage.days', 'days')}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <DollarSign className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-gray-500">{t('sharePackage.price', 'Price')}</div>
                  {(() => {
                    const originalPrice = parseFloat(activePlan.price);
                    const discountPercent = regularSettings.discountPercentage || 10;
                    let finalPrice = originalPrice * (100 - discountPercent) / 100;
                    const minimumPrice = regularSettings.minimumPrice || 0.5;
                    finalPrice = Math.max(minimumPrice, finalPrice);
                    return (
                      <div>
                        <div className="font-bold text-green-600">{formatDisplayPrice(finalPrice)}</div>
                        <div className="text-xs text-gray-400 line-through">{formatDisplayPrice(parseFloat(activePlan.price))}</div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Purchase Section */}
          <div className="p-4 pt-0">
            <div className="max-w-2xl mx-auto">
              {/* Refund Policy */}
              <div className="mb-4">
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

              {/* Payment Buttons */}
              <div className="space-y-3">
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
                  <span>{t('sharePackage.purchaseNow', 'Purchase Now')} - Credit/Debit Card</span>
                </button>

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
                  <span>{t('sharePackage.purchaseNow', 'Purchase Now')} - Cryptocurrency</span>
                </button>
              </div>

              {/* How to Use Section */}
              <div className="text-center mt-8">
                <h3 className={`text-lg font-semibold text-gray-900 mb-4 ${isRTL ? 'text-right' : 'text-center'}`}>{t('sharePackage.howToUse', 'How to Use')}</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="bg-yellow-100 p-2 rounded-full mb-2">
                      <Zap className="w-5 h-5 text-yellow-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-xs">{t('sharePackage.instantActivation', 'Instant Activation')}</h4>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="bg-green-100 p-2 rounded-full mb-2">
                      <Shield className="w-5 h-5 text-green-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-xs">{t('sharePackage.secureReliable', 'Secure & Reliable')}</h4>
                  </div>
                  <div className="flex flex-col items-center text-center p-2">
                    <div className="bg-blue-100 p-2 rounded-full mb-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-xs">{t('sharePackage.globalCoverage', 'Global Coverage')}</h4>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="mt-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{t('sharePackage.faq.title', 'Frequently Asked Questions')}</h3>
                </div>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left bg-white hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-sm text-gray-900">{item.q}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-500 flex-shrink-0 ml-2 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                      </button>
                      {openFaq === idx && (
                        <div className="px-4 pb-3 text-sm text-gray-600 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
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
