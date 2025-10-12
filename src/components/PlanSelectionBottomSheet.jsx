'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Star, Check, DollarSign, SortAsc, Smartphone, Wifi, Clock, Shield } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useAuth } from '../contexts/AuthContext';
import { getReferralSettings, getRegularSettings } from '../services/settingsService';
import { useRouter, usePathname } from 'next/navigation';
import { useI18n } from '../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';

const PlanCard = ({ plan, isSelected, onClick, index, hasReferralDiscount, referralSettings, regularSettings }) => {
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
  
  // Calculate discounted price based on user type
  const originalPrice = parseFloat(plan.price);
  
  let discountedPrice, hasDiscount, discountPercentage;
  
  if (hasReferralDiscount && referralSettings) {
    discountPercentage = referralSettings.discountPercentage;
    const minimumPrice = referralSettings.minimumPrice;
    discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
    hasDiscount = discountedPrice < originalPrice;
  } else if (regularSettings) {
    discountPercentage = regularSettings.discountPercentage;
    const minimumPrice = regularSettings.minimumPrice;
    discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
    hasDiscount = discountedPrice < originalPrice;
  }

  return (
    <div className="relative" onClick={onClick}>
      <div className="absolute inset-px rounded-xl border-2 border-gray-200/50 shadow-xl shadow-gray-200/50 bg-white hover:border-tufts-blue/30 transition-all duration-200 cursor-pointer"></div>
      <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
        <div className="px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-6">
          <div className={`flex flex-col gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Plan Header */}
            <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-start gap-3 flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 bg-tufts-blue/10 p-3 rounded-xl">
                  <Wifi className="w-6 h-6 text-tufts-blue" />
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold text-eerie-black text-lg tracking-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className={`text-sm text-cool-black mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {plan.description}
                    </p>
                  )}
                  {plan.country_codes && plan.country_codes.length > 0 && (
                    <div className={`flex items-center mt-2 gap-1 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      <span className="text-lg">
                        {plan.country_codes.map(code => {
                          if (!code || code.length !== 2 || code.includes('-')) return '🌍';
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
              
              {/* Price Section */}
              <div className={`flex flex-col items-end ${isRTL ? 'items-start' : ''}`}>
                {hasDiscount ? (
                  <div className={`flex flex-col ${isRTL ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-green-600">${discountedPrice.toFixed(2)}</span>
                      {hasDiscount && (
                        <div className="flex bg-cobalt-blue rounded-full px-2 py-1">
                          <span className="text-xs text-white font-medium whitespace-nowrap">
                            Save {discountPercentage}%
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-eerie-black">${originalPrice.toFixed(2)}</span>
                )}
                <span className="text-xs text-gray-500 mt-1">{plan.currency || 'USD'}</span>
              </div>
            </div>

            {/* Plan Details Grid */}
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">{t('planSelection.data', 'Data')}</div>
                <div className="font-semibold text-eerie-black">{plan.data} {plan.dataUnit}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-gray-600 mb-1">{t('planSelection.validity', 'Validity')}</div>
                <div className="font-semibold text-eerie-black">{plan.period || plan.duration || 'N/A'} days</div>
              </div>
            </div>

            {/* Plan Benefits */}
            {plan.benefits && plan.benefits.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {plan.benefits.slice(0, 3).map((benefit, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200"
                  >
                    <Check size={12} className={`${isRTL ? 'ml-1' : 'mr-1'}`} />
                    {benefit}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
    </div>
  );
};

const PlanSelectionBottomSheet = ({ 
  isOpen, 
  onClose, 
  availablePlans, 
  loadingPlans,
  filteredCountries
}) => {
  const { userProfile } = useAuth();
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [referralSettings, setReferralSettings] = useState({ discountPercentage: 17, minimumPrice: 0.5 });
  const [regularSettings, setRegularSettings] = useState({ discountPercentage: 10, minimumPrice: 0.5 });
  
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

  // Load both referral and regular settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [referral, regular] = await Promise.all([
          getReferralSettings(),
          getRegularSettings()
        ]);
        console.log('🎯 Bottom sheet loaded referral settings:', referral);
        console.log('🎯 Bottom sheet loaded regular settings:', regular);
        setReferralSettings(referral);
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
    // Get country flag and code for the plan
    const countryCode = plan.country_codes?.[0] || plan.country_code;
    const countryFlag = countryCode ? (() => {
      const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
      return String.fromCodePoint(...codePoints);
    })() : '🌍';
    
    // Navigate to the share package page with country info
    const params = new URLSearchParams({
      country: countryCode || '',
      flag: countryFlag
    });
    
    router.push(`/share-package/${plan.id}?${params.toString()}`);
  };


  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={t('planSelection.chooseYourPlan', 'Choose Your Plan')}
      maxHeight="85vh"
      variant="center"
    >
      <div className="p-4 lg:p-6" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Available Plans or Countries */}
        {loadingPlans ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tufts-blue mx-auto mb-4"></div>
            <p className={`text-eerie-black font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('planSelection.loadingPlans', 'Loading available plans...')}</p>
            <p className={`text-sm text-cool-black mt-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t('planSelection.pleaseWait', 'Please wait while we fetch the best options for you')}</p>
          </div>
        ) : availablePlans.length > 0 ? (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-px rounded-xl border-2 border-gray-200/50 shadow-sm bg-gray-50"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                <div className="px-4 py-3 md:px-6 md:py-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Smartphone className="w-5 h-5 text-tufts-blue" />
                      <h4 className={`font-semibold text-eerie-black text-base ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t('planSelection.availablePlans', 'Available Plans ({{count}})', { count: availablePlans.length })}
                      </h4>
                    </div>
                    <div className={`flex items-center text-sm text-cool-black gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <SortAsc className="w-4 h-4 text-tufts-blue" />
                      <span className="text-xs">{t('planSelection.sortedByCheapest', 'Sorted by cheapest')}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
            </div>
            
            <div className="space-y-4 mt-4">
              {sortPlansByPrice(availablePlans).map((plan, index) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  index={index}
                  hasReferralDiscount={userProfile?.referralCodeUsed}
                  referralSettings={referralSettings}
                  regularSettings={regularSettings}
                  onClick={() => handlePlanSelect(plan)}
                />
              ))}
            </div>
          </div>
        ) : filteredCountries && filteredCountries.length > 0 ? (
          <div className="space-y-6">
            <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
                <Smartphone className="w-5 h-5 text-tufts-blue" />
                <h4 className={`font-semibold text-gray-900 text-base ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('planSelection.availablePlans', 'Available Plans')}
                </h4>
              </div>
              <div className={`flex items-center text-sm text-gray-500 ${isRTL ? 'space-x-reverse space-x-1' : 'space-x-1'}`}>
                <SortAsc className="w-4 h-4 text-tufts-blue" />
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
                      <h5 className="text-base font-bold text-gray-900">
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
                            className="w-full bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-4 text-left border border-gray-200 hover:border-blue-300 hover:scale-105"
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
                                    <span className="text-white font-bold text-xs">
                                      {country.code || '??'}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 text-left">
                                <h6 className="font-semibold text-gray-900 text-xs mb-1">
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
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe size={24} className="text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">{t('planSelection.noPlansAvailable', 'No Plans Available')}</h3>
            <p className="text-xs text-gray-600 mb-4">
              {t('planSelection.couldNotFind', 'We couldn\'t find any plans for your current selection')}
            </p>
            <p className="text-xs text-gray-500 mb-4">
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
