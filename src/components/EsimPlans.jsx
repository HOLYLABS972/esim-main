'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Search } from 'lucide-react';
import PlanSelectionBottomSheet from './PlanSelectionBottomSheet';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return null;
  
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt());
  
  return String.fromCodePoint(...codePoints);
};

// Standard 8 countries list
const getStandardCountries = () => {
  return [
    { id: '1', name: 'Germany', code: 'DE', minPrice: 2.99, flagEmoji: getFlagEmoji('DE') },
    { id: '2', name: 'Netherlands', code: 'NL', minPrice: 2.79, flagEmoji: getFlagEmoji('NL') },
    { id: '3', name: 'United Kingdom', code: 'GB', minPrice: 3.99, flagEmoji: getFlagEmoji('GB') },
    { id: '4', name: 'United States', code: 'US', minPrice: 4.99, flagEmoji: getFlagEmoji('US') },
    { id: '5', name: 'Canada', code: 'CA', minPrice: 3.99, flagEmoji: getFlagEmoji('CA') },
    { id: '6', name: 'Australia', code: 'AU', minPrice: 4.49, flagEmoji: getFlagEmoji('AU') },
    { id: '7', name: 'China', code: 'CN', minPrice: 8.99, flagEmoji: getFlagEmoji('CN') },
    { id: '8', name: 'South Korea', code: 'KR', minPrice: 6.99, flagEmoji: getFlagEmoji('KR') },
    { id: '9', name: 'Japan', code: 'JP', minPrice: 9.99, flagEmoji: getFlagEmoji('JP') },
    { id: '10', name: 'Hong Kong', code: 'HK', minPrice: 7.99, flagEmoji: getFlagEmoji('HK') },
    { id: '11', name: 'Taiwan', code: 'TW', minPrice: 8.99, flagEmoji: getFlagEmoji('TW') },
    { id: '12', name: 'Thailand', code: 'TH', minPrice: 5.99, flagEmoji: getFlagEmoji('TH') },
    { id: '13', name: 'Singapore', code: 'SG', minPrice: 6.99, flagEmoji: getFlagEmoji('SG') },
    { id: '14', name: 'Malaysia', code: 'MY', minPrice: 5.99, flagEmoji: getFlagEmoji('MY') },
    { id: '15', name: 'Indonesia', code: 'ID', minPrice: 4.99, flagEmoji: getFlagEmoji('ID') },
    { id: '16', name: 'Philippines', code: 'PH', minPrice: 5.99, flagEmoji: getFlagEmoji('PH') },
    { id: '17', name: 'Vietnam', code: 'VN', minPrice: 4.99, flagEmoji: getFlagEmoji('VN') },
    { id: '18', name: 'Cambodia', code: 'KH', minPrice: 4.99, flagEmoji: getFlagEmoji('KH') },
{ id: '19', name: 'France', code: 'FR', minPrice: 3.49, flagEmoji: getFlagEmoji('FR') },
{ id: '20', name: 'Italy', code: 'IT', minPrice: 3.99, flagEmoji: getFlagEmoji('IT') },
{ id: '21', name: 'Spain', code: 'ES', minPrice: 3.79, flagEmoji: getFlagEmoji('ES') },
{ id: '22', name: 'Switzerland', code: 'CH', minPrice: 4.49, flagEmoji: getFlagEmoji('CH') },
{ id: '23', name: 'Austria', code: 'AT', minPrice: 3.59, flagEmoji: getFlagEmoji('AT') },
{ id: '24', name: 'Belgium', code: 'BE', minPrice: 3.69, flagEmoji: getFlagEmoji('BE') },
{ id: '25', name: 'Denmark', code: 'DK', minPrice: 3.89, flagEmoji: getFlagEmoji('DK') },
{ id: '26', name: 'Sweden', code: 'SE', minPrice: 3.99, flagEmoji: getFlagEmoji('SE') },
{ id: '27', name: 'Norway', code: 'NO', minPrice: 4.19, flagEmoji: getFlagEmoji('NO') },
{ id: '28', name: 'Finland', code: 'FI', minPrice: 3.79, flagEmoji: getFlagEmoji('FI') },
{ id: '29', name: 'Ireland', code: 'IE', minPrice: 3.99, flagEmoji: getFlagEmoji('IE') },
{ id: '30', name: 'Portugal', code: 'PT', minPrice: 3.69, flagEmoji: getFlagEmoji('PT') },
{ id: '31', name: 'Greece', code: 'GR', minPrice: 3.89, flagEmoji: getFlagEmoji('GR') },
{ id: '32', name: 'Poland', code: 'PL', minPrice: 3.49, flagEmoji: getFlagEmoji('PL') },
{ id: '33', name: 'Czech Republic', code: 'CZ', minPrice: 3.59, flagEmoji: getFlagEmoji('CZ') },
{ id: '34', name: 'Hungary', code: 'HU', minPrice: 3.69, flagEmoji: getFlagEmoji('HU') },
{ id: '35', name: 'Romania', code: 'RO', minPrice: 3.79, flagEmoji: getFlagEmoji('RO') },
{ id: '36', name: 'Bulgaria', code: 'BG', minPrice: 3.89, flagEmoji: getFlagEmoji('BG') },
{ id: '37', name: 'Croatia', code: 'HR', minPrice: 3.99, flagEmoji: getFlagEmoji('HR') },
{ id: '38', name: 'Slovakia', code: 'SK', minPrice: 3.49, flagEmoji: getFlagEmoji('SK') },
{ id: '39', name: 'Slovenia', code: 'SI', minPrice: 3.59, flagEmoji: getFlagEmoji('SI') },
{ id: '40', name: 'Estonia', code: 'EE', minPrice: 3.69, flagEmoji: getFlagEmoji('EE') },
{ id: '41', name: 'Latvia', code: 'LV', minPrice: 3.79, flagEmoji: getFlagEmoji('LV') },
{ id: '42', name: 'Lithuania', code: 'LT', minPrice: 3.89, flagEmoji: getFlagEmoji('LT') },
{ id: '43', name: 'Luxembourg', code: 'LU', minPrice: 3.99, flagEmoji: getFlagEmoji('LU') },
{ id: '44', name: 'Malta', code: 'MT', minPrice: 4.19, flagEmoji: getFlagEmoji('MT') },
{ id: '45', name: 'Cyprus', code: 'CY', minPrice: 3.79, flagEmoji: getFlagEmoji('CY') },
{ id: '46', name: 'United Arab Emirates', code: 'AE', minPrice: 5.99, flagEmoji: getFlagEmoji('AE') },
{ id: '47', name: 'Saudi Arabia', code: 'SA', minPrice: 6.49, flagEmoji: getFlagEmoji('SA') },
{ id: '48', name: 'Turkey', code: 'TR', minPrice: 4.99, flagEmoji: getFlagEmoji('TR') },
{ id: '49', name: 'Israel', code: 'IL', minPrice: 5.49, flagEmoji: getFlagEmoji('IL') },
{ id: '50', name: 'Egypt', code: 'EG', minPrice: 3.99, flagEmoji: getFlagEmoji('EG') },
{ id: '51', name: 'Jordan', code: 'JO', minPrice: 4.49, flagEmoji: getFlagEmoji('JO') },
{ id: '52', name: 'Lebanon', code: 'LB', minPrice: 4.99, flagEmoji: getFlagEmoji('LB') },
{ id: '53', name: 'Qatar', code: 'QA', minPrice: 5.99, flagEmoji: getFlagEmoji('QA') },
{ id: '54', name: 'Kuwait', code: 'KW', minPrice: 5.49, flagEmoji: getFlagEmoji('KW') },
{ id: '55', name: 'Bahrain', code: 'BH', minPrice: 5.99, flagEmoji: getFlagEmoji('BH') },
{ id: '56', name: 'Oman', code: 'OM', minPrice: 5.49, flagEmoji: getFlagEmoji('OM') },
{ id: '57', name: 'India', code: 'IN', minPrice: 2.99, flagEmoji: getFlagEmoji('IN') },
{ id: '58', name: 'Pakistan', code: 'PK', minPrice: 3.49, flagEmoji: getFlagEmoji('PK') },
{ id: '59', name: 'Bangladesh', code: 'BD', minPrice: 3.99, flagEmoji: getFlagEmoji('BD') },
{ id: '60', name: 'Sri Lanka', code: 'LK', minPrice: 4.49, flagEmoji: getFlagEmoji('LK') },
{ id: '61', name: 'Nepal', code: 'NP', minPrice: 3.99, flagEmoji: getFlagEmoji('NP') },
{ id: '62', name: 'Maldives', code: 'MV', minPrice: 5.49, flagEmoji: getFlagEmoji('MV') },

// South America
{ id: '63', name: 'Brazil', code: 'BR', minPrice: 4.99, flagEmoji: getFlagEmoji('BR') },
{ id: '64', name: 'Argentina', code: 'AR', minPrice: 5.49, flagEmoji: getFlagEmoji('AR') },
{ id: '65', name: 'Chile', code: 'CL', minPrice: 5.99, flagEmoji: getFlagEmoji('CL') },
{ id: '66', name: 'Colombia', code: 'CO', minPrice: 4.49, flagEmoji: getFlagEmoji('CO') },
{ id: '67', name: 'Peru', code: 'PE', minPrice: 4.99, flagEmoji: getFlagEmoji('PE') },
{ id: '68', name: 'Ecuador', code: 'EC', minPrice: 4.99, flagEmoji: getFlagEmoji('EC') },
{ id: '69', name: 'Uruguay', code: 'UY', minPrice: 5.49, flagEmoji: getFlagEmoji('UY') },
{ id: '70', name: 'Paraguay', code: 'PY', minPrice: 4.99, flagEmoji: getFlagEmoji('PY') },
{ id: '71', name: 'Bolivia', code: 'BO', minPrice: 4.49, flagEmoji: getFlagEmoji('BO') },
{ id: '72', name: 'Venezuela', code: 'VE', minPrice: 5.99, flagEmoji: getFlagEmoji('VE') },

// Central America & Caribbean
{ id: '73', name: 'Mexico', code: 'MX', minPrice: 4.99, flagEmoji: getFlagEmoji('MX') },
{ id: '74', name: 'Guatemala', code: 'GT', minPrice: 4.49, flagEmoji: getFlagEmoji('GT') },
{ id: '75', name: 'Costa Rica', code: 'CR', minPrice: 5.49, flagEmoji: getFlagEmoji('CR') },
{ id: '76', name: 'Panama', code: 'PA', minPrice: 5.99, flagEmoji: getFlagEmoji('PA') },
{ id: '77', name: 'Nicaragua', code: 'NI', minPrice: 4.99, flagEmoji: getFlagEmoji('NI') },
{ id: '78', name: 'Honduras', code: 'HN', minPrice: 4.49, flagEmoji: getFlagEmoji('HN') },
{ id: '79', name: 'El Salvador', code: 'SV', minPrice: 4.99, flagEmoji: getFlagEmoji('SV') },
{ id: '80', name: 'Belize', code: 'BZ', minPrice: 5.49, flagEmoji: getFlagEmoji('BZ') },
{ id: '81', name: 'Jamaica', code: 'JM', minPrice: 5.99, flagEmoji: getFlagEmoji('JM') },
{ id: '82', name: 'Dominican Republic', code: 'DO', minPrice: 5.49, flagEmoji: getFlagEmoji('DO') },
{ id: '83', name: 'Cuba', code: 'CU', minPrice: 6.99, flagEmoji: getFlagEmoji('CU') },
{ id: '84', name: 'Puerto Rico', code: 'PR', minPrice: 4.99, flagEmoji: getFlagEmoji('PR') },

// Africa
{ id: '85', name: 'South Africa', code: 'ZA', minPrice: 4.99, flagEmoji: getFlagEmoji('ZA') },
{ id: '86', name: 'Nigeria', code: 'NG', minPrice: 3.99, flagEmoji: getFlagEmoji('NG') },
{ id: '87', name: 'Kenya', code: 'KE', minPrice: 4.49, flagEmoji: getFlagEmoji('KE') },
{ id: '88', name: 'Ghana', code: 'GH', minPrice: 4.99, flagEmoji: getFlagEmoji('GH') },
{ id: '89', name: 'Morocco', code: 'MA', minPrice: 4.49, flagEmoji: getFlagEmoji('MA') },
{ id: '90', name: 'Tanzania', code: 'TZ', minPrice: 4.99, flagEmoji: getFlagEmoji('TZ') },
{ id: '91', name: 'Uganda', code: 'UG', minPrice: 4.49, flagEmoji: getFlagEmoji('UG') },
{ id: '92', name: 'Rwanda', code: 'RW', minPrice: 4.99, flagEmoji: getFlagEmoji('RW') },
{ id: '93', name: 'Ethiopia', code: 'ET', minPrice: 4.49, flagEmoji: getFlagEmoji('ET') },
{ id: '94', name: 'Senegal', code: 'SN', minPrice: 4.99, flagEmoji: getFlagEmoji('SN') },
{ id: '95', name: 'Tunisia', code: 'TN', minPrice: 4.49, flagEmoji: getFlagEmoji('TN') },
{ id: '96', name: 'Algeria', code: 'DZ', minPrice: 4.99, flagEmoji: getFlagEmoji('DZ') },
{ id: '97', name: 'Ivory Coast', code: 'CI', minPrice: 4.49, flagEmoji: getFlagEmoji('CI') },
{ id: '98', name: 'Cameroon', code: 'CM', minPrice: 4.99, flagEmoji: getFlagEmoji('CM') },
{ id: '99', name: 'Botswana', code: 'BW', minPrice: 5.49, flagEmoji: getFlagEmoji('BW') },
{ id: '100', name: 'Namibia', code: 'NA', minPrice: 5.99, flagEmoji: getFlagEmoji('NA') },

// Additional Asia-Pacific
{ id: '101', name: 'New Zealand', code: 'NZ', minPrice: 5.99, flagEmoji: getFlagEmoji('NZ') },
{ id: '102', name: 'Laos', code: 'LA', minPrice: 4.99, flagEmoji: getFlagEmoji('LA') },
{ id: '103', name: 'Myanmar', code: 'MM', minPrice: 5.49, flagEmoji: getFlagEmoji('MM') },
{ id: '104', name: 'Brunei', code: 'BN', minPrice: 6.99, flagEmoji: getFlagEmoji('BN') },

  ];
};


