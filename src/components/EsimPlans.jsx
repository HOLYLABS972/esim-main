'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { getRegularSettings, getReferralSettings } from '../services/settingsService';
import { detectPlatform } from '../utils/platformDetection';

// Import new components
import PlansSearchBar from './PlansSearchBar';
import RegionTabs from './RegionTabs';
import CountriesGrid from './CountriesGrid';
import PlanSelectionBottomSheet from './PlanSelectionBottomSheet';

// Import hooks
import { useCountries } from '../hooks/useCountries';
import { useCountryFilters } from '../hooks/useCountryFilters';

const EsimPlans = () => {
  const { t, locale } = useI18n();
  const { currentUser, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine if this is the dedicated plans page or landing page
  const isPlansPage = pathname === '/esim-plans' || pathname.includes('/esim-plans');
  
  // Get search term from URL params
  const urlSearchTerm = searchParams.get('search') || '';
  
  // Platform detection state
  const [platformInfo, setPlatformInfo] = useState(null);
  
  // Plan selection and checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  
  // Discount settings state
  const [referralSettings, setReferralSettings] = useState({ discountPercentage: 17, minimumPrice: 0.5 });
  const [regularSettings, setRegularSettings] = useState({ discountPercentage: 10, minimumPrice: 0.5 });

  // Use custom hooks
  const { countries, isLoading: countriesLoading, error: countriesError } = useCountries(locale);
  const { 
    selectedRegion, 
    setSelectedRegion, 
    searchTerm, 
    setSearchTerm, 
    filteredCountries,
    isSearching 
  } = useCountryFilters(countries);

  // Sync search term with URL params
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch !== searchTerm) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  // Platform detection
  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatformInfo(detectedPlatform);
  }, [currentUser, router]);

  // Fetch discount settings
  useEffect(() => {
    const fetchDiscountSettings = async () => {
      try {
        const [referral, regular] = await Promise.all([
          getReferralSettings(),
          getRegularSettings()
        ]);
        console.log('💰 Referral discount settings loaded:', referral);
        console.log('💰 Regular discount settings loaded:', regular);
        setReferralSettings(referral);
        setRegularSettings(regular);
      } catch (error) {
        console.error('Error fetching discount settings:', error);
      }
    };
    
    fetchDiscountSettings();
  }, []);

  // Handle country selection
  const handleCountrySelect = async (country) => {
    // Check if user is logged in
    if (!currentUser) {
      // Non-logged users: use OneLink for smart routing
      if (typeof window !== 'undefined' && window.APPSFLYER_ONELINK_URL) {
        console.log('📱 Non-logged user - Opening AppsFlyer OneLink');
        window.open(window.APPSFLYER_ONELINK_URL, '_blank');
        return;
      }
      
      // Fallback: scroll to download section
      console.log('🖥️ Non-logged user - OneLink not ready, scrolling to download section');
      const downloadSection = document.getElementById('how-it-works');
      if (downloadSection) {
        downloadSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push('/#how-it-works');
      }
      return;
    }
    
    // Logged-in users: open bottom sheet with plans
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
      const plansQuery = query(
        collection(db, 'dataplans'),
        where('country_codes', 'array-contains', countryCode)
      );
      const querySnapshot = await getDocs(plansQuery);
      
      const plans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out disabled plans
      const enabledPlans = plans.filter(plan => plan.enabled !== false);
      
      setAvailablePlans(enabledPlans);
    } catch (error) {
      console.error('Error loading plans for country:', error);
      setAvailablePlans([]);
    } finally {
      setLoadingPlans(false);
    }
  };

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
            <PlansSearchBar 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
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

          {/* Region Tabs - Only show when not searching */}
          {!searchTerm && isPlansPage && (
            <RegionTabs 
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
            />
          )}
        </div>
      </section>

      {/* Countries Grid Section */}
      <section className="bg-white pb-12 lg:pb-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <CountriesGrid
            countries={filteredCountries}
            isPlansPage={isPlansPage}
            searchTerm={searchTerm}
            onCountrySelect={handleCountrySelect}
            userProfile={userProfile}
            referralSettings={referralSettings}
            regularSettings={regularSettings}
            isLoading={countriesLoading}
            selectedRegion={selectedRegion}
          />
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

