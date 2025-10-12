import { useState, useEffect } from 'react';

// Region mapping for countries
const regionMapping = {
  asia: ['JP', 'KR', 'CN', 'TH', 'SG', 'MY', 'ID', 'VN', 'PH', 'IN', 'KH', 'LA', 'MM', 'BD', 'NP', 'LK', 'MV', 'BT', 'TW', 'HK', 'MO', 'MN', 'KZ', 'UZ', 'TM', 'TJ', 'KG', 'AF', 'PK', 'BN', 'TL'],
  europe: ['GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'HR', 'SI', 'RS', 'BA', 'ME', 'MK', 'AL', 'XK', 'EE', 'LV', 'LT', 'UA', 'BY', 'MD', 'RU', 'MT', 'CY', 'LU', 'LI', 'MC', 'SM', 'VA', 'AD'],
  africa: ['EG', 'ZA', 'NG', 'KE', 'MA', 'TN', 'GH', 'ET', 'TZ', 'UG', 'DZ', 'SD', 'AO', 'MZ', 'CM', 'CI', 'NE', 'BF', 'ML', 'MW', 'ZM', 'SN', 'SO', 'TD', 'ZW', 'GN', 'RW', 'BJ', 'TG', 'SS', 'LY', 'LR', 'MR', 'CF', 'ER', 'GM', 'BW', 'GA', 'NA', 'MU', 'SZ', 'GW', 'LS', 'GQ', 'KM', 'CV', 'ST', 'SC', 'DJ', 'RE'],
  americas: ['US', 'CA', 'MX', 'BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR', 'GF', 'CR', 'PA', 'GT', 'HN', 'NI', 'SV', 'BZ', 'CU', 'DO', 'HT', 'JM', 'TT', 'BB', 'BS', 'GD', 'LC', 'VC', 'AG', 'DM', 'KN', 'PR', 'VI', 'AW', 'CW', 'BQ', 'SX', 'MF', 'GP', 'MQ', 'PM', 'BM', 'GL', 'FK'],
  oceania: ['AU', 'NZ', 'FJ', 'PG', 'NC', 'PF', 'SB', 'VU', 'WS', 'TO', 'KI', 'FM', 'MH', 'PW', 'NR', 'TV', 'CK', 'NU', 'TK', 'WF', 'AS', 'GU', 'MP', 'UM']
};

// Popular tourist destinations with high eSIM usage
const popularCountryCodes = [
  'US',  // United States
  'ES',  // Spain
  'FR',  // France
  'IT',  // Italy
  'GB',  // United Kingdom
  'NL',  // Netherlands
  'BR',  // Brazil
  'IN',  // India
  'CN',  // China
  'TH',  // Thailand
  'JP',  // Japan
  'AU',  // Australia
  'DE',  // Germany
  'CA',  // Canada
  'SG',  // Singapore
  'MX',  // Mexico
  'TR',  // Turkey
  'AE',  // United Arab Emirates
  'PT',  // Portugal
  'GR',  // Greece
  
];

export const useCountryFilters = (countries) => {
  const [selectedRegion, setSelectedRegion] = useState('popular');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filteredCountries, setFilteredCountries] = useState([]);

  // Search function
  const searchCountries = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching countries for:', term);
      
      if (countries && countries.length > 0) {
        const results = countries.filter(country => {
          const searchLower = term.toLowerCase();
          return (
            country.displayName?.toLowerCase().includes(searchLower) ||
            country.originalName?.toLowerCase().includes(searchLower) ||
            country.code?.toLowerCase().includes(searchLower) ||
            country.name?.toLowerCase().includes(searchLower)
          );
        });
        
        console.log('✅ Found', results.length, 'matching countries');
        setSearchResults(results);
      } else {
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
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, countries]);

  // Filter by region
  const filterByRegion = (countriesList) => {
    if (!countriesList || countriesList.length === 0) return [];
    
    // If searching, don't apply region filters
    if (searchTerm) {
      return [...countriesList];
    }
    
    // Filter by selected region
    if (selectedRegion === 'popular') {
      // Only show countries that are in the popular list
      return countriesList.filter(country => popularCountryCodes.includes(country.code));
    } else if (selectedRegion !== 'all') {
      const regionCodes = regionMapping[selectedRegion] || [];
      return countriesList.filter(country => regionCodes.includes(country.code));
    }
    
    return [...countriesList];
  };

  // Apply filters whenever dependencies change
  useEffect(() => {
    const countriesToFilter = searchTerm ? searchResults : countries;
    const filtered = filterByRegion(countriesToFilter);
    setFilteredCountries(filtered);
  }, [searchTerm, countries, searchResults, selectedRegion]);

  return {
    selectedRegion,
    setSelectedRegion,
    searchTerm,
    setSearchTerm,
    filteredCountries,
    isSearching
  };
};

