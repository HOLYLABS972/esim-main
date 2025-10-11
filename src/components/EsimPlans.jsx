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
import { mobileCountries, getCountryName } from '../data/mobileCountries';
import { esimService } from '../services/esimService';

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
    
    const emoji = String.fromCodePoint(...codePoints);
    // Return the emoji (even if it might not render properly - we'll handle that in the component)
    return emoji;
  } catch (error) {
    console.warn('Invalid country code: ' + countryCode, error);
    return '🌍';
  }
};

// Helper function to get country design data (flag, translations) from mobileCountries.js
const getCountryDesignData = (countryCode) => {
  return mobileCountries.find(country => country.code === countryCode) || null;
};

// Helper function to merge Airalo data with design data
const mergeCountryData = (airaloCountries, locale) => {
  return airaloCountries.map(airaloCountry => {
    const designData = getCountryDesignData(airaloCountry.code);
    
    return {
      ...airaloCountry,
      // Use design data flag emoji if available, otherwise generate it
      flagEmoji: designData?.flagEmoji || getFlagEmoji(airaloCountry.code),
      // Use translated name if available, otherwise use Airalo name
      displayName: getCountryName(airaloCountry.code, locale) || airaloCountry.name,
      // Keep original Airalo data
      originalName: airaloCountry.name,
      // Add design status (for future filtering if needed)
      hasDesignData: !!designData
    };
  });
};



