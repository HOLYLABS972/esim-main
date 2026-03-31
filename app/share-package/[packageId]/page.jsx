'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Globe,
  Wifi,
  Clock,
  Shield,
  Zap,
  DollarSign,
  Loader2,
  ChevronDown,
  HelpCircle,
  Check,
  Smartphone,
  Signal,
  Star,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { useI18n } from '../../../src/contexts/I18nContext';
import { getLanguageDirection } from '../../../src/utils/languageUtils';
import toast from 'react-hot-toast';

const SharePackagePage = () => {
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

  const isRTL = getLanguageDirection(locale) === 'rtl';

  const [urlCountryCode, setUrlCountryCode] = useState(null);
  const [urlCountryFlag, setUrlCountryFlag] = useState(null);
  const [affiliateRef, setAffiliateRef] = useState(null);
  const [displayCurrency, setDisplayCurrency] = useState(null);

  // Exchange rates from USD
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
      if (ref) setAffiliateRef(ref);
      const curr = searchParams.get('currency');
      if (curr) setDisplayCurrency(curr.toUpperCase());
    }
  }, []);

  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regularSettings, setRegularSettings] = useState({ discountPercentage: 10, minimumPrice: 0.5 });
  const [balanceInfo, setBalanceInfo] = useState({ balance: 0, hasInsufficientFunds: false, minimumRequired: 4, mode: 'production' });
  const [acceptedRefund, setAcceptedRefund] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  const FAQ_ITEMS = [
    {
      q: t('sharePackage.faq.q1', 'What is an eSIM?'),
      a: t('sharePackage.faq.a1', "An eSIM is a digital SIM that allows you to activate a cellular plan without a physical SIM card. It's built into most modern smartphones and works instantly after purchase.")
    },
    {
      q: t('sharePackage.faq.q2', 'How do I install my eSIM?'),
      a: t('sharePackage.faq.a2', "After purchase, you'll receive a QR code via email. Simply scan it with your phone's camera or go to Settings > Cellular > Add eSIM and follow the instructions.")
    },
    {
      q: t('sharePackage.faq.q3', 'Is my device compatible?'),
      a: t('sharePackage.faq.a3', 'Most smartphones released after 2018 support eSIM, including iPhone XS and newer, Samsung Galaxy S20 and newer, and Google Pixel 3 and newer.')
    },
    {
      q: t('sharePackage.faq.q4', 'When does the data plan start?'),
      a: t('sharePackage.faq.a4', 'Your data plan starts when you first connect to a mobile network in your destination country, not when you install the eSIM.')
    },
    {
      q: t('sharePackage.faq.q5', 'Can I get a refund?'),
      a: t('sharePackage.faq.a5', 'Yes, unused eSIMs are eligible for a full refund within 14 days of purchase. Once activated and data has been used, it cannot be refunded.')
    }
  ];

  const DATA_VARIANTS = [1, 2, 5, 10, 20];
  const [selectedDataGB, setSelectedDataGB] = useState(1);
  const [allPlans, setAllPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);

  const loadFromAPI = useCallback(async () => {
    try {
      return false;
    } catch (error) {
      return false;
    }
  }, [packageId]);

  const loadPackageData = useCallback(async () => {
    try {
      setLoading(true);
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        'https://uhpuqiptxcjluwsetoev.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVocHVxaXB0eGNqbHV3c2V0b2V2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTE4OTYsImV4cCI6MjA3MjY2Nzg5Nn0.D_t-dyA4Z192kAU97Oi79At_IDT_5putusXrR0bQ6z8'
      );

      const { data: pkgRow } = await sb.from('dataplans').select('*').eq('id', packageId).single();

      if (pkgRow) {
        const data = pkgRow;
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
                if (row.id.startsWith(operatorPrefix + '-')) plansMap.set(row.id, row);
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
            setAllPlans(plans);
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
      }
    } catch (error) {
      console.error('❌ Error loading package data:', error);
      toast.error('Failed to load package information');
    } finally {
      setLoading(false);
    }
  }, [packageId, loadFromAPI, urlCountryCode]);

  const loadDiscountSettings = useCallback(async () => {
    try {
      const { getRegularSettings } = await import('../../../src/services/settingsService');
      const regular = await getRegularSettings();
      setRegularSettings(regular);
    } catch (error) {
      console.error('Error loading discount settings:', error);
    }
  }, []);

  useEffect(() => {
    if (packageId) loadPackageData();
  }, [packageId, loadPackageData]);

  useEffect(() => {
    loadDiscountSettings();
  }, [loadDiscountSettings]);

  useEffect(() => {
    if (!currentUser) return;
    const checkMode = async () => {
      try {
        const { configService } = await import('../../../src/services/configService');
        const apiKeyMode = await configService.getApiKeyMode();
        setBalanceInfo({
          balance: 0,
          hasInsufficientFunds: false,
          minimumRequired: 4,
          mode: apiKeyMode,
        });
      } catch (error) {
        console.error('Error detecting mode:', error);
      }
    };
    checkMode();
  }, [currentUser]);

  const activePlan = React.useMemo(() => {
    if (!packageData) return null;
    if (allPlans.length === 0) return packageData;
    const matching = allPlans
      .filter(p => parseFloat(p.data) === selectedDataGB)
      .sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    return matching.length > 0 ? matching[0] : packageData;
  }, [packageData, allPlans, selectedDataGB]);

  const availableVariants = React.useMemo(() => {
    if (allPlans.length === 0) return DATA_VARIANTS;
    return DATA_VARIANTS.filter(gb => allPlans.some(p => parseFloat(p.data) === gb));
  }, [allPlans]);

  useEffect(() => {
    if (activePlan && activePlan.id !== packageId) {
      const params = new URLSearchParams(window.location.search);
      const newUrl = `/share-package/${activePlan.id}${params.toString() ? '?' + params.toString() : ''}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [activePlan, packageId]);

  const handlePurchase = async (paymentMethod = 'paddle') => {
    if (!acceptedRefund) {
      toast.error('Please accept the refund policy to continue');
      return;
    }
    const planToUse = activePlan || packageData;
    if (!planToUse) {
      toast.error('Package data not loaded yet');
      return;
    }
    if (isProcessing) return;

    const customerEmail = currentUser?.email ?? null;
    setSelectedPaymentMethod(paymentMethod);
    setIsProcessing(true);

    const originalPrice = parseFloat(planToUse.price);
    const appliedDiscountPercent = regularSettings.discountPercentage || 10;
    let finalPrice = originalPrice * (100 - appliedDiscountPercent) / 100;
    const minimumPrice = regularSettings.minimumPrice || 0.5;
    finalPrice = Math.max(minimumPrice, finalPrice);

    const checkoutData = {
      packageId: planToUse.id,
      packageName: planToUse.name,
      packageDescription: planToUse.description,
      price: finalPrice,
      originalPrice,
      currency: planToUse.currency || 'USD',
      data: planToUse.data,
      dataUnit: planToUse.dataUnit || 'GB',
      period: planToUse.period || planToUse.duration,
      country_code: planToUse.country_code,
      benefits: planToUse.benefits || [],
      speed: planToUse.speed
    };

    try {
      localStorage.setItem('selectedPackage', JSON.stringify(checkoutData));
    } catch (e) {}

    try {
      const uniqueOrderId = `${planToUse.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const airaloPackageSlug = planToUse.slug || planToUse.airalo_slug || planToUse.id;

      const orderData = {
        orderId: uniqueOrderId,
        planId: airaloPackageSlug,
        planName: planToUse.name,
        customerEmail,
        amount: finalPrice,
        currency: 'usd',
        originalAmount: originalPrice,
        userId: currentUser?.uid || null,
        isGuest: !currentUser,
        affiliateRef: affiliateRef || null,
        countryCode: planToUse.country_code || (planToUse.country_codes && planToUse.country_codes[0]) || null,
        countryName: planToUse.country_name || null,
      };

      const pendingOrder = {
        orderId: uniqueOrderId,
        planId: airaloPackageSlug,
        customerEmail,
        amount: finalPrice,
        currency: 'usd',
        paymentMethod,
        isGuest: !currentUser,
        affiliateRef: affiliateRef || null
      };

      try {
        localStorage.setItem('pendingEsimOrder', JSON.stringify(pendingOrder));
      } catch (e) {}

      const isInIframe = window !== window.top;

      if (paymentMethod === 'paddle') {
        const { paddleService } = await import('../../../src/services/paddleService');
        await paddleService.createCheckoutSession(orderData);
      } else {
        const { coinbaseService } = await import('../../../src/services/coinbaseService');
        await coinbaseService.createCheckoutSession(orderData);
      }

      if (isInIframe) setIsProcessing(false);
    } catch (error) {
      console.error('❌ Payment failed:', error);
      toast.error(error.message || 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  const formatData = (data, unit = 'GB') => {
    if (data === 'Unlimited' || data === -1) return 'Unlimited';
    const num = parseFloat(data);
    if (isNaN(num)) return data || 'N/A';
    return `${num} ${unit}`;
  };

  const getCountryName = (code) => {
    if (!code) return null;
    try {
      return new Intl.DisplayNames(['en'], { type: 'region' }).of(code.toUpperCase());
    } catch {
      return code;
    }
  };

  const getCountryFlag = (countryCode) => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    if (countryCode.includes('-') || countryCode.length > 2) return '🌍';
    try {
      const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
      return String.fromCodePoint(...codePoints);
    } catch {
      return '🌍';
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-green-500 animate-spin"></div>
          </div>
          <p className="text-gray-500 font-medium">Loading plan details…</p>
        </div>
      </div>
    );
  }

  if (!packageData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <Globe size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Package Not Found</h3>
          <p className="text-gray-500 mb-6 text-sm">This plan doesn't exist or has been removed.</p>
          <button
            onClick={() => router.push('/esim-plans')}
            className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
          >
            Browse Plans
          </button>
        </div>
      </div>
    );
  }

  const plan = activePlan || packageData;
  const countryName = plan.country_name || getCountryName(plan.country_code) || plan.name || 'eSIM Plan';
  const flag = urlCountryFlag || (plan.country_code ? getCountryFlag(plan.country_code) : '🌍');
  const originalPrice = parseFloat(plan.price);
  const discountPercent = regularSettings.discountPercentage || 10;
  let finalPrice = originalPrice * (100 - discountPercent) / 100;
  finalPrice = Math.max(regularSettings.minimumPrice || 0.5, finalPrice);

  return (
    <div className="min-h-screen bg-[#f7f7f8]" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Sticky Header ─────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-sm font-semibold text-gray-900">RoamJet eSIM</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pb-16 pt-0">

        {/* ── Hero Card ─────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4 rounded-3xl overflow-hidden shadow-md"
          style={{ background: 'linear-gradient(135deg, #1a3c2e 0%, #16a34a 60%, #22c55e 100%)' }}
        >
          <div className="p-6 pb-5">
            {/* Flag + country */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl drop-shadow-sm leading-none">{flag}</span>
              <div>
                <p className="text-green-200 text-xs font-semibold uppercase tracking-widest mb-0.5">eSIM Plan</p>
                <h1 className="text-white text-2xl font-extrabold leading-tight">{countryName}</h1>
              </div>
            </div>

            {/* Operator badge */}
            {(plan.operator_image_url || plan.operator) && (
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5 mb-5">
                {plan.operator_image_url && (
                  <img src={plan.operator_image_url} alt={plan.operator} className="h-5 w-auto object-contain" />
                )}
                {plan.operator && (
                  <span className="text-white/90 text-xs font-medium">{plan.operator}</span>
                )}
              </div>
            )}

            {/* Price row */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-green-200 text-xs mb-0.5">From</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-white text-4xl font-black">{formatDisplayPrice(finalPrice)}</span>
                  {discountPercent > 0 && (
                    <span className="text-green-300 text-sm line-through">{formatDisplayPrice(originalPrice)}</span>
                  )}
                </div>
              </div>
              {discountPercent > 0 && (
                <div className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1.5 rounded-full">
                  {discountPercent}% OFF
                </div>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div className="bg-white/10 backdrop-blur-sm grid grid-cols-3 divide-x divide-white/20">
            <div className="py-3 text-center">
              <Wifi className="w-4 h-4 text-green-200 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{formatData(plan.data, plan.dataUnit)}</p>
              <p className="text-green-200 text-xs">Data</p>
            </div>
            <div className="py-3 text-center">
              <Clock className="w-4 h-4 text-green-200 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{plan.period || plan.duration || 'N/A'} days</p>
              <p className="text-green-200 text-xs">Validity</p>
            </div>
            <div className="py-3 text-center">
              <Signal className="w-4 h-4 text-green-200 mx-auto mb-1" />
              <p className="text-white font-bold text-sm">{plan.speed || '4G/LTE'}</p>
              <p className="text-green-200 text-xs">Network</p>
            </div>
          </div>
        </motion.div>

        {/* ── Data Variant Selector ─────────────────────────────────────────── */}
        {availableVariants.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Choose your data</p>
            <div className="grid grid-cols-5 gap-2">
              {DATA_VARIANTS.map((gb) => {
                const isAvailable = availableVariants.includes(gb);
                const isSelected = selectedDataGB === gb;
                return (
                  <button
                    key={gb}
                    onClick={() => isAvailable && setSelectedDataGB(gb)}
                    disabled={!isAvailable}
                    className={`relative py-3 rounded-xl text-center font-bold text-sm transition-all duration-200 ${
                      isSelected
                        ? 'bg-green-500 text-white shadow-md shadow-green-200 scale-105'
                        : isAvailable
                          ? 'bg-gray-50 text-gray-700 border-2 border-gray-100 hover:border-green-300 hover:bg-green-50'
                          : 'bg-gray-50 text-gray-300 border-2 border-gray-100 cursor-not-allowed'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                    {gb}
                    <span className="block text-xs font-normal mt-0.5 opacity-75">GB</span>
                  </button>
                );
              })}
            </div>
            {plansLoading && (
              <p className="text-xs text-gray-400 text-center mt-2 flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Loading plans…
              </p>
            )}
          </motion.div>
        )}

        {/* ── What's Included ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">What's included</p>
          <div className="space-y-2.5">
            {[
              { icon: <Wifi className="w-4 h-4 text-green-500" />, label: `${formatData(plan.data, plan.dataUnit)} high-speed data` },
              { icon: <Clock className="w-4 h-4 text-green-500" />, label: `Valid for ${plan.period || plan.duration || 'N/A'} days` },
              { icon: <Signal className="w-4 h-4 text-green-500" />, label: `${plan.speed || '4G / LTE'} network` },
              { icon: <Zap className="w-4 h-4 text-green-500" />, label: 'Instant activation after purchase' },
              { icon: <Globe className="w-4 h-4 text-green-500" />, label: 'No roaming charges' },
              { icon: <Smartphone className="w-4 h-4 text-green-500" />, label: 'Compatible with all eSIM devices' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span className="text-sm text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Trust Badges ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-4 grid grid-cols-3 gap-3"
        >
          {[
            { icon: <Shield className="w-5 h-5 text-green-500" />, label: 'Secure Payment' },
            { icon: <Zap className="w-5 h-5 text-yellow-500" />, label: 'Instant QR Code' },
            { icon: <Star className="w-5 h-5 text-orange-400" />, label: '24/7 Support' },
          ].map((b, i) => (
            <div key={i} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-gray-100">
              <div className="flex justify-center mb-1.5">{b.icon}</div>
              <p className="text-xs font-semibold text-gray-600">{b.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Purchase Card ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          {/* Price summary */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Total price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-gray-900">{formatDisplayPrice(finalPrice)}</span>
                {discountPercent > 0 && (
                  <span className="text-sm text-gray-400 line-through">{formatDisplayPrice(originalPrice)}</span>
                )}
              </div>
            </div>
            {discountPercent > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 text-center">
                <p className="text-green-700 text-xs font-bold">Save {discountPercent}%</p>
                <p className="text-green-600 text-xs">{formatDisplayPrice(originalPrice - finalPrice)} off</p>
              </div>
            )}
          </div>

          {/* Refund checkbox */}
          <label className="flex items-start gap-3 mb-4 cursor-pointer group">
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                checked={acceptedRefund}
                onChange={(e) => setAcceptedRefund(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                acceptedRefund ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white group-hover:border-green-400'
              }`}>
                {acceptedRefund && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
            <span className="text-sm text-gray-600 leading-relaxed">
              I accept the{' '}
              <a
                href="https://esim.roamjet.net/refund-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 font-semibold hover:underline"
              >
                Refund Policy
              </a>
            </span>
          </label>

          {/* CTA Button */}
          <button
            onClick={() => handlePurchase('paddle')}
            disabled={!acceptedRefund || isProcessing}
            className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 ${
              !acceptedRefund || isProcessing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-200 active:scale-[0.98]'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Buy Now · {formatDisplayPrice(finalPrice)}
              </>
            )}
          </button>

          {/* Payment icons */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <Shield className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-xs text-gray-400">Secured by Paddle · Visa · Mastercard · Apple Pay</p>
          </div>
        </motion.div>

        {/* ── How It Works ──────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">How it works</p>
          <div className="space-y-4">
            {[
              { step: '1', title: 'Purchase', desc: 'Complete checkout in seconds with card or Apple Pay.', color: 'bg-green-500' },
              { step: '2', title: 'Receive QR code', desc: 'Get your eSIM QR code instantly by email.', color: 'bg-blue-500' },
              { step: '3', title: 'Scan & activate', desc: 'Scan the QR code in your phone settings to install.', color: 'bg-purple-500' },
              { step: '4', title: 'Connect on arrival', desc: 'Your data starts when you land. No waiting.', color: 'bg-orange-500' },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className={`${item.color} w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-black`}>
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
        >
          <div className="px-5 pt-5 pb-3 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-gray-400" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">FAQ</p>
          </div>
          <div className="divide-y divide-gray-50">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx}>
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-800 pr-4">{item.q}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-gray-500 leading-relaxed">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Footer note ───────────────────────────────────────────────────── */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Powered by <span className="font-semibold text-gray-500">RoamJet</span> · eSIM plans for 200+ countries
        </p>

      </div>
    </div>
  );
};

export default SharePackagePage;