const EsimPlans = () => {
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

  // Fetch only the 6 standard countries
  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ['standard-countries'],
    queryFn: async () => {
      try {
        console.log('Fetching standard 8 countries from Firebase...');
        const standardCountryNames = ['Germany', 'Netherlands', 'United Kingdom', 'United States', 'Canada', 'Australia', 'China', 'South Korea'];
        const countriesWithPlans = [];
        
        // Fetch only the 7 standard countries
        for (const countryName of standardCountryNames) {
          try {
            // Query for this specific country
            const countryQuery = query(collection(db, 'countries'), where('name', '==', countryName));
            const countrySnapshot = await getDocs(countryQuery);
            
            if (!countrySnapshot.empty) {
              const countryDoc = countrySnapshot.docs[0];
              const countryData = { id: countryDoc.id, ...countryDoc.data() };
              
              // Get plans for this country to find minimum price
              const plansQuery = query(collection(db, 'plans'), where('country', '==', countryName));
              const plansSnapshot = await getDocs(plansQuery);
              const plans = plansSnapshot.docs.map(planDoc => planDoc.data());
              
              const minPrice = plans.length > 0 
                ? Math.min(...plans.map(plan => parseFloat(plan.price) || 9.99))
                : 9.99;
              
              countriesWithPlans.push({
                ...countryData,
                minPrice: minPrice,
                flagEmoji: getFlagEmoji(countryData.code)
              });
            }
          } catch (error) {
            console.log(`Could not fetch ${countryName}:`, error);
          }
        }
        
        console.log('Fetched standard countries:', countriesWithPlans.length);
        return countriesWithPlans.length > 0 ? countriesWithPlans : getStandardCountries();
      } catch (error) {
        console.error('Firebase error:', error);
        return getStandardCountries();
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (cacheTime renamed to gcTime in v5)
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
      console.log('Using standard countries due to error:', countriesError);
      // Use standard countries on error
      const standardData = getStandardCountries();
      setCountries(standardData);
      setFilteredCountries(standardData);
    }
  }, [countriesData, countriesError, countriesLoading]);

  // Enhanced search function that searches both Firebase and static data
  const searchCountries = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('Searching for countries:', term);
      
      // First, search in static data for immediate results
      const allStaticCountries = getStandardCountries();
      const staticResults = allStaticCountries.filter(country => 
        country.name.toLowerCase().includes(term.toLowerCase())
      );
      
      // Set immediate results from static data
      setSearchResults(staticResults);
      
      // Then try to fetch from Firebase for more comprehensive results
      try {
        const querySnapshot = await getDocs(collection(db, 'countries'));
        const firebaseResults = [];
        
        for (const doc of querySnapshot.docs) {
          const countryData = { id: doc.id, ...doc.data() };
          
          // Check if country name matches search term
          if (countryData.name.toLowerCase().includes(term.toLowerCase())) {
            // Get plans for this country to find minimum price
            const plansQuery = query(collection(db, 'plans'), where('country', '==', countryData.name));
            const plansSnapshot = await getDocs(plansQuery);
            const plans = plansSnapshot.docs.map(planDoc => planDoc.data());
            
            const minPrice = plans.length > 0 
              ? Math.min(...plans.map(plan => parseFloat(plan.price) || 9.99))
              : 9.99;
            
            firebaseResults.push({
              ...countryData,
              minPrice: minPrice,
              flagEmoji: getFlagEmoji(countryData.code)
            });
          }
        }
        
        // Merge results, preferring Firebase data but keeping static as backup
        const combinedResults = firebaseResults.length > 0 ? firebaseResults : staticResults;
        console.log('Search results:', combinedResults.length);
        setSearchResults(combinedResults);
      } catch (firebaseError) {
        console.log('Firebase search failed, using static results:', firebaseError);
        // Keep static results if Firebase fails
      }
      
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

  // Filter countries based on search term
  useEffect(() => {
    if (searchTerm) {
      // Show search results when searching
      setFilteredCountries(searchResults);
    } else {
      // Show standard data when not searching
      setFilteredCountries(countries);
    }
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
      
      setAvailablePlans(plans);
    } catch (error) {
      console.error('Error loading plans for country:', error);
      setAvailablePlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };


  // Show fallback data immediately if no countries are loaded after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!countriesData && !countriesError && countries.length === 0) {
        console.log('Timeout reached, using standard countries');
        const standardData = getStandardCountries();
        setCountries(standardData);
        setFilteredCountries(standardData);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [countriesData, countriesError, countries.length]);

  return (
    <>
      <section className="destination py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="destination-top mb-8">

          {/* Search Box */}
          <div className="search-box max-w-md mx-auto mb-8">
            <div className="search-box-field relative">
              <input
                className="search-box-field__input w-full px-4 py-3 pr-12 border border-jordy-blue rounded-full focus:ring-2 focus:ring-tufts-blue focus:border-transparent"
                type="text"
                placeholder="Search your destination (e.g., France, Germany, United States)"
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
                  "Searching..."
                ) : searchResults.length > 0 ? (
                  `Found ${searchResults.length} ${searchResults.length === 1 ? 'destination' : 'destinations'}`
                ) : searchTerm.length >= 2 ? (
                  `No destinations found for "${searchTerm}"`
                ) : (
                  "Type at least 2 characters to search"
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
                            From ${country.minPrice ? Math.round(country.minPrice) : '10'}
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
                            From ${country.minPrice ? Math.round(country.minPrice) : '10'}
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
                        {showAllCountries ? 'Show Less' : 'Show All'}
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
    />
    </>
  );
};

export default EsimPlans;
