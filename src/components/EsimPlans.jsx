'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search } from 'lucide-react';
import PlanSelectionBottomSheet from './PlanSelectionBottomSheet';
import { getCountriesWithPricing, getPricingStats } from '../services/plansService';
import { useI18n } from '../contexts/I18nContext';

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
    console.warn(`Invalid country code: ${countryCode}`, error);
    return '🌍';
  }
};



const EsimPlans = () => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [showAllCountries, setShowAllCountries] = useState(false);
  
  // Plan selection and checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Simplified state - no sorting or grouping
  const [groupByDays, setGroupByDays] = useState(false); // Disable grouping by days

  // Fetch countries with real pricing from Firebase
  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ['countries-with-pricing'],
    queryFn: async () => {
      try {
        console.log('Fetching countries with real pricing from Firebase...');
        const countriesWithPricing = await getCountriesWithPricing();
        
        // Filter to show only countries with plans (minPrice < 999 indicates real data)
        const countriesWithRealPricing = countriesWithPricing.filter(country => 
          country.minPrice < 999 && country.plansCount > 0
        );
        
        // Sort by minimum price (cheapest first)
        countriesWithRealPricing.sort((a, b) => a.minPrice - b.minPrice);
        
        console.log('Fetched countries with real pricing:', countriesWithRealPricing.length);
        
        console.log('✅ USING REAL FIREBASE DATA');
        console.log('Real data sample prices:', countriesWithRealPricing.slice(0, 5).map(c => ({ 
          name: c.name, 
          minPrice: c.minPrice 
        })));
        return countriesWithRealPricing;
      } catch (error) {
        console.error('❌ FIREBASE ERROR:', error);
        return []; // Return empty array instead of fallback data
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch pricing statistics
  const { data: pricingStats, isLoading: statsLoading } = useQuery({
    queryKey: ['pricing-stats'],
    queryFn: async () => {
      try {
        return await getPricingStats();
      } catch (error) {
        console.error('Error fetching pricing stats:', error);
        return { totalPlans: 0, totalCountries: 0, averagePrice: 0, minPrice: 0, maxPrice: 0 };
      }
    },
    retry: 1,
    staleTime: 10 * 60 * 1000, // 10 minutes
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

  // Search function that only searches Firebase data
  const searchCountries = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for countries in Firebase:', term);
      
      // Search only in Firebase
      const querySnapshot = await getDocs(collection(db, 'countries'));
      const firebaseResults = [];
      
      for (const doc of querySnapshot.docs) {
        const countryData = { id: doc.id, ...doc.data() };
        
        // Check if country name matches search term
        if (countryData.name.toLowerCase().includes(term.toLowerCase())) {
          // Get plans for this country using country_codes array
          const plansQuery = query(collection(db, 'plans'), where('country_codes', 'array-contains', countryData.code));
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

  // Simple filter function - no sorting or grouping
  const filterCountries = (countriesList) => {
    return [...countriesList]; // Return countries as-is, already sorted by price from Firebase
  };


  // Filter countries based on search term
  useEffect(() => {
    let countriesToFilter = searchTerm ? searchResults : countries;
    let filtered = filterCountries(countriesToFilter);
    setFilteredCountries(filtered);
  }, [searchTerm, countries, searchResults]);

  const handleCountrySelect = async (country) => {
    setShowCheckoutModal(true);
    await loadAvailablePlansForCountry(country.code);
  };

  // Load available plans for a specific country
  const loadAvailablePlansForCountry = async (countryCode) => {
    setLoadingPlans(true);
    try {
      // Query for plans that include this country
      const plansQuery = query(
        collection(db, 'plans'),
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
          {/* Header */}
          <div className="destination-top mb-8">
            {/* Plans Counter and Stats */}
            {pricingStats && !statsLoading && (
              <div className="text-center mb-8">
                <div className="bg-white rounded-2xl shadow-lg p-6 max-w-4xl mx-auto">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-tufts-blue">{pricingStats.totalPlans}</div>
                      <div className="text-sm text-gray-600">{t('plans.totalPlans', 'Total Plans')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-tufts-blue">{pricingStats.totalCountries}</div>
                      <div className="text-sm text-gray-600">{t('plans.countries', 'Countries')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-tufts-blue">${pricingStats.minPrice}</div>
                      <div className="text-sm text-gray-600">{t('plans.startingFrom', 'Starting From')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-tufts-blue">${pricingStats.averagePrice}</div>
                      <div className="text-sm text-gray-600">{t('plans.averagePrice', 'Average Price')}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Search Box */}
          <div className="search-box max-w-md mx-auto mb-8">
            <div className="search-box-field relative">
              <input
                className="search-box-field__input w-full px-4 py-3 pr-12 border border-jordy-blue rounded-full focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                type="text"
                placeholder={t('search.destinationPlaceholder', 'Search your destination (e.g., France, Germany, United States)')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="search-box-field__icon absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                {isSearching ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-tufts-blue"></div>
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </span>
            </div>
            {searchTerm && (
              <div className="text-center mt-2 text-sm text-gray-500">
                {isSearching ? (
                  t('search.searching', 'Searching...')
                ) : searchResults.length > 0 ? (
                  t('search.foundDestinations', `Found ${searchResults.length} ${searchResults.length === 1 ? 'destination' : 'destinations'}`, { count: searchResults.length })
                ) : searchTerm.length >= 2 ? (
                  t('search.noDestinationsFound', `No destinations found for "${searchTerm}"`, { searchTerm })
                ) : (
                  t('search.typeToSearch', 'Type at least 2 characters to search')
                )}
              </div>
            )}
          </div>


        </div>

        {/* Local eSIMs Content */}
        <div className="tab-content">
          <div className="tab-pane fade show active">
              {/* Loading state for countries */}
              {countriesLoading && countries.length === 0 ? (
                <div className="flex justify-center items-center min-h-64">
                  <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tufts-blue"></div>
                  <p className="ml-4 text-gray-600">Loading countries...</p>
                </div>
              ) : (
                <>
                  {/* Desktop Grid Layout */}
                  <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-center">
                    {(showAllCountries || searchTerm ? filteredCountries : filteredCountries.slice(0, 8)).map((country, index) => (
                      <div
                        key={country.id}
                        className="col-span-1"
                      >
                        <button
                          className="esim-plan-card w-full bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 text-left border border-gray-100 hover:border-blue-200"
                          onClick={() => handleCountrySelect(country)}
                        >
                          <div className="country-flag-display text-center mb-4">
                            {country.flagEmoji ? (
                              <span className="country-flag-emoji text-5xl">
                                {country.flagEmoji}
                              </span>
                            ) : (
                              <div className="country-code-avatar w-16 h-16 mx-auto bg-tufts-blue rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-bold text-lg">
                                  {country.code || '??'}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="esim-plan-card__content text-center">
                            <h5 className="esim-plan-card__title text-lg font-semibold text-gray-900 mb-2">
                              {country.name}
                            </h5>
                            <span className="esim-plan-card__price text-tufts-blue font-medium">
                              {country.minPrice ? t('plans.fromPrice', `From $${country.minPrice.toFixed(2)}`).replace('${price}', `$${country.minPrice.toFixed(2)}`) : t('plans.noPlansAvailable', 'No plans available')}
                            </span>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {/* Mobile List Layout */}
                  <div className="sm:hidden space-y-3">
                    {(showAllCountries || searchTerm ? filteredCountries : filteredCountries.slice(0, 8)).map((country, index) => (
                      <button
                        key={country.id}
                        className="esim-plan-card w-full bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-4 text-left border border-gray-100 hover:border-blue-200 flex items-center space-x-4"
                        onClick={() => handleCountrySelect(country)}
                      >
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

                        <div className="esim-plan-card__content flex-1 text-left">
                          <h5 className="esim-plan-card__title text-base font-semibold text-gray-900 mb-1">
                            {country.name}
                          </h5>
                          <span className="esim-plan-card__price text-tufts-blue font-medium text-sm">
                            {country.minPrice ? t('plans.fromPrice', `From $${country.minPrice.toFixed(2)}`).replace('${price}', `$${country.minPrice.toFixed(2)}`) : t('plans.noPlansAvailable', 'No plans available')}
                          </span>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                  
                  {/* Show All Button for Countries */}
                  {!searchTerm && filteredCountries.length > 8 && (
                    <div className="text-center mt-8">
                      <button
                        onClick={() => setShowAllCountries(!showAllCountries)}
                        className="btn-primary px-8 py-3 text-white font-semibold rounded-full hover:bg-tufts-blue transition-all duration-200 shadow-lg"
                      >
                        {showAllCountries ? t('plans.showLess', 'Show Less') : t('plans.showAll', 'Show All')}
                      </button>
                    </div>
                  )}
                </>
              )}
          </div>
        </div>



        {/* Empty State */}
        {filteredCountries.length === 0 && !countriesLoading && searchTerm && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No countries found matching "{searchTerm}"
            </p>
          </div>
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
    </>
  );
};

export default EsimPlans;
