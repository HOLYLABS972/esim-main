'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Star, Check, DollarSign, SortAsc, Smartphone } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useAuth } from '../contexts/AuthContext';
import { getRegularSettings } from '../services/settingsService';
import { useRouter, usePathname } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';

const PlanCard = ({ plan, isSelected, onClick, index, regularSettings }) => {
  const { t, locale } = useI18n();
  const pathname = usePathname();
  
  // Get current language for RTL detection
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();
  const isRTL = getLanguageDirection(currentLanguage) === 'rtl';
  
  // Calculate discounted price - ALWAYS use regular discount only
  const originalPrice = parseFloat(plan.price);
  
  // Use regular discount only (not referral discount)
  const discountPercentage = regularSettings?.discountPercentage || 10;
  const minimumPrice = regularSettings?.minimumPrice || 4;
  const discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
  const hasDiscount = discountedPrice < originalPrice;
  
  console.log('💳 PlanCard calculation:', {
    planName: plan.name,
    originalPrice,
    discountPercentage,
    discountedPrice,
    hasDiscount,
    regularSettings
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-tufts-blue/30 hover:shadow-md ${
        isSelected 
          ? 'border-tufts-blue bg-tufts-blue/10 shadow-lg' 
          : 'border-gray-200 bg-white'
      }`}
      onClick={onClick}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div className={`absolute -top-2 ${isRTL ? '-left-2' : '-right-2'} bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full font-medium`}>
          <Star size={12} className={`inline ${isRTL ? 'ml-1' : 'mr-1'}`} />
          {t('planSelection.popular', 'Popular')}
        </div>
      )}


      {/* Plan Header */}
      <div className={`flex items-start justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
          <div className="flex-shrink-0 bg-tufts-blue/20 p-3 rounded-xl">
            <svg 
              className="w-8 h-8 text-tufts-blue" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zM4 6h16v12H4V6zm2 3h4v2H6V9zm6 0h4v2h-4V9zm-6 4h4v2H6v-2zm6 0h4v2h-4v-2z"/>
            </svg>
          </div>
          <div>
            <h3 className={`font-semibold text-gray-900 text-lg ${isRTL ? 'text-right' : 'text-left'}`}>{plan.name}</h3>
            <p className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{plan.description}</p>
            {plan.country_codes && plan.country_codes.length > 0 && (
              <div className={`flex items-center mt-1 ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
                <span className="text-lg">
                  {plan.country_codes.map(code => {
                    if (!code || code.length !== 2 || code.includes('-')) {
                      return '🌍';
                    }
                    try {
                      const codePoints = code.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
                      return String.fromCodePoint(...codePoints);
                    } catch (error) {
                      return '🌍';
                    }
                  }).join(' ')}
                </span>
                <span className={`text-xs text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {plan.country_codes.length > 1 ? t('planSelection.countries', '{{count}} countries', { count: plan.country_codes.length }) : plan.country_codes[0]}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className={isRTL ? 'text-left' : 'text-right'}>
          {hasDiscount ? (
            <div>
              <div className="text-2xl font-bold text-tufts-blue">${discountedPrice.toFixed(2)}</div>
              <div className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</div>
            </div>
          ) : (
            <div className="text-2xl font-bold text-tufts-blue">${originalPrice.toFixed(2)}</div>
          )}
          <div className="text-xs text-gray-500">{plan.currency || 'USD'}</div>
        </div>
      </div>

      {/* Plan Features */}
      <div className="space-y-2 mb-4">
        <div className={`flex items-center text-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
          {hasDiscount ? (
            <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium inline-flex items-center">
              <DollarSign size={12} className={`${isRTL ? 'ml-1' : 'mr-1'}`} />
              {t('planSelection.hotDeal', 'Hot Deal')}
            </div>
          ) : (
            <span>{plan.data} {plan.dataUnit}</span>
          )}
        </div>
        {plan.speed && (
          <div className={`flex items-center text-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
            <span>{t('planSelection.upTo', 'Up to {{speed}}', { speed: plan.speed })}</span>
          </div>
        )}
      </div>

      {/* Plan Benefits */}
      {plan.benefits && plan.benefits.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <div className="flex flex-wrap gap-2">
            {plan.benefits.map((benefit, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-1 bg-tufts-blue/20 text-tufts-blue-dark text-xs rounded-full"
              >
                <Check size={12} className={`${isRTL ? 'ml-1' : 'mr-1'}`} />
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}


    </motion.div>
  );
};

const PlanSelectionBottomSheet = ({ 
    isOpen, 
    onClose, 
    availablePlans, 
    loadingPlans,
    filteredCountries
  }) => {
  const { userProfile, currentUser, loading } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [regularSettings, setRegularSettings] = useState({ discountPercentage: 10, minimumPrice: 4 });
  
  // Debug authentication state
  console.log('🔍 PlanSelectionBottomSheet: currentUser:', currentUser);
  console.log('🔍 PlanSelectionBottomSheet: loading:', loading);
  
  // Get current language for RTL detection
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();
  const isRTL = getLanguageDirection(currentLanguage) === 'rtl';

  // Load regular settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const regular = await getRegularSettings();
        console.log('🎯 Bottom sheet loaded regular settings:', regular);
        setRegularSettings(regular);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    if (isOpen) {
      loadSettings();
      // Refresh settings every 5 seconds while bottom sheet is open
      const interval = setInterval(loadSettings, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Group countries by specific days (30, 7, 10, 15 days)
  const groupCountriesByDays = (countriesList) => {
    const targetDays = [30, 7, 10, 15];
    const groups = {};
    
    // Initialize groups for target days
    targetDays.forEach(day => {
      groups[day] = [];
    });
    
    // Add countries to appropriate day groups with recalculated min prices for specific days
    countriesList.forEach(country => {
      if (country.plans && country.plans.length > 0) {
        country.plans.forEach(plan => {
          const days = plan.period || plan.duration;
          if (targetDays.includes(days)) {
            // Calculate the actual minimum price for this specific day duration
            const dayPlans = country.plans.filter(p => (p.period || p.duration) === days);
            const dayMinPrice = dayPlans.length > 0 
              ? Math.min(...dayPlans.map(p => parseFloat(p.price) || 999))
              : 999;
            
            // Debug logging for price calculation
            if (dayPlans.length > 0 && dayMinPrice < 50) {
              console.log(`${country.name} - ${days} days plans:`, 
                dayPlans.map(p => ({ name: p.name, price: p.price, period: p.period, duration: p.duration })),
                'Min price:', dayMinPrice
              );
            }
            
            // Check if country already exists in this day group
            const existingCountry = groups[days].find(c => c.id === country.id);
            if (existingCountry) {
              // Update with the better (lower) price if this plan is cheaper
              if (dayMinPrice < existingCountry.dayMinPrice) {
                existingCountry.dayMinPrice = dayMinPrice;
              }
            } else {
              // Add country with the specific day's minimum price
              groups[days].push({
                ...country,
                dayMinPrice: dayMinPrice
              });
            }
          }
        });
      }
    });
    
    // Sort each group by the specific day's minimum price (cheapest first)
    Object.keys(groups).forEach(day => {
      groups[day].sort((a, b) => (a.dayMinPrice || a.minPrice) - (b.dayMinPrice || b.minPrice));
      
      // Debug logging for the first few countries in each group
      if (groups[day].length > 0) {
        console.log(`${day} days group - First 3 countries:`, 
          groups[day].slice(0, 3).map(c => ({ 
            name: c.name, 
            dayMinPrice: c.dayMinPrice, 
            minPrice: c.minPrice 
          }))
        );
      }
    });
    
    return groups;
  };


  // Sort plans by price (cheapest first)
  const sortPlansByPrice = (plans) => {
    return [...plans].sort((a, b) => {
      const priceA = parseFloat(a.price) || 999;
      const priceB = parseFloat(b.price) || 999;
      return priceA - priceB;
    });
  };

  const handlePlanSelect = (plan) => {
    console.log('🔍 DEBUG: handlePlanSelect called');
    console.log('🔍 DEBUG: currentUser:', currentUser);
    console.log('🔍 DEBUG: plan:', plan.name);
    console.log('🌐 DEBUG: locale:', locale);
    
    // Check if user is logged in
    if (!currentUser) {
      console.log('🔐 User not logged in, redirecting to login');
      
      // Store the intended destination to redirect back after login
      const countryCode = plan.country_codes?.[0] || plan.country_code;
      const countryFlag = countryCode ? (() => {
        const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
        return String.fromCodePoint(...codePoints);
      })() : '🌍';
      
      // Build return URL with language prefix
      let returnUrl = `/share-package/${plan.id}?country=${countryCode || ''}&flag=${countryFlag}`;
      
      // Get language prefix - use locale from context first, then pathname
      let langPrefix = '';
      if (locale && locale !== 'en') {
        langPrefix = `/${locale}`;
        returnUrl = `${langPrefix}${returnUrl}`;
      } else {
        // Fallback to pathname detection
      const langMatch = pathname.match(/^\/(ar|de|es|fr|he|ru)\//);
        langPrefix = langMatch ? `/${langMatch[1]}` : '';
        if (langPrefix) {
          returnUrl = `${langPrefix}${returnUrl}`;
        }
      }
      
      console.log('🔍 DEBUG: Redirecting to:', `${langPrefix}/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      // Redirect to login with return URL
      router.push(`${langPrefix}/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    
    // User is logged in, proceed to share package page
    console.log('✅ User logged in, proceeding to checkout');
    const countryCode = plan.country_codes?.[0] || plan.country_code;
    const countryFlag = countryCode ? (() => {
      const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
      return String.fromCodePoint(...codePoints);
    })() : '🌍';
    
    // Navigate to the share package page with country info and language prefix
    const params = new URLSearchParams({
      country: countryCode || '',
      flag: countryFlag
    });
    
    // Build URL with language prefix if needed
    let targetUrl = `/share-package/${plan.id}?${params.toString()}`;
    if (locale && locale !== 'en') {
      targetUrl = `/${locale}${targetUrl}`;
    }
    
    console.log('📦 Navigating to:', targetUrl);
    router.push(targetUrl);
  };


  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('planSelection.chooseYourPlan', 'Choose Your Plan')}
      maxHeight="85vh"
    >
      <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Available Plans or Countries */}
        {loadingPlans ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className={`text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>{t('planSelection.loadingPlans', 'Loading available plans...')}</p>
            <p className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>{t('planSelection.pleaseWait', 'Please wait while we fetch the best options for you')}</p>
          </div>
        ) : availablePlans.length > 0 ? (
          <div className="space-y-4">
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <Smartphone className="w-5 h-5 text-tufts-blue" />
                <h4 className={`font-semibold text-gray-900 text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('planSelection.availablePlans', 'Available Plans ({{count}})', { count: availablePlans.length })}
                </h4>
              </div>
              <div className={`flex items-center text-sm text-gray-500 ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
                <SortAsc className="w-4 h-4" />
                <span>{t('planSelection.sortedByCheapest', 'Sorted by cheapest first')}</span>
              </div>
            </div>
            
            {sortPlansByPrice(availablePlans).map((plan, index) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                index={index}
                regularSettings={regularSettings}
                onClick={() => handlePlanSelect(plan)}
              />
            ))}
          </div>
        ) : filteredCountries && filteredCountries.length > 0 ? (
          <div className="space-y-6">
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <Smartphone className="w-5 h-5 text-tufts-blue" />
                <h4 className={`font-semibold text-gray-900 text-lg ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('planSelection.availablePlans', 'Available Plans')}
                </h4>
              </div>
              <div className={`flex items-center text-sm text-gray-500 ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
                <SortAsc className="w-4 h-4" />
                <span>{t('planSelection.sortedByCheapest', 'Sorted by cheapest first')}</span>
              </div>
            </div>
            
            {/* Auto-grouped Display by Days */}
            {(() => {
              console.log('🔍 PlanSelectionBottomSheet - Data source check:');
              console.log('Filtered countries count:', filteredCountries?.length);
              console.log('Sample countries:', filteredCountries?.slice(0, 3).map(c => ({ 
                name: c.name, 
                minPrice: c.minPrice,
                hasPlans: !!c.plans?.length,
                plansCount: c.plans?.length || 0
              })));
              
              const grouped = groupCountriesByDays(filteredCountries);
              const orderedDays = [30, 7, 10, 15]; // Display order
              
              return orderedDays.map((days, groupIndex) => {
                const countries = grouped[days] || [];
                if (countries.length === 0) return null;
                
                return (
                  <div key={days} className="space-y-4">
                    {/* Divider and Header */}
                    {groupIndex > 0 && (
                      <div className="border-t border-gray-200 my-6"></div>
                    )}
                    
                    <div className="text-center">
                      <h5 className="text-xl font-bold text-gray-900">
                        {t('planSelection.dayPlans', '{{days}} Day{{plural}} Plans', { days, plural: days !== 1 ? 's' : '' })}
                      </h5>
                      <p className="text-sm text-gray-600 mt-1">
                        {t('planSelection.countriesAvailable', '{{count}} countr{{plural}} available', { 
                          count: countries.length, 
                          plural: countries.length === 1 ? 'y' : 'ies' 
                        })}
                      </p>
                    </div>
                    
                    {/* Countries Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {countries.map((country) => (
                        <div key={`${days}-${country.id}`} className="col-span-1">
                          <button
                            className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 text-left border border-gray-200 hover:border-tufts-blue/30 hover:scale-105"
                            onClick={() => {
                              // This would trigger loading plans for the country
                              console.log('Selected country:', country.name, 'for', days, 'days');
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="country-flag-display flex-shrink-0">
                                {country.flagEmoji ? (
                                  <span className="country-flag-emoji text-3xl">
                                    {country.flagEmoji}
                                  </span>
                                ) : (
                                  <div className="country-code-avatar w-10 h-10 bg-tufts-blue rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                      {country.code || '??'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <h6 className="font-semibold text-gray-900 text-sm mb-1">
                                  {country.name}
                                </h6>
                                <div className="flex items-center justify-between">
                                  <span className="text-tufts-blue font-bold text-lg">
                                    ${country.dayMinPrice ? country.dayMinPrice.toFixed(2) : (country.minPrice ? country.minPrice.toFixed(2) : '10.00')}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {t('planSelection.plansCount', '{{count}} plans', { count: country.plansCount || 0 })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe size={24} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('planSelection.noPlansAvailable', 'No Plans Available')}</h3>
            <p className="text-gray-600 mb-4">
              {t('planSelection.couldNotFind', 'We couldn\'t find any plans for your current selection')}
            </p>
            <p className="text-sm text-gray-500">
              {t('planSelection.tryAdjusting', 'Try adjusting your filters or selecting a different country')}
            </p>
          </div>
        )}

        {/* Bottom Spacing */}
        <div className="h-6" />
      </div>
    </BottomSheet>
  );
};

export default PlanSelectionBottomSheet;
