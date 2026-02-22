'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabase/config';
import { Search } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

import { getCountriesWithPricing, getAllPlans } from '../services/plansService';
import { getRegularSettings } from '../services/settingsService';
import { useI18n } from '../contexts/I18nContext';
import { detectPlatform, shouldRedirectToDownload, isMobileDevice } from '../utils/platformDetection';
import { getMobileCountries } from '../data/mobileCountries';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';
import { translateCountries } from '../utils/countryTranslations';
import { getFlagEmoji } from '../utils/countryFlags';
import toast from 'react-hot-toast';

// Country name aliases for better search
const countryAliases = {
  'United States': ['USA', 'US', 'America', 'United States of America'],
  'United Kingdom': ['UK', 'Britain', 'Great Britain', 'England'],
  'United Arab Emirates': ['UAE', 'Emirates'],
  'South Korea': ['Korea', 'ROK', 'Republic of Korea'],
  'Czech Republic': ['Czechia'],
  'Netherlands': ['Holland'],
  'Switzerland': ['Swiss'],
  'New Zealand': ['NZ'],
  'South Africa': ['RSA'],
  'Dominican Republic': ['DR'],
  'Costa Rica': ['CR']
};

// Helper function to check if search term matches country name or aliases
const matchesCountrySearch = (countryName, searchTerm) => {
  const lowerSearch = searchTerm.toLowerCase();
  const lowerCountry = countryName.toLowerCase();
  
  // Direct name match
  if (lowerCountry.includes(lowerSearch)) {
    return true;
  }
  
  // Check aliases
  const aliases = countryAliases[countryName] || [];
  return aliases.some(alias => alias.toLowerCase().includes(lowerSearch) || lowerSearch.includes(alias.toLowerCase()));
};