const EsimPlans = () => {
  const { t, locale } = useI18n();
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine if this is the dedicated plans page or landing page
  const isPlansPage = pathname === '/esim-plans' || pathname.includes('/esim-plans');
  
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

  // Fetch countries - from Firebase countries collection (managed via Country Management)
  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ['countries-with-pricing', locale],
    queryFn: async () => {
      try {
        console.log('🌍 Fetching countries from Firebase...');
        
        // Fetch countries from Firebase (these have plan counts and prices from Country Management)
        const countriesQuery = query(
          collection(db, 'countries'),
          where('status', '==', 'active')
        );
        
        const countriesSnapshot = await getDocs(countriesQuery);
        const firebaseCountries = countriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log('📊 Fetched', firebaseCountries.length, 'countries from Firebase');
        
        // Merge with design data (translations, flags, etc.)
        const enhancedCountries = firebaseCountries.map(country => {
          const designData = getCountryDesignData(country.code);
          
          // Get display name with smart fallback logic
          let displayName = country.name;
          
          // Check if the name is just a 2-letter country code (uppercase)
          const isCountryCode = displayName && 
                                displayName.length === 2 && 
                                displayName === displayName.toUpperCase() &&
                                displayName === country.code;
          
          if (isCountryCode || !displayName) {
            // Name is missing or is just a code - use better fallbacks
            console.warn(`⚠️ Country ${country.code} has code as name ("${displayName}"), using fallbacks`);
            
            // Try translated name first
            displayName = country.translations?.[locale] || 
                         // Try getting name from mobileCountries.js
                         getCountryName(country.code, locale) ||
                         // Try designData name
                         designData?.name ||
                         // Last resort: use the code
                         country.code;
          } else {
            // Name looks good, but prefer translation if available
            displayName = country.translations?.[locale] || displayName;
          }
          
          return {
            ...country,
            // Use design data flag emoji if available, otherwise generate it
            flagEmoji: designData?.flagEmoji || country.flag || getFlagEmoji(country.code),
            // Use calculated display name
            displayName: displayName,
            // Keep original name
            originalName: country.name,
            // Add design status
            hasDesignData: !!designData
          };
        });
        
        // Sort by minimum price (cheapest first)
        enhancedCountries.sort((a, b) => (a.minPrice || 999) - (b.minPrice || 999));
        
        // Remove duplicates by country code - keep the one with the best price
        const uniqueCountries = [];
        const seenCodes = new Set();
        
        for (const country of enhancedCountries) {
          if (!seenCodes.has(country.code)) {
            seenCodes.add(country.code);
            uniqueCountries.push(country);
          } else {
            console.warn(`⚠️ Duplicate country code found: ${country.code} (${country.name}) - skipping duplicate`);
          }
        }
        
        console.log('✅ Enhanced countries with design data');
        console.log('🔍 Total enhanced countries:', enhancedCountries.length);
        console.log('🔍 After deduplication:', uniqueCountries.length);
        console.log('🔍 Sample enhanced data:', uniqueCountries.slice(0, 3).map(c => ({ 
          id: c.id,
          code: c.code,
          name: c.name,
          displayName: c.displayName,
          flagEmoji: c.flagEmoji,
          photo: c.photo,
          minPrice: c.minPrice,
          planCount: c.planCount,
          hasDesignData: c.hasDesignData,
          status: c.status
        })));
        
        // For now, show all active countries (even without prices)
        // This allows users to see countries before they're synced
        const activeCountries = uniqueCountries.filter(c => {
          const isActive = c.status === 'active' || c.isActive === true;
          
          if (!isActive) {
            return false;
          }
          
          return true; // Show all active countries
        });
        
        console.log('✅ Filtered to', activeCountries.length, 'active countries');
        
        return activeCountries;
      } catch (error) {
        console.error('❌ FIREBASE FETCH ERROR:', error);
        
        // Fallback: Use design data only (for development/offline)
        console.log('🔄 Falling back to design data only');
        const fallbackCountries = mobileCountries
          .filter(country => country.status === 'active')
          .map(country => ({
            ...country,
            displayName: getCountryName(country.code, locale) || country.name,
            originalName: country.name,
            hasDesignData: true,
            isFallback: true
          }));
        
        return fallbackCountries;
      }
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
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

  // Search function - searches through enhanced Airalo data
  const searchCountries = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching enhanced countries for:', term);
      
      // Search through the already loaded enhanced countries data
      if (countries && countries.length > 0) {
        const searchResults = countries.filter(country => {
          const searchLower = term.toLowerCase();
          return (
            // Search in display name (translated)
            country.displayName?.toLowerCase().includes(searchLower) ||
            // Search in original name (from Airalo)
            country.originalName?.toLowerCase().includes(searchLower) ||
            // Search in country code
            country.code?.toLowerCase().includes(searchLower) ||
            // Search in regular name field (fallback)
            country.name?.toLowerCase().includes(searchLower)
          );
        });
        
        console.log('✅ Found', searchResults.length, 'matching countries');
        setSearchResults(searchResults);
      } else {
        console.log('⚠️ No countries data available for search');
        setSearchResults([]);
      }
      
    } catch (error) {
      console.error('❌ Search error:', error);
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

  // Helper function to calculate discounted price (now using real Airalo prices)
  const calculateDiscountedPrice = (originalPrice) => {
    if (!originalPrice || originalPrice <= 0) return originalPrice;
    
    // Apply discount from settings to real Airalo prices
    const discountPercentage = regularSettings?.discountPercentage || 0;
    const minimumPrice = regularSettings?.minimumPrice || 0.5;
    
    console.log('💰 Price calculation:', {
      originalPrice,
      discountPercentage,
      minimumPrice,
      regularSettings
    });
    
    // If no discount, return original price
    if (discountPercentage === 0) {
      return originalPrice;
    }
    
    const discountedPrice = Math.max(minimumPrice, originalPrice * (100 - discountPercentage) / 100);
    return discountedPrice;
  };

  // Simple filter function with priority countries for plans page
  const filterCountries = (countriesList) => {
    // Priority country codes for plans page
    const priorityCountryCodes = [
      'US', 'KR', 'JP', 'BE', 'ES', 'CA', 'PT', 'TH', 
      'GB', 'DE', 'FR', 'IT', 'AU', 'SG'
    ];
    
    if (isPlansPage && !searchTerm) {
      // Separate priority countries and others
      const priority = [];
      const others = [];
      
      countriesList.forEach(country => {
        const isPriority = priorityCountryCodes.includes(country.code) ||
          priorityCountryCodes.some(pc => 
            country.displayName?.toLowerCase().includes(pc.toLowerCase()) ||
            country.originalName?.toLowerCase().includes(pc.toLowerCase()) ||
            country.name?.toLowerCase().includes(pc.toLowerCase())
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
    // Check if user is logged in first for all cases
    if (!currentUser) {
      // Non-logged users: use OneLink for smart routing
      if (typeof window !== 'undefined' && window.APPSFLYER_ONELINK_URL) {
        console.log('📱 Non-logged user - Opening AppsFlyer OneLink');
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
    
    // Logged-in users (both mobile and desktop): open bottom sheet with plans
    console.log('🛒 Logged-in user making purchase:', { 
      country: country.name,
      page: isPlansPage ? 'plans-page' : 'landing-page'
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
    <div className="min-h-screen bg-white pt-3 lg:pt-6">
      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-12">
          <div className="text-center">
            <h2 className="text-center text-lg lg:text-xl font-semibold text-tufts-blue">
              <span>{'{ '}</span>
              {t('plans.title', 'eSIM Plans')}
              <span>{' }'}</span>
            </h2>
            <p className="mx-auto mt-12 max-w-4xl text-center text-2xl lg:text-3xl font-semibold tracking-tight text-eerie-black sm:text-5xl">
              {t('plans.subtitle', 'Choose your perfect eSIM plan')}
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-center text-sm lg:text-base text-cool-black">
              {t('plans.description', 'Connect instantly with our global eSIM plans. No physical SIM card needed, just scan and go.')}
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mt-3 lg:mt-6">
          {/* Search Bar - Only show on plans page */}
          {isPlansPage && (
            <div className="flex flex-col md:flex-row gap-3 lg:gap-4 mb-6 lg:mb-8">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('plans.searchPlaceholder', 'Search countries...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 lg:py-3 border-0 shadow-lg rounded-full border-4 border-gray-200/40 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}
          
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
        </div>
      </section>

      {/* Countries Grid Section */}
      <section className="bg-white pb-12 lg:pb-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          {/* Loading state for countries */}
          {countriesLoading && countries.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 lg:h-12 lg:w-12 shadow-lg mx-auto"></div>
              <p className="mt-4 text-gray-600">{t('plans.loadingPlans', 'Loading countries...')}</p>
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-sm lg:text-base">
                {searchTerm 
                  ? t('plans.noCountriesFound', 'No countries found matching your search')
                  : t('plans.noCountriesAvailable', 'No countries available yet')
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Grid Layout */}
              <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-6">
                {(isPlansPage || searchTerm ? filteredCountries : filteredCountries.slice(0, 8)).map((country, index) => (
                  <button
                    key={country.id}
                    className="relative cursor-pointer group transition-transform duration-200"
                    onClick={() => handleCountrySelect(country)}
                  >
                    <div className="absolute inset-px rounded-xl bg-white shadow-lg border-2 border-gray-200/50"></div>
                    <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                      <div className="px-6 pt-6 pb-6 flex-1 flex flex-col">
                        <div className="country-flag-display text-center mb-4">
                          {country.photo && country.photo.includes('firebasestorage') ? (
                            <img 
                              src={country.photo} 
                              alt={country.displayName || country.name}
                              className="w-16 h-16 mx-auto rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                // If Firebase photo fails to load, hide it and show emoji
                                console.warn(`⚠️ Failed to load photo for ${country.code}: ${country.photo}`);
                                e.target.style.display = 'none';
                                // Replace with emoji
                                const parent = e.target.parentElement;
                                if (parent) {
                                  const emoji = getFlagEmoji(country.code);
                                  parent.innerHTML = `<span class="country-flag-emoji text-5xl">${emoji}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="country-flag-emoji text-5xl">
                              {getFlagEmoji(country.code)}
                            </span>
                          )}
                        </div>

                        <div className="esim-plan-card__content text-center flex-1 flex flex-col justify-between">
                          <h5 className="esim-plan-card__title text-lg lg:text-xl font-semibold tracking-tight text-eerie-black mb-3 line-clamp-2 group-hover:text-tufts-blue transition-colors duration-200">
                            {country.displayName || country.name}
                          </h5>
                          <div className="esim-plan-card__price text-tufts-blue font-medium">
                            {country.minPrice && country.minPrice > 0 ? (
                              <span className="text-lg font-semibold text-tufts-blue">
                                {t('plans.fromPrice', `From $${country.minPrice.toFixed(2)}`).replace('${price}', `$${country.minPrice.toFixed(2)}`)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-500">{t('plans.noPlansAvailable', 'No plans available')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute inset-px rounded-xl"></div>
                  </button>
                ))}
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
              
              {/* Mobile List Layout */}
              <div className="sm:hidden space-y-3">
                {(isPlansPage || searchTerm ? filteredCountries : filteredCountries.slice(0, 8)).map((country, index) => (
                  <button
                    key={country.id}
                    className="relative cursor-pointer group transition-transform duration-200 w-full"
                    onClick={() => handleCountrySelect(country)}
                  >
                    <div className="absolute inset-px rounded-xl bg-white shadow-lg border-2 border-gray-200/50"></div>
                    <div className="relative flex h-full overflow-hidden rounded-xl">
                      <div className="px-4 pt-4 pb-4 flex items-center space-x-4 w-full">
                        <div className="country-flag-display flex-shrink-0">
                          {country.photo && country.photo.includes('firebasestorage') ? (
                            <img 
                              src={country.photo} 
                              alt={country.displayName || country.name}
                              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                // If Firebase photo fails to load, hide it and show emoji
                                console.warn(`⚠️ Failed to load photo for ${country.code}: ${country.photo}`);
                                e.target.style.display = 'none';
                                // Replace with emoji
                                const parent = e.target.parentElement;
                                if (parent) {
                                  const emoji = getFlagEmoji(country.code);
                                  parent.innerHTML = `<span class="country-flag-emoji text-3xl">${emoji}</span>`;
                                }
                              }}
                            />
                          ) : (
                            <span className="country-flag-emoji text-3xl">
                              {getFlagEmoji(country.code)}
                            </span>
                          )}
                        </div>

                        <div className="esim-plan-card__content flex-1 text-left">
                          <h5 className="esim-plan-card__title text-base font-semibold tracking-tight text-eerie-black mb-1 group-hover:text-tufts-blue transition-colors duration-200">
                            {country.displayName || country.name}
                          </h5>
                          <div className="esim-plan-card__price text-tufts-blue font-medium text-sm">
                            {country.minPrice && country.minPrice > 0 ? (
                              t('plans.fromPrice', `From $${country.minPrice.toFixed(2)}`).replace('${price}', `$${country.minPrice.toFixed(2)}`)
                            ) : (
                              t('plans.noPlansAvailable', 'No plans available')
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400 group-hover:text-tufts-blue transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute inset-px rounded-xl"></div>
                  </button>
                ))}
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
      </section>

      {/* Plan Selection Bottom Sheet */}
      <PlanSelectionBottomSheet
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        availablePlans={availablePlans}
        loadingPlans={loadingPlans}
        filteredCountries={filteredCountries}
      />
    </div>
  );
};

export default EsimPlans;
