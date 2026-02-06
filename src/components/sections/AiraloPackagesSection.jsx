'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, Flag, Loader2, AlertCircle } from 'lucide-react';
import { getCountriesWithPricing } from '../../services/plansService';
import { translateCountries } from '../../utils/countryTranslations';
import { useI18n } from '../../contexts/I18nContext';

import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AiraloPackagesSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useI18n();
  const [packages, setPackages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('countries'); // 'global', 'regional', or 'countries'
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Countries tab state
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchPackages();
    fetchCountries(); // Fetch countries on component load
  }, [locale]); // Re-fetch when locale changes
  
  // Handle search from URL params - only after mount
  useEffect(() => {
    if (!mounted) return;
    
    const urlSearchTerm = searchParams?.get('search') || '';
    setSearchTerm(urlSearchTerm);
    
    // If there's a search term, automatically switch to Countries tab
    if (urlSearchTerm) {
      setActiveTab('countries');
    }
  }, [searchParams, mounted]);
  
  // Filter countries based on search term
  useEffect(() => {
    if (!searchTerm || searchTerm.trim() === '') {
      setFilteredCountries(countries);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = countries.filter(country => 
        country.name.toLowerCase().includes(term) ||
        country.code.toLowerCase().includes(term)
      );
      setFilteredCountries(filtered);
    }
  }, [searchTerm, countries]);

  // Fetch countries when Countries tab is active (fallback if not loaded yet)
  useEffect(() => {
    if (activeTab === 'countries' && countries.length === 0) {
      fetchCountries();
    }
  }, [activeTab]);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📦 Fetching global and regional packages from Firestore dataplans collection...');
      console.log('🌐 Current locale:', locale);
      
      // Query all active plans from dataplans collection
      const plansQuery = query(
        collection(db, 'dataplans'),
        where('status', '==', 'active'),
        orderBy('price', 'asc')
      );
      
      const plansSnapshot = await getDocs(plansQuery);
      const allPlans = [];
      
      plansSnapshot.forEach((doc) => {
        const planData = doc.data();
        
        // Only include enabled and visible plans
        // Skip if explicitly disabled or hidden
        if (planData.enabled === false || planData.hidden === true) {
          return;
        }
        
        // Filter by locale/language if not English (default)
        // Language-specific pages should only show relevant global/regional packages
        if (locale && locale !== 'en') {
          const supportedLanguages = planData.supported_languages || [];
          const isGlobalPlan = planData.is_global === true || 
                              planData.type === 'global' || 
                              planData.region === 'global';
          const isRegionalPlan = planData.is_regional === true || 
                                planData.type === 'regional';
          
          // For language-specific pages, only include:
          // 1. Global plans (available everywhere)
          // 2. Regional plans that support the current language
          // 3. Skip country-specific plans (they're handled separately in Countries tab)
          if (isGlobalPlan) {
            // Global plans are available for all languages
            allPlans.push({
              id: doc.id,
              ...planData
            });
          } else if (isRegionalPlan && supportedLanguages.length > 0 && supportedLanguages.includes(locale)) {
            // Regional plans must explicitly support the language
            allPlans.push({
              id: doc.id,
              ...planData
            });
          } else if (isRegionalPlan && supportedLanguages.length === 0) {
            // If no supported_languages specified, show for all locales (backward compatibility)
            allPlans.push({
              id: doc.id,
              ...planData
            });
          }
          // Country-specific plans are filtered out for language pages
        } else {
          // English or default - show all plans
          allPlans.push({
            id: doc.id,
            ...planData
          });
        }
      });
      
      console.log(`✅ Found ${allPlans.length} active plans from dataplans collection (filtered by locale: ${locale})`);
      
      // Organize packages by type (global vs regional vs countries)
      const organized = organizePackages(allPlans);
      console.log('📦 Organized packages:', organized);
      setPackages(organized);
      
    } catch (err) {
      console.error('Error fetching packages:', err);
      setError(err.message || 'Failed to load packages');
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      console.log('🌍 Fetching countries from Firebase...');
      
      const countriesWithPricing = await getCountriesWithPricing();
      
      // Filter to show only countries with plans (minPrice < 999 indicates real data)
      let countriesWithRealPricing = countriesWithPricing.filter(country => 
        country.minPrice < 999 && country.plansCount > 0
      );
      
      // Only show countries with proper flags (exclude globe 🌍 and map 🗺️)
      const genericIcons = ['🌍', '🗺️', '🌏', '🌎'];
      countriesWithRealPricing = countriesWithRealPricing.filter(country => {
        const flag = country.flagEmoji || '';
        return flag && !genericIcons.includes(flag);
      });
      
      // Sort by popularity: most plans first (popular destinations), then by min price
      countriesWithRealPricing.sort((a, b) => {
        if (b.plansCount !== a.plansCount) return b.plansCount - a.plansCount;
        return a.minPrice - b.minPrice;
      });
      
      // Show top 10 popular destinations on homepage
      const popularDestinations = countriesWithRealPricing.slice(0, 10);
      
      // Translate countries based on current locale
      const translatedCountries = translateCountries(popularDestinations, locale);
      
      console.log('✅ Popular destinations loaded:', translatedCountries.length);
      setCountries(translatedCountries);
    } catch (err) {
      console.error('Error fetching countries:', err);
      setCountries([]);
    } finally {
      setLoadingCountries(false);
    }
  };

  const handleCountrySelect = async (country) => {
    console.log('🛒 User selected country:', country.name);

    // Navigate directly to share-package page with 1GB auto-selected
    try {
      const directPlansQuery = query(
        collection(db, 'dataplans'),
        where('country_codes', 'array-contains', country.code)
      );
      const directPlansSnapshot = await getDocs(directPlansQuery);
      const plans = directPlansSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(plan => plan.enabled !== false && plan.hidden !== true);

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
      }
    } catch (error) {
      console.error('Error finding plans:', error);
    }
  };

  // Map technical region identifiers to human-friendly names
  const getFriendlyRegionName = (regionIdentifier) => {
    if (!regionIdentifier) return 'Regional Plans';
    
    const lowerIdentifier = regionIdentifier.toLowerCase().trim();
    
    // Mapping of technical identifiers to friendly names
    const regionMap = {
      'eu': 'Europe',
      'europe': 'Europe',
      'european-union': 'Europe',
      'eastern-europe': 'Eastern Europe',
      'western-europe': 'Western Europe',
      'scandinavia': 'Scandinavia',
      'asia': 'Asia',
      'asean': 'Southeast Asia',
      'mena': 'Middle East & North Africa',
      'middle-east': 'Middle East',
      'middle east': 'Middle East',
      'middle-east-and-north-africa': 'Middle East & North Africa',
      'middle-east-north-africa': 'Middle East & North Africa',
      'gcc': 'Gulf Countries',
      'americas': 'Americas',
      'north-america': 'North America',
      'south-america': 'South America',
      'central-america': 'Central America',
      'latin-america': 'Latin America',
      'latin america': 'Latin America',
      'caribbean': 'Caribbean',
      'africa': 'Africa',
      'oceania': 'Oceania & Pacific',
      'pacific': 'Oceania & Pacific',
      'americanmex': 'Americas',
      'america-mexico': 'Americas',
      'us-mx': 'Americas',
      'usa-mexico': 'Americas',
      'north-america-mexico': 'Americas',
      'americas-mexico': 'Americas',
      'oceanlink': 'Oceania & Pacific',
      'ocean-link': 'Oceania & Pacific',
      'latamlink': 'Latin America',
      'latam-link': 'Latin America',
      'latam': 'Latin America',
      'latin-america-link': 'Latin America',
      'regional plans': 'Regional Plans',
      'regional': 'Regional Plans'
    };
    
    // Check exact match first
    if (regionMap[lowerIdentifier]) {
      return regionMap[lowerIdentifier];
    }
    
    // Check if identifier contains any mapped key
    for (const [key, friendlyName] of Object.entries(regionMap)) {
      if (lowerIdentifier.includes(key) || key.includes(lowerIdentifier)) {
        return friendlyName;
      }
    }
    
    // If no match, capitalize words nicely
    return regionIdentifier
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const organizePackages = (packagesData) => {
    const global = [];
    const regional = {};
    const countries = {};
    
    // Process packages - ensure it's an array
    const packagesList = Array.isArray(packagesData) ? packagesData : [];
    
    console.log('📋 Processing packages list:', packagesList.length, 'items');
    
    packagesList.forEach((pkg) => {
      // Skip parent containers (packages with is_parent flag that have no price)
      if (pkg.is_parent === true) {
        return; // Skip to next package
      }
      
      // Extract package ID
      const packageId = pkg.id || pkg.package_id || pkg.slug;
      
      // Get plan data fields
      const countryCodes = pkg.country_codes || [];
      const planType = pkg.type || '';
      const planRegion = pkg.region || pkg.region_slug || '';
      const planName = (pkg.name || pkg.title || '').toLowerCase();
      const planSlug = (pkg.slug || '').toLowerCase();
      
      // Check if it's a global package (match admin-app logic)
      // Check explicit backend flags first
      if (pkg.is_global === true) {
        global.push({
          ...pkg,
          id: packageId
        });
        return; // Skip to next package
      }
      
      // Global packages typically have:
      // 1. Has type === 'global'
      // 2. Has region === 'global'
      // 3. Name/slug includes 'global', 'discover', 'worldwide'
      const isGlobal = 
        planType === 'global' ||
        planRegion === 'global' ||
        planSlug === 'global' ||
        planName === 'global' ||
        planSlug.startsWith('discover') ||  // Discover/Discover+ are Airalo's global packages
        planName.startsWith('discover') ||
        planName.includes('worldwide') ||
        planName.includes('world');
      
      // Check if it's a regional package (match admin-app logic exactly)
      // Check explicit backend flags first
      if (pkg.is_regional === true) {
        // Determine region name for grouping
        let region = planRegion;
        
          // If no region field set, try to infer from package slug or use a meaningful default
          if (!region || region === '') {
            // Try to extract region from slug (e.g., "europe-5gb" -> "europe", "americanmex" -> "Americas")
            if (planSlug || planName) {
              const regionalIdentifiers = [
                'asia', 'europe', 'africa', 'americas', 'middle-east', 'middle east',
                'oceania', 'caribbean', 'latin-america', 'latin america',
                'north-america', 'south-america', 'central-america',
                'eastern-europe', 'western-europe', 'scandinavia',
                'asean', 'gcc', 'european-union', 'eu', 'mena',
                'americanmex', 'america-mexico', 'us-mx', 'usa-mexico',
                'oceanlink', 'ocean-link', 'pacific', 'pacific-islands',
                'latamlink', 'latam-link', 'latam', 'latin-america-link'
              ];
              
              // Check if slug or name contains any regional identifier
              for (const identifier of regionalIdentifiers) {
                if (planSlug.includes(identifier) || planName.includes(identifier)) {
                  // Use friendly region name mapping
                  region = getFriendlyRegionName(identifier);
                  break;
                }
              }
            }
            
            // If still no region found, use a generic name
            if (!region || region === '') {
              region = 'Regional Plans';
            }
          }
          
          // Apply friendly name transformation to the final region
          region = getFriendlyRegionName(region);
        
        if (!regional[region]) {
          regional[region] = [];
        }
        regional[region].push({
          ...pkg,
          id: packageId
        });
        return; // Skip to next package
      }
      
      // Regional packages typically have:
      // 1. Has type === 'regional'
      // 2. Name/slug matches known regional identifiers
      // 3. Has multiple country codes (2-10 countries)
      // 4. Contains regional keywords in name/slug
      const regionalIdentifiers = [
        'asia', 'europe', 'africa', 'americas', 'middle-east', 'middle east',
        'oceania', 'caribbean', 'latin-america', 'latin america',
        'north-america', 'south-america', 'central-america',
        'eastern-europe', 'western-europe', 'scandinavia',
        'asean', 'gcc', 'european-union', 'eu', 'mena',
        'middle-east-and-north-africa', 'middle-east-north-africa',
        'americanmex', 'america-mexico', 'us-mx', 'usa-mexico',
        'north-america-mexico', 'americas-mexico',
        'oceanlink', 'ocean-link', 'pacific', 'pacific-islands',
        'latamlink', 'latam-link', 'latam', 'latin-america-link'
      ];
      
      // Check if plan name/slug contains any regional identifier (not just exact match)
      const containsRegionalIdentifier = regionalIdentifiers.some(identifier => 
        planSlug.includes(identifier) || planName.includes(identifier)
      );
      
      // Check if plan has multiple country codes (2-10) - indicates regional
      const hasMultipleCountries = countryCodes.length >= 2 && countryCodes.length < 10;
      
      const isRegional = 
        planType === 'regional' ||
        containsRegionalIdentifier ||
        (planRegion && planRegion !== '' && planRegion !== 'global' && regionalIdentifiers.some(id => planRegion.includes(id))) ||
        (hasMultipleCountries && !isGlobal); // Multiple countries but not global = regional
      
      // Categorize package (from dataplans collection, no nested packages)
      if (isGlobal) {
        global.push({
          ...pkg,
          id: packageId
        });
      } else if (isRegional) {
        // Determine region name for grouping
        let region = planRegion;
        
        // If no region set, try to extract from identifiers or use meaningful default
        if (!region || region === '') {
          // Try to find which regional identifier matched
          for (const identifier of regionalIdentifiers) {
            if (planSlug.includes(identifier) || planName.includes(identifier)) {
              // Use friendly region name mapping
              region = getFriendlyRegionName(identifier);
              break;
            }
          }
          
          // If still no region but has multiple countries, try to infer from country codes
          if ((!region || region === '') && hasMultipleCountries && countryCodes.length > 0) {
            // Check if it's an Americas/Mexico regional plan
            if (countryCodes.includes('MX') && countryCodes.includes('US')) {
              region = 'Americas';
            } else if (countryCodes.some(code => ['US', 'CA', 'MX'].includes(code))) {
              region = 'Americas';
            } else if (countryCodes.some(code => ['AU', 'NZ', 'FJ', 'PG', 'NC', 'PF'].includes(code))) {
              // Oceania countries
              region = 'Oceania & Pacific';
            } else if (countryCodes.some(code => ['AE', 'SA', 'KW', 'QA', 'BH', 'OM'].includes(code))) {
              // GCC countries
              region = 'Gulf Countries';
            } else if (countryCodes.some(code => ['SG', 'MY', 'TH', 'ID', 'PH', 'VN'].includes(code))) {
              // ASEAN countries
              region = 'Southeast Asia';
            } else if (countryCodes.some(code => ['EG', 'MA', 'DZ', 'TN', 'LY'].includes(code))) {
              // North Africa
              region = 'Middle East & North Africa';
            } else {
              region = 'Regional Plans';
            }
          }
          
          // If still no region, use generic name
          if (!region || region === '') {
            region = 'Regional Plans';
          }
        }
        
        // Apply friendly name transformation to the final region
        region = getFriendlyRegionName(region);
        
        if (!regional[region]) {
          regional[region] = [];
        }
        regional[region].push({
          ...pkg,
          id: packageId
        });
      } else if (countryCodes.length === 1) {
        // Single country package
        const countryCode = countryCodes[0];
        const countryName = pkg.country_name || pkg.title || pkg.name || countryCode;
        if (!countries[countryCode]) {
          countries[countryCode] = {
            code: countryCode,
            name: countryName,
            packages: []
          };
        }
        countries[countryCode].packages.push({
          ...pkg,
          id: packageId
        });
      }
      // Skip packages that don't match any category
    });

    return {
      global: global.slice(0, 50), // Limit to 50 global packages
      regional: regional,
      countries: countries
    };
  };

  const handlePackageClick = (packageId) => {
    if (!packageId) {
      console.error('No package ID provided');
      return;
    }
    
    // Build the correct URL with language prefix if needed
    let targetUrl = '/share-package/' + packageId;
    
    // Add language prefix if not English
    if (locale && locale !== 'en') {
      targetUrl = `/${locale}${targetUrl}`;
    }
    
    console.log('📦 Navigating to package:', targetUrl);
    // Navigate to share package page with proper language prefix
    router.push(targetUrl);
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-tufts-blue mx-auto mb-4" />
            <p className="text-gray-600">Loading packages...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchPackages}
              className="mt-4 px-4 py-2 bg-tufts-blue text-white rounded-lg hover:bg-tufts-blue-dark"
            >
              Try Again
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!packages) {
    return null;
  }



  return (
    <section className="bg-transparent">
      <div className="container mx-auto px-4">
        {/* Compact Chip-style Tabs - Smaller and closer to search */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => {
              // Find 1GB global plan and navigate directly to purchase
              const oneGBGlobal = packages.global
                .filter(p => parseFloat(p.data || p.amount) === 1)
                .sort((a, b) => parseFloat(a.price || a.net_price || 999) - parseFloat(b.price || b.net_price || 999))[0];
              const fallback = packages.global[0];
              const target = oneGBGlobal || fallback;
              if (target) {
                handlePackageClick(target.id);
              }
            }}
            className="inline-flex items-center px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 bg-white text-gray-700 hover:bg-tufts-blue/10 hover:text-tufts-blue border border-gray-200 hover:border-tufts-blue/20"
          >
            <Globe className="w-3.5 h-3.5 mr-1" />
            <span>Global</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('countries');

              setSelectedCountry(null);
            }}
            className={`inline-flex items-center px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-200 ${
              activeTab === 'countries'
                ? 'bg-tufts-blue text-white shadow-md shadow-tufts-blue/30'
                : 'bg-white text-gray-700 hover:bg-tufts-blue/10 hover:text-tufts-blue border border-gray-200 hover:border-tufts-blue/20'
            }`}
          >
            <Flag className="w-3.5 h-3.5 mr-1" />
            <span>Popular Destinations</span>
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === 'countries'
                ? 'bg-tufts-blue-dark text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {countries.length || 0}
            </span>
          </button>
        </div>

        {/* Countries */}
        {activeTab === 'countries' && (
          <div>
            {loadingCountries ? (
              <div className="flex justify-center items-center min-h-64">
                <Loader2 className="w-8 h-8 animate-spin text-tufts-blue mr-4" />
                <p className="text-gray-600">Loading countries...</p>
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="text-center text-gray-500 py-12">
                {searchTerm ? `No countries found matching "${searchTerm}"` : 'No countries available'}
              </div>
            ) : (
              <div>
                {!searchTerm && (
                  <div className="text-center mb-4">
                    <p className="text-gray-600 text-sm mb-2">
                      Top 10 popular travel destinations
                    </p>
                    <Link
                      href={locale && locale !== 'en' ? `/${locale}/esim-plans` : '/esim-plans'}
                      className="text-tufts-blue text-sm font-medium hover:underline"
                    >
                      View all destinations →
                    </Link>
                  </div>
                )}
                {searchTerm && (
                  <div className="mb-4 text-center text-gray-600 text-sm">
                    Found {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'} matching "{searchTerm}"
                  </div>
                )}
                <div className="space-y-2">
                  {filteredCountries.map((country) => (
                    <button
                      key={country.id || country.code}
                      onClick={() => handleCountrySelect(country)}
                      className="w-full px-6 py-4 bg-transparent rounded-lg shadow-sm hover:shadow-md border border-gray-100 hover:border-tufts-blue/20 transition-all duration-200 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {country.flagEmoji ? (
                            <span className="text-2xl">{country.flagEmoji}</span>
                          ) : (
                            <Flag className="w-8 h-8 text-tufts-blue" />
                          )}
                        </div>
                        <div className="text-left">
                          <h3 className="text-lg font-semibold text-gray-900">{country.name}</h3>
                          <p className="text-sm text-gray-500">1GB • 7 Days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {country.minPrice && country.minPrice < 999 ? (
                          <div className="text-lg font-semibold text-gray-900">
                            ${country.minPrice.toFixed(2)}
                          </div>
                        ) : (
                          <div className="text-lg font-medium text-gray-500">No plans</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
    </section>
  );
}
