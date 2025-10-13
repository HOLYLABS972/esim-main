'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import PlanSelectionBottomSheet from './PlanSelectionBottomSheet';
import { getCountriesWithPricing } from '../services/plansService';
import { getRegularSettings } from '../services/settingsService';
import { useI18n } from '../contexts/I18nContext';
import { detectPlatform, shouldRedirectToDownload, isMobileDevice } from '../utils/platformDetection';
import { getMobileCountries } from '../data/mobileCountries';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
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
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
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
  
  // Plan selection and checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Discount settings state
  const [regularSettings, setRegularSettings] = useState({ discountPercentage: 10, minimumPrice: 0.5 });
  
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

  // Fetch regular discount settings
  useEffect(() => {
    const fetchDiscountSettings = async () => {
      try {
        const settings = await getRegularSettings();
        console.log('💰 Regular discount settings loaded:', settings);
        setRegularSettings(settings);
      } catch (error) {
        console.error('Error fetching regular discount settings:', error);
        // Keep default settings
      }
    };
    
    fetchDiscountSettings();
  }, []);

  // Fetch countries - use hardcoded for landing pages, Firebase for dedicated plans page
  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ['countries-with-pricing', isPlansPage],
    queryFn: async () => {
      // Landing pages: Always use hardcoded countries
      if (!isPlansPage) {
        console.log('🏠 Landing page - Using hardcoded countries');
        const mobileCountries = getMobileCountries();
        
        // Sort by minimum price (cheapest first)
        mobileCountries.sort((a, b) => a.minPrice - b.minPrice);
        
        console.log('✅ USING HARDCODED COUNTRIES FOR LANDING');
        return mobileCountries;
      }
      
      // Plans page: Always use Firebase data
      try {
        console.log('📊 Plans page - Fetching real Firebase data (limited to 8)...');
        const countriesWithPricing = await getCountriesWithPricing();
        
        // Filter to show only countries with plans (minPrice < 999 indicates real data)
        const countriesWithRealPricing = countriesWithPricing.filter(country => 
          country.minPrice < 999 && country.plansCount > 0
        );
        
        // Sort by minimum price (cheapest first) and limit to 8
        countriesWithRealPricing.sort((a, b) => a.minPrice - b.minPrice);
        const limitedCountries = countriesWithRealPricing.slice(0, 8);
        
        console.log('✅ USING REAL FIREBASE DATA FOR PLANS PAGE (limited to 8)');
        console.log('Real data sample prices:', limitedCountries.map(c => ({ 
          name: c.name, 
          minPrice: c.minPrice 
        })));
        return limitedCountries;
      } catch (error) {
        console.error('❌ FIREBASE ERROR:', error);
        // Fallback to hardcoded countries if Firebase fails
        console.log('🔄 Falling back to hardcoded countries');
        const mobileCountries = getMobileCountries();
        mobileCountries.sort((a, b) => a.minPrice - b.minPrice);
        return mobileCountries.slice(0, 8); // Also limit fallback to 8
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });



  useEffect(() => {
    console.log('useEffect triggered:', { 
      countriesData: countriesData?.length, 
      countriesLoading, 
      countriesError
    });
    
    if (countriesData) {
      console.log('Setting countries data:', countriesData);
      setCountries(countriesData);
      setFilteredCountries(countriesData);
    } else if (countriesError) {
      console.log('Firebase error, no data available:', countriesError);
      setCountries([]);
      setFilteredCountries([]);
    }
  }, [countriesData, countriesError, countriesLoading]);

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
        const mobileCountries = getMobileCountries();
        const searchResults = mobileCountries.filter(country => 
          matchesCountrySearch(country.name, term) ||
          country.code.toLowerCase().includes(term.toLowerCase())
        );
        setSearchResults(searchResults);
        setIsSearching(false);
        return;
      }
      
      console.log('📊 Plans page search - Using Firebase:', term);
      
      // Plans page: Search in Firebase
      const querySnapshot = await getDocs(collection(db, 'countries'));
      const firebaseResults = [];
      
      for (const doc of querySnapshot.docs) {
        const countryData = { id: doc.id, ...doc.data() };
        
        // Check if country name matches search term (including aliases)
        if (matchesCountrySearch(countryData.name, term)) {
          // Get plans for this country using country_codes array
          const plansQuery = query(collection(db, 'dataplans'), where('country_codes', 'array-contains', countryData.code));
          const plansSnapshot = await getDocs(plansQuery);
          const plans = plansSnapshot.docs.map(planDoc => planDoc.data());
          
          // Filter out plans with invalid prices and calculate minimum
          const validPrices = plans
            .map(plan => parseFloat(plan.price))
            .filter(price => !isNaN(price) && price > 0);
          
          const minPrice = validPrices.length > 0 
            ? Math.min(...validPrices)
            : null; // Use null instead of 999 fallback
          
          // Debug logging
          console.log(`🔍 Search result for ${countryData.name}:`, {
            plansFound: plans.length,
            validPrices: validPrices.length,
            minPrice: minPrice,
            allPrices: plans.map(p => p.price)
          });
          
          firebaseResults.push({
            ...countryData,
            minPrice: minPrice,
            flagEmoji: getFlagEmoji(countryData.code)
          });
        }
      }
      
      console.log('Firebase search results:', firebaseResults.length);
      setSearchResults(firebaseResults);
      
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

  // Helper function to calculate discounted price
  const calculateDiscountedPrice = (originalPrice) => {
    if (!originalPrice || originalPrice <= 0) return originalPrice;
    
    // For landing pages, the price is already discounted in hardcoded data
    if (!isPlansPage) {
      return originalPrice; // Return the already discounted price
    }
    
    // For plans page, apply discount from settings
    const discountPercentage = regularSettings.discountPercentage || 10;
    const minimumPrice = regularSettings.minimumPrice || 0.5;
    
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
      // Separate priority countries and others
      const priority = [];
      const others = [];
      
      countriesList.forEach(country => {
        const isPriority = priorityCountries.some(pc => 
          country.name.toLowerCase().includes(pc.toLowerCase()) ||
          pc.toLowerCase().includes(country.name.toLowerCase())
        );
        
        if (isPriority) {
          priority.push(country);
        } else {
          others.push(country);
        }
      });
      
      // Return priority countries first, then others
      return [...priority, ...others];
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
    // Landing page: ALWAYS redirect to app download (OneLink)
    if (!isPlansPage) {
      console.log('🏠 Landing page - Redirecting to app download via OneLink');
      if (typeof window !== 'undefined' && window.APPSFLYER_ONELINK_URL) {
        console.log('📱 Opening AppsFlyer OneLink for:', country.name);
        window.open(window.APPSFLYER_ONELINK_URL, '_blank');
        return;
      }
      
      // Fallback: scroll to download section if OneLink not ready
      console.log('🖥️ OneLink not ready, scrolling to download section');
      const downloadSection = document.getElementById('how-it-works');
      if (downloadSection) {
        downloadSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/#how-it-works');
      }
      return;
    }
    
    // Plans page: Check if user is logged in
    if (!currentUser) {
      // Non-logged users on plans page: use OneLink for smart routing
      if (typeof window !== 'undefined' && window.APPSFLYER_ONELINK_URL) {
        console.log('📱 Plans page non-logged user - Opening AppsFlyer OneLink');
        window.open(window.APPSFLYER_ONELINK_URL, '_blank');
        return;
      }
      
      // Fallback: scroll to download section if OneLink not ready
      console.log('🖥️ Non-logged user - OneLink not ready, scrolling to download section');
      const downloadSection = document.getElementById('how-it-works');
      if (downloadSection) {
        downloadSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/#how-it-works');
      }
      return;
    }
    
    // Logged-in users on plans page: open bottom sheet with plans
    console.log('🛒 Logged-in user making purchase:', { 
      country: country.name,
      page: 'plans-page'
    });
    setShowCheckoutModal(true);
    setLoadingPlans(true);
    await loadAvailablePlansForCountry(country.code);
  };

  // Load available plans for a specific country
  const loadAvailablePlansForCountry = async (countryCode) => {
    try {
      // Query for plans that include this country
      const plansQuery = query(
        collection(db, 'dataplans'),
        where('country_codes', 'array-contains', countryCode)
      );
      const querySnapshot = await getDocs(plansQuery);
      
      const plans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out disabled plans (enabled !== false means enabled by default)
      const enabledPlans = plans.filter(plan => plan.enabled !== false);
      
      setAvailablePlans(enabledPlans);
    } catch (error) {
      console.error('Error loading plans for country:', error);
      setAvailablePlans([]);
    } finally {
      setLoadingPlans(false);
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
                              <p className="text-sm text-gray-500">1GB • 7 Days</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {country.minPrice ? (() => {
                              const discountedPrice = calculateDiscountedPrice(country.minPrice);
                              const originalPrice = country.originalPrice || country.minPrice;
                              const hasDiscount = discountedPrice < originalPrice;
                              return hasDiscount ? (
                                <div>
                                  <div className="text-lg font-semibold text-green-600">${discountedPrice.toFixed(2)}</div>
                                  <div className="text-sm text-gray-500 line-through">${originalPrice.toFixed(2)}</div>
                                </div>
                              ) : (
                                <div className="text-lg font-semibold text-gray-900">${country.minPrice.toFixed(2)}</div>
                              );
                            })() : (
                              <div className="text-lg font-medium text-gray-500">No plans</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Show All Button for Desktop - Only on Landing Page */}
                  {!isPlansPage && !searchTerm && filteredCountries.length > 8 && (
                    <div className="hidden sm:block text-center mt-8">
                      <button
                        onClick={() => router.push('/esim-plans')}
                        className="btn-primary px-8 py-3 text-white font-semibold rounded-full hover:bg-tufts-blue transition-all duration-200 shadow-lg"
                      >
                        {t('plans.showAll', 'Show All')}
                      </button>
                    </div>
                  )}
                  
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
                              <p className="text-xs text-gray-500">1GB • 7 Days</p>
                            </div>
                          </div>
                          <div className="text-right">
                            {country.minPrice ? (() => {
                              const discountedPrice = calculateDiscountedPrice(country.minPrice);
                              const originalPrice = country.originalPrice || country.minPrice;
                              const hasDiscount = discountedPrice < originalPrice;
                              return hasDiscount ? (
                                <div>
                                  <div className="text-sm font-semibold text-green-600">${discountedPrice.toFixed(2)}</div>
                                  <div className="text-xs text-gray-500 line-through">${originalPrice.toFixed(2)}</div>
                                </div>
                              ) : (
                                <div className="text-sm font-semibold text-gray-900">${country.minPrice.toFixed(2)}</div>
                              );
                            })() : (
                              <div className="text-sm font-medium text-gray-500">No plans</div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Show All Button for Mobile - Only on Landing Page */}
                  {!isPlansPage && !searchTerm && filteredCountries.length > 8 && (
                    <div className="sm:hidden text-center mt-8">
                      <button
                        onClick={() => router.push('/esim-plans')}
                        className="btn-primary px-8 py-3 text-white font-semibold rounded-full hover:bg-tufts-blue transition-all duration-200 shadow-lg"
                      >
                        {t('plans.showAll', 'Show All')}
                      </button>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>



        {/* Empty State */}
      </div>
    </section>

    {/* Plan Selection Bottom Sheet */}
    <PlanSelectionBottomSheet
      isOpen={showCheckoutModal}
      onClose={() => setShowCheckoutModal(false)}
      availablePlans={availablePlans}
      loadingPlans={loadingPlans}
      filteredCountries={filteredCountries}
    />
    </>
  );
};

export default EsimPlans;