const EsimPlans = () => {
  const { t, locale } = useI18n();
  const { currentUser, userProfile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Debug authentication state
  console.log('🔍 EsimPlans: currentUser:', currentUser);
  console.log('🔍 EsimPlans: userProfile:', userProfile);
  console.log('🔍 EsimPlans: loading:', loading);
  
  // Determine if this is the dedicated plans page or landing page
  const isPlansPage = pathname === '/esim-plans' || pathname.includes('/esim-plans') || 
                      pathname.includes('/ar/esim-plans') || pathname.includes('/he/esim-plans') ||
                      pathname.includes('/ru/esim-plans') || pathname.includes('/de/esim-plans') ||
                      pathname.includes('/fr/esim-plans') || pathname.includes('/es/esim-plans');
  
  // Detect RTL language
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
  
  // Check if parent already has RTL direction set
  const parentHasRTL = typeof document !== 'undefined' && 
    document.querySelector('[dir="rtl"]') !== null;
  
  // Get search term from URL params
  const urlSearchTerm = searchParams.get('search') || '';
  const [searchTerm, setSearchTerm] = useState(urlSearchTerm);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [platformInfo, setPlatformInfo] = useState(null);
  
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Discount settings state
  const [regularSettings, setRegularSettings] = useState({ discountPercentage: 10, minimumPrice: 4 });
  
  // Simplified state - no sorting or grouping
  const [groupByDays, setGroupByDays] = useState(false); // Disable grouping by days

  // Sync search term with URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  // Platform detection and authentication check
  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatformInfo(detectedPlatform);
    
    // No automatic redirect - users can browse freely
    // They will be prompted to download app when they tap on countries
  }, [currentUser, router]);


  // Fetch discount settings
  useEffect(() => {
    const fetchDiscountSettings = async () => {
      try {
        const regular = await getRegularSettings();
        console.log('💰 Regular discount settings loaded:', regular);
        setRegularSettings(regular);
      } catch (error) {
        console.error('Error fetching discount settings:', error);
        // Keep default settings
      }
    };
    
    fetchDiscountSettings();
  }, []);

  // Fetch countries - ALWAYS use Firebase data for truth
  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ['countries-with-pricing', locale],
    queryFn: async () => {
      try {
        console.log('📊 Fetching REAL Firebase data for accurate pricing...');
        const countriesWithPricing = await getCountriesWithPricing();

        // Filter to show only countries with plans (minPrice < 999 indicates real data)
        const countriesWithRealPricing = countriesWithPricing.filter(country =>
          country.minPrice < 999 && country.plansCount > 0
        );

        // Sort by minimum price (cheapest first)
        countriesWithRealPricing.sort((a, b) => a.minPrice - b.minPrice);

        // Limit to 8 for home page, show all for plans page
        const limitedCountries = isPlansPage ? countriesWithRealPricing : countriesWithRealPricing.slice(0, 8);

        console.log('✅ USING REAL FIREBASE DATA - NO MORE LIES!');
        console.log('Real data sample prices:', limitedCountries.slice(0, 5).map(c => ({
          name: c.name,
          minPrice: c.minPrice
        })));
        return limitedCountries;
      } catch (error) {
        console.error('❌ FIREBASE ERROR:', error);
        // Return empty array if Firebase fails - no fallback to wrong hardcoded data
        console.log('🔄 Returning empty array - no fallback to incorrect hardcoded data');
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch global plans from Firebase
  const { data: globalPlanEntry } = useQuery({
    queryKey: ['global-plan-entry'],
    queryFn: async () => {
      try {
        console.log('🌐 Fetching global plans...');
        const allPlans = await getAllPlans();

        const globalPlans = allPlans.filter(plan => {
          const countryCodes = plan.country_codes || [];
          const planType = (plan.type || '').toLowerCase();
          const planRegion = (plan.region || plan.region_slug || '').toLowerCase();
          const planName = (plan.name || plan.title || '').toLowerCase();

          return (
            planType === 'global' ||
            planType === 'multi-country' ||
            planRegion === 'global' ||
            countryCodes.length > 10 ||
            planName.includes('global') ||
            planName.includes('worldwide') ||
            planName.includes('world')
          );
        });

        if (globalPlans.length === 0) return null;

        const validPrices = globalPlans
          .map(p => parseFloat(p.price))
          .filter(price => !isNaN(price) && price > 0);
        const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

        // Find the cheapest global plan for navigation
        const cheapestGlobal = globalPlans
          .filter(p => parseFloat(p.price) > 0)
          .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];

        console.log(`✅ Found ${globalPlans.length} global plans, min price: $${minPrice}`);
        return {
          id: 'global-plans',
          name: 'Global',
          code: 'GLOBAL',
          flagEmoji: '🌍',
          minPrice,
          plansCount: globalPlans.length,
          isGlobal: true,
          cheapestPlanId: cheapestGlobal?.id || null,
        };
      } catch (error) {
        console.error('❌ Error fetching global plans:', error);
        return null;
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });



  useEffect(() => {
    console.log('useEffect triggered:', {
      countriesData: countriesData?.length,
      countriesLoading,
      countriesError,
      globalPlanEntry: !!globalPlanEntry
    });

    if (countriesData) {
      console.log('Setting countries data:', countriesData);
      // Translate countries based on current locale
      const translatedCountries = translateCountries(countriesData, locale);

      // Prepend global plan entry at the top if available
      const withGlobal = globalPlanEntry
        ? [globalPlanEntry, ...translatedCountries]
        : translatedCountries;

      setCountries(withGlobal);
      setFilteredCountries(withGlobal);
    } else if (countriesError) {
      console.log('Firebase error, no data available:', countriesError);
      setCountries([]);
      setFilteredCountries([]);
    }
  }, [countriesData, countriesError, countriesLoading, locale, globalPlanEntry]);

  // Search function - uses hardcoded countries for landing, Firebase for plans page
  const searchCountries = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Landing pages: Use hardcoded countries
      if (!isPlansPage) {
        console.log('🏠 Landing search - Using hardcoded countries:', term);
        const mobileCountries = getMobileCountries(locale); // Pass locale for translation
        const searchResults = mobileCountries.filter(country => 
          matchesCountrySearch(country.name, term) ||
          country.code.toLowerCase().includes(term.toLowerCase())
        );
        // Countries are already translated by getMobileCountries
        setSearchResults(searchResults);
        setIsSearching(false);
        return;
      }
      
      console.log('📊 Plans page search - Using Supabase:', term);
      
      // Plans page: Search in Supabase
      const { data: countriesData } = await supabase
        .from('countries')
        .select('*')
        .eq('hidden', false);
      
      const supabaseResults = [];
      
      for (const countryData of (countriesData || [])) {
        if (matchesCountrySearch(countryData.name, term)) {
          const { data: plans } = await supabase
            .from('dataplans')
            .select('*')
            .contains('country_codes', [countryData.code])
            .eq('enabled', true)
            .eq('hidden', false);
          
          const validPrices = (plans || [])
            .map(plan => parseFloat(plan.price))
            .filter(price => !isNaN(price) && price > 0);
          
          const minPrice = validPrices.length > 0 
            ? Math.min(...validPrices)
            : null;
          
          supabaseResults.push({
            ...countryData,
            minPrice: minPrice,
            flagEmoji: getFlagEmoji(countryData.code)
          });
        }
      }
      
      console.log('Supabase search results:', supabaseResults.length);
      const translatedResults = translateCountries(supabaseResults, locale);
      setSearchResults(translatedResults);
      
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchCountries(searchTerm);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    }, 200); // 200ms debounce for faster response

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Helper function to calculate discounted price - ALWAYS use regular discount only
  const calculateDiscountedPrice = (originalPrice) => {
    if (!originalPrice || originalPrice <= 0) return originalPrice;
    
    // ALWAYS apply regular discount (for both landing pages and plans page)
    const discountPercentage = regularSettings.discountPercentage || 10;
    const minimumPrice = regularSettings.minimumPrice || 4;
    
    const discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
    return discountedPrice;
  };

  // Simple filter function with priority countries for plans page
  const filterCountries = (countriesList) => {
    // Priority countries for plans page
    const priorityCountries = [
      'United States', 'USA', 'South Korea', 'Korea', 'Japan',
      'Belgium', 'Spain', 'Canada', 'Portugal', 'Thailand'
    ];

    if (isPlansPage && !searchTerm) {
      // Separate global, priority countries, and others
      const global = [];
      const priority = [];
      const others = [];

      countriesList.forEach(country => {
        if (country.isGlobal) {
          global.push(country);
        } else {
          const isPriority = priorityCountries.some(pc =>
            country.name.toLowerCase().includes(pc.toLowerCase()) ||
            pc.toLowerCase().includes(country.name.toLowerCase())
          );

          if (isPriority) {
            priority.push(country);
          } else {
            others.push(country);
          }
        }
      });

      // Return global first, then priority countries, then others
      return [...global, ...priority, ...others];
    }

    return [...countriesList]; // Return countries as-is for other cases
  };


  // Filter countries based on search term
  useEffect(() => {
    let countriesToFilter = searchTerm ? searchResults : countries;
    let filtered = filterCountries(countriesToFilter);
    setFilteredCountries(filtered);
  }, [searchTerm, countries, searchResults]);

  const handleCountrySelect = async (country) => {
    console.log('🔍 DEBUG: handleCountrySelect called');
    console.log('🛒 User selected country:', country.name);

    // Handle global plan entry
    if (country.isGlobal) {
      if (country.cheapestPlanId) {
        let targetUrl = `/share-package/${country.cheapestPlanId}?country=GLOBAL&flag=🌍`;
        if (locale && locale !== 'en') {
          targetUrl = `/${locale}${targetUrl}`;
        }
        router.push(targetUrl);
      } else {
        toast.error('No global plans available');
      }
      return;
    }

    // Navigate directly to share-package page with 1GB auto-selected
    try {
      const { data: plansData } = await supabase
        .from('dataplans')
        .select('*')
        .contains('country_codes', [country.code])
        .eq('enabled', true)
        .eq('hidden', false);
      const plans = (plansData || []).map(p => ({ id: p.id, ...p }));

      // Find 1GB plan (cheapest), fallback to cheapest plan overall
      const oneGBPlan = plans
        .filter(p => parseFloat(p.data) === 1)
        .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
      const fallbackPlan = plans.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
      const targetPlan = oneGBPlan || fallbackPlan;

      if (targetPlan) {
        const countryFlag = country.flagEmoji || '🌍';
        let targetUrl = `/share-package/${targetPlan.id}?country=${country.code}&flag=${countryFlag}`;
        if (locale && locale !== 'en') {
          targetUrl = `/${locale}${targetUrl}`;
        }
        router.push(targetUrl);
      } else {
        toast.error('No plans available for this country');
      }
    } catch (error) {
      console.error('Error finding plans:', error);
      toast.error('Failed to load plans');
    }
  };



  // No fallback timeout - only show real Firebase data


  return (
    <>
      <section className="destination py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Active Search Badge */}
          {searchTerm && (
            <div className="mb-6 flex justify-center items-center gap-3">
              <span className="text-sm text-gray-600">
                {t('search.searchingFor', 'Searching for:')} <span className="font-semibold text-cobalt-blue">{searchTerm}</span>
              </span>
              <button
                onClick={() => {
                  setSearchTerm('');
                  router.push(pathname);
                }}
                className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors"
              >
                {t('search.clearSearch', 'Clear')}
              </button>
            </div>
          )}

        {/* Local eSIMs Content */}
        <div className={`tab-content ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={`tab-pane fade show active ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
              {/* Loading state for countries */}
              {countriesLoading && countries.length === 0 ? (
                <div className="flex justify-center items-center min-h-64">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tufts-blue"></div>
                  <p className="ml-4 text-gray-600">{t('plans.loadingPlans', 'Loading countries...')}</p>
                </div>
              ) : (
                <>
                  {/* Desktop Records Layout */}
                  <div className="hidden sm:block max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {(isPlansPage || searchTerm ? filteredCountries : filteredCountries.slice(0, 8)).map((country, index) => (
                        <button
                          key={country.id}
                          className="w-full px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                          onClick={() => handleCountrySelect(country)}
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {country.flagEmoji ? (
                                <span className="text-2xl">{country.flagEmoji}</span>
                              ) : (
                                <div className="w-8 h-8 bg-tufts-blue rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">
                                    {country.code || '??'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <h3 className="text-lg font-semibold text-gray-900">{country.name}</h3>
                              <p className="text-sm text-gray-500">{country.isGlobal ? `${country.plansCount} Plans • 200+ Countries` : '1GB • 7 Days'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {country.minPrice && country.minPrice < 999 ? (() => {
                              const originalPrice = country.minPrice;
                              const discountedPrice = calculateDiscountedPrice(originalPrice);
                              // Always show the minimum price of $4, never below
                              const finalPrice = Math.max(4, discountedPrice);
                              const hasDiscount = finalPrice < originalPrice;
                              return hasDiscount ? (
                                <div>
                                  <div className="text-lg font-semibold text-green-600">${finalPrice.toFixed(2)}</div>
                                  <div className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</div>
                                </div>
                              ) : (
                                <div className="text-lg font-semibold text-gray-900">${originalPrice.toFixed(2)}</div>
                              );
                            })() : (
                              <div className="text-lg font-medium text-gray-500">No plans</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Records Layout */}
                  <div className="sm:hidden">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      {(isPlansPage || searchTerm ? filteredCountries : filteredCountries.slice(0, 8)).map((country, index) => (
                        <button
                          key={country.id}
                          className="w-full px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                          onClick={() => handleCountrySelect(country)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {country.flagEmoji ? (
                                <span className="text-xl">{country.flagEmoji}</span>
                              ) : (
                                <div className="w-6 h-6 bg-tufts-blue rounded-full flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {country.code || '??'}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-left">
                              <h3 className="text-sm font-semibold text-gray-900">{country.name}</h3>
                              <p className="text-xs text-gray-500">{country.isGlobal ? `${country.plansCount} Plans • 200+ Countries` : '1GB • 7 Days'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {country.minPrice && country.minPrice < 999 ? (() => {
                              const originalPrice = country.minPrice;
                              const discountedPrice = calculateDiscountedPrice(originalPrice);
                              // Always show the minimum price of $4, never below
                              const finalPrice = Math.max(4, discountedPrice);
                              const hasDiscount = finalPrice < originalPrice;
                              return hasDiscount ? (
                                <div>
                                  <div className="text-sm font-semibold text-green-600">${finalPrice.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500 line-through">${originalPrice.toFixed(2)}</div>
                                </div>
                              ) : (
                                <div className="text-sm font-semibold text-gray-900">${originalPrice.toFixed(2)}</div>
                              );
                            })() : (
                              <div className="text-sm font-medium text-gray-500">No plans</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
          </div>
        </div>



        {/* Empty State */}
      </div>
    </section>

    </>
  );
};

export default EsimPlans;
