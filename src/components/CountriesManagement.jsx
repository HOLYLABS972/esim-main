'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { collection, query, where, getDocs, writeBatch, doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
  Eye,
  EyeOff,
  Search,
  CheckSquare,
  Square,
  Download,
  RefreshCw,
  MapPin,
  Battery,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

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

const CountriesManagement = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = useAdmin();

  // State Management
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [topups, setTopups] = useState([]);
  const [filteredTopups, setFilteredTopups] = useState([]);
  const [showTopups, setShowTopups] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [showHiddenFilter, setShowHiddenFilter] = useState('visible'); // 'visible', 'hidden', 'all'
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');

  // Load countries and topups on component mount
  useEffect(() => {
    if (currentUser) {
      loadCountriesFromSupabase();
      loadTopupsFromSupabase();
    }
  }, [currentUser]);

  // Filter countries based on search and hide status
  useEffect(() => {
    const filtered = countries.filter(country => {
      // Filter by hidden/unhidden status
      if (showHiddenFilter === 'visible' && country.hidden === true) {
        return false;
      }
      if (showHiddenFilter === 'hidden' && country.hidden !== true) {
        return false;
      }
      // Filter by search term
      return country.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             country.code?.toLowerCase().includes(searchTerm.toLowerCase());
    });
    setFilteredCountries(filtered);
  }, [countries, searchTerm, showHiddenFilter]);

  // Filter topups based on search and hide status
  useEffect(() => {
    const filtered = topups.filter(topup => {
      // Filter by hidden/unhidden status
      if (showHiddenFilter === 'visible' && topup.hidden === true) {
        return false;
      }
      if (showHiddenFilter === 'hidden' && topup.hidden !== true) {
        return false;
      }
      // Filter by search term (name, operator, country codes)
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = topup.name?.toLowerCase().includes(searchLower);
      const operatorMatch = (typeof topup.operator === 'string' ? topup.operator : (topup.operator?.title || ''))?.toLowerCase().includes(searchLower);
      const countryMatch = topup.country_codes?.some(code => code.toLowerCase().includes(searchLower));
      return nameMatch || operatorMatch || countryMatch;
    });
    setFilteredTopups(filtered);
  }, [topups, searchTerm, showHiddenFilter]);

  // Load topups from Firestore (client-side, same as frontend)
  const loadTopupsFromSupabase = async () => {
    try {
      console.log('📦 Fetching topups from Firestore...');
      
      const allPlans = [];
      for (const coll of ['dataplans', 'dataplans-unlimited', 'dataplans-sms']) {
        const snap = await getDocs(collection(db, coll));
        snap.docs.forEach(d => allPlans.push({ id: d.id, ...d.data(), _collection: coll }));
      }
      
      // Filter for topups (rechargeability === 'rechargeable' or has topup indicators)
      const allTopupsData = allPlans.filter(plan => {
        const isTopup = plan.rechargeability === 'rechargeable' || plan.rechargeability === 'topup' ||
          (plan.topups && Array.isArray(plan.topups) && plan.topups.length > 0) ||
          (plan.slug || '').toLowerCase().includes('topup') ||
          (plan.name || plan.title || '').toLowerCase().includes('topup');
        return isTopup;
      });
      
      setTopups(allTopupsData);
      console.log(`📦 Loaded ${allTopupsData.length} topups from Firestore`);
    } catch (error) {
      console.error('❌ Error loading topups:', error);
      toast.error(`Error loading topups: ${error.message}`);
    }
  };

  // Load countries from Firestore (client-side, same as frontend - no Firebase Admin needed)
  const loadCountriesFromSupabase = async () => {
    try {
      setLoading(true);
      console.log('🌍 Fetching countries from Firestore...');
      
      // Load countries directly from Firestore
      const countriesSnapshot = await getDocs(collection(db, 'countries'));
      const countriesData = countriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          code: doc.id,
          name: data.name || data.country_name || doc.id,
          flagImage: data.flag || data.flag_url || null,
          flagEmoji: getFlagEmoji(doc.id),
          is_visible: data.hidden !== true,
          status: data.hidden !== true ? 'active' : 'inactive',
          country_name: data.name || data.country_name || doc.id,
          country_name_ru: data.country_name_ru || null,
          hidden: data.hidden === true,
        };
      });
      
      if (countriesData.length === 0) {
        setCountries([]);
        setFilteredCountries([]);
        toast.error('No countries found in database');
        return;
      }
      
      // Load plans from Firestore for plan counts and minPrice
      let allPlans = [];
      for (const coll of ['dataplans', 'dataplans-unlimited', 'dataplans-sms']) {
        const snap = await getDocs(collection(db, coll));
        snap.docs.forEach(d => allPlans.push({ id: d.id, ...d.data() }));
      }
      const enabledPlans = allPlans.filter(plan => plan.enabled !== false && plan.hidden !== true);
      
      const countriesWithPlans = countriesData.map(country => {
        const countryPlans = enabledPlans.filter(plan =>
          (plan.country_codes && Array.isArray(plan.country_codes) && plan.country_codes.includes(country.code)) ||
          (plan.country_ids && Array.isArray(plan.country_ids) && plan.country_ids.includes(country.code))
        );
        
        if (countryPlans.length > 0) {
          const prices = countryPlans.map(p => parseFloat(p.price) || 0).filter(price => price > 0);
          const minPrice = prices.length > 0 ? Math.round(Math.min(...prices)) : null;
          return { ...country, minPrice, planCount: countryPlans.length, hasPlans: true };
        }
        return { ...country, minPrice: null, planCount: 0, hasPlans: false };
      });
      
      setCountries(countriesWithPlans);
      setFilteredCountries(countriesWithPlans);
      console.log('✅ Loaded', countriesWithPlans.length, 'countries from Firestore');
    } catch (error) {
      console.error('❌ Error loading countries:', error);
      toast.error(`Error loading countries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Hide/Show countries functionality
  const toggleCountrySelection = (countryCode) => {
    setSelectedCountries(prev => 
      prev.includes(countryCode)
        ? prev.filter(code => code !== countryCode)
        : [...prev, countryCode]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCountries.length === filteredCountries.length) {
      setSelectedCountries([]);
    } else {
      setSelectedCountries(filteredCountries.map(country => country.code));
    }
  };

  const hideSelectedCountries = async () => {
    if (selectedCountries.length === 0) {
      toast.error('Please select at least one country to hide');
      return;
    }

    if (!window.confirm(`Hide ${selectedCountries.length} selected country/countries? They will not be deleted but will be hidden from the list.`)) {
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      for (const countryCode of selectedCountries) {
        const countrySnapshot = await getDocs(
          query(collection(db, 'countries'), where('code', '==', countryCode))
        );
        countrySnapshot.forEach(doc => {
          batch.update(doc.ref, { hidden: true });
        });
      }
      
      await batch.commit();
      toast.success(`Successfully hid ${selectedCountries.length} country/countries`);
      setSelectedCountries([]);
      await loadCountriesFromSupabase();
    } catch (error) {
      console.error('❌ Error hiding countries:', error);
      toast.error(`Error hiding countries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const unhideSelectedCountries = async () => {
    if (selectedCountries.length === 0) {
      toast.error('Please select at least one country to unhide');
      return;
    }

    if (!window.confirm(`Unhide ${selectedCountries.length} selected country/countries? They will be visible in the list again.`)) {
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(db);
      
      for (const countryCode of selectedCountries) {
        const countrySnapshot = await getDocs(
          query(collection(db, 'countries'), where('code', '==', countryCode))
        );
        countrySnapshot.forEach(doc => {
          batch.update(doc.ref, { hidden: false });
        });
      }
      
      await batch.commit();
      toast.success(`Successfully unhid ${selectedCountries.length} country/countries`);
      setSelectedCountries([]);
      await loadCountriesFromSupabase();
    } catch (error) {
      console.error('❌ Error unhiding countries:', error);
      toast.error(`Error unhiding countries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllPlans = async () => {
    if (!window.confirm(`Are you sure you want to delete ALL countries and plans from Firestore? This action cannot be undone. You can resync plans after deletion.`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Deleting all countries and plans from Firestore...');
      
      const MAX_BATCH = 500;
      const collections = ['countries', 'dataplans', 'dataplans-unlimited', 'dataplans-sms'];
      let totalDeleted = { countries: 0, packages: 0 };
      
      for (const collName of collections) {
        const snap = await getDocs(collection(db, collName));
        let batch = writeBatch(db);
        let count = 0;
        
        for (const d of snap.docs) {
          batch.delete(d.ref);
          count++;
          if (collName === 'countries') totalDeleted.countries++;
          else totalDeleted.packages++;
          if (count >= MAX_BATCH) {
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
        if (count > 0) await batch.commit();
      }
      
      console.log(`✅ Deleted ${totalDeleted.countries} countries and ${totalDeleted.packages} packages from Firestore`);
      toast.success(`Successfully deleted ${totalDeleted.countries} countries and ${totalDeleted.packages} packages`);
      await loadCountriesFromSupabase();
    } catch (error) {
      console.error('❌ Error deleting all plans:', error);
      toast.error(`Error deleting plans: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save plans to Firestore helper function
  const savePlansToFirestore = async (plans, filterType = 'all', filterValue = null) => {
    let savedCount = 0;
    let filteredCount = 0;
    const MAX_BATCH_SIZE = 500; // Firestore batch limit
    let batch = writeBatch(db);
    let batchCount = 0;

    console.log(`🔍 Filtering ${plans.length} plans with filterType: ${filterType}`);
    
    // Count topup packages
    const topupCount = plans.filter(p => p.is_topup === true).length;
    const globalTopupCount = plans.filter(p => p.is_topup === true && (p.is_global === true || (p.country_codes || []).length >= 10)).length;
    console.log(`📊 Package stats: ${topupCount} topup packages, ${globalTopupCount} global topup packages`);
    
    // Pre-filter analysis for regional packages
    if (filterType === 'region') {
      const plansWithRegionalKeywords = plans.filter(p => {
        const name = (p.name || '').toLowerCase();
        const slug = (p.slug || '').toLowerCase();
        const region = (p.region || '').toLowerCase();
        return name.includes('regional') || name.includes('europe') || name.includes('asia') || 
               name.includes('africa') || name.includes('americas') || slug.includes('regional') ||
               region !== '' || p.is_regional === true || p.type === 'regional';
      });
      const plansWithMultipleCountries = plans.filter(p => (p.country_codes || []).length >= 2);
      console.log(`📊 Pre-filter regional analysis:`, {
        totalPlans: plans.length,
        withRegionalKeywords: plansWithRegionalKeywords.length,
        withMultipleCountries: plansWithMultipleCountries.length,
        withIsRegionalFlag: plans.filter(p => p.is_regional === true).length,
        withRegionalType: plans.filter(p => p.type === 'regional').length,
        withRegionField: plans.filter(p => p.region && p.region !== '').length
      });
    }

    for (const plan of plans) {
      // Apply filters
      if (filterType === 'country' && filterValue) {
        // Filter by selected countries - check both country_codes and country_ids
        const planCountries = [
          ...(plan.country_codes || []),
          ...(plan.country_ids || [])
        ];
        // Normalize country codes (uppercase for comparison)
        const normalizedPlanCountries = planCountries.map(c => (c || '').toUpperCase());
        const normalizedFilterCountries = filterValue.map(c => (c || '').toUpperCase());
        
        // Include if any country matches, or if it's a global/regional package that might include the country
        const hasMatchingCountry = normalizedPlanCountries.some(code => 
          normalizedFilterCountries.includes(code)
        );
        
        // Also include global/regional packages as they cover all/many countries
        const isGlobalOrRegional = plan.is_global === true || plan.is_regional === true ||
                                   plan.type === 'global' || plan.type === 'regional';
        
        if (!hasMatchingCountry && !isGlobalOrRegional) {
          filteredCount++;
          continue;
        }
      } else if (filterType === 'region') {
        // Filter by regional packages - EXTREMELY INCLUSIVE: anything that's not clearly global or single-country
        const planCountries = plan.country_codes || plan.country_ids || [];
        const planName = (plan.name || plan.title || '').toLowerCase();
        const planSlug = (plan.slug || '').toLowerCase();
        const planType = (plan.type || '').toLowerCase();
        const planRegion = (plan.region || plan.region_slug || '').toLowerCase();
        const countryCount = planCountries.length;
        
        // Check if it's clearly global - if so, exclude it
        const isClearlyGlobal = 
          plan.is_global === true || 
          planType === 'global' ||
          planType === 'multi-country' ||
          planRegion === 'global' ||
          (planName.includes('global') && !planName.includes('regional')) ||
          planName.includes('worldwide') ||
          (planName.includes('world') && !planName.includes('world cup')) ||
          planSlug.includes('discover') ||
          (countryCount >= 20); // Only exclude if 20+ countries (very high threshold)
        
        // Check if it's clearly single-country - exclude these
        const isSingleCountry = countryCount === 1 && !plan.is_regional && planType !== 'regional';
        
        // Regional keywords - very broad list
        const hasRegionalKeywords = 
          planName.includes('regional') ||
          planName.includes('region') ||
          planName.includes('europe') ||
          planName.includes('asia') ||
          planName.includes('africa') ||
          planName.includes('americas') ||
          planName.includes('america') ||
          planName.includes('caribbean') ||
          planName.includes('latin') ||
          planName.includes('middle-east') ||
          planName.includes('middle east') ||
          planName.includes('mena') ||
          planName.includes('gcc') ||
          planName.includes('asean') ||
          planName.includes('oceania') ||
          planName.includes('scandinavia') ||
          planSlug.includes('regional') ||
          planSlug.includes('region') ||
          planSlug.includes('europe') ||
          planSlug.includes('asia') ||
          planSlug.includes('africa') ||
          planSlug.includes('americas') ||
          planType === 'regional' ||
          (planRegion && planRegion !== '' && planRegion !== 'global');
        
        // Regional if: NOT clearly global AND (has is_regional flag OR has 2+ countries OR has regional keywords OR has region field)
        // EXTREMELY INCLUSIVE - include anything with regional indicators, even if country count is 0 or 1
        // This is because some regional packages might not have country codes in the API response
        const isRegional = 
          !isClearlyGlobal && (
            plan.is_regional === true || 
            planType === 'regional' ||
            countryCount >= 2 || // ANY package with 2+ countries
            hasRegionalKeywords || // OR has regional keywords (even with 0-1 countries)
            (planRegion && planRegion !== '' && planRegion !== 'global') // OR has a region field set
          );
        
        if (!isRegional) {
          filteredCount++;
          if (filteredCount <= 20) {
            console.log(`⏭️ Filtered out (not regional) #${filteredCount}:`, {
              name: plan.name,
              country_codes: plan.country_codes?.slice(0, 3),
              country_count: countryCount,
              is_regional: plan.is_regional,
              type: plan.type,
              region: plan.region,
              isClearlyGlobal,
              isSingleCountry,
              hasRegionalKeywords,
              reason: isClearlyGlobal ? 'clearly global' : (isSingleCountry ? 'single country' : 'no regional indicators')
            });
          }
          continue;
        }
        
        // Log included regional packages for debugging
        if (savedCount < 30) {
          console.log(`✅ Including regional package ${savedCount + 1}:`, {
            name: plan.name,
            country_count: countryCount,
            country_codes: planCountries.slice(0, 5),
            is_regional: plan.is_regional,
            type: plan.type,
            region: plan.region,
            hasRegionalKeywords,
            isClearlyGlobal
          });
        }
      } else if (filterType === 'global') {
        // Filter by global packages - check both flag and type (very inclusive)
        const planCountries = plan.country_codes || plan.country_ids || [];
        const planName = (plan.name || plan.title || '').toLowerCase();
        const planSlug = (plan.slug || '').toLowerCase();
        const planType = (plan.type || '').toLowerCase();
        const planRegion = (plan.region || plan.region_slug || '').toLowerCase();
        
        const isGlobal = 
          plan.is_global === true || 
          planType === 'global' ||
          planType === 'multi-country' ||
          planRegion === 'global' ||
          planName.includes('global') ||
          planSlug.includes('global') ||
          planName.includes('worldwide') ||
          planName.includes('world') ||
          planSlug.includes('discover') ||
          planName.includes('discover') ||
          planName.includes('multi-country') ||
          planName.includes('multi country') ||
          (planCountries.length >= 10); // Lowered threshold
        
        if (!isGlobal) {
          filteredCount++;
          if (filteredCount <= 5) {
            console.log(`⏭️ Filtered out (not global):`, {
              name: plan.name,
              country_codes: plan.country_codes,
              country_count: (plan.country_codes || []).length,
              is_global: plan.is_global,
              type: plan.type
            });
          }
          continue;
        }
      }

      // Determine collection based on package type
      const collectionName = plan.is_topup === true ? 'topups' : 'dataplans';
      const planRef = doc(db, collectionName, plan.slug);
      const planData = {
        ...plan,
        updated_at: new Date(),
        synced_at: new Date().toISOString(),
        updated_by: 'country_sync'
      };
      
      // Add topup-specific fields if it's a topup package
      if (plan.is_topup === true) {
        planData.is_topup_package = true;
        planData.available_for_topup = true;
        planData.available_for_purchase = false;
        planData.status = 'active';
        planData.enabled = true;
      }
      
      batch.set(planRef, planData, { merge: true });
      batchCount++;
      savedCount++;
      
      if (savedCount <= 3) {
        console.log(`✅ Saving plan:`, {
          name: plan.name,
          country_codes: plan.country_codes,
          country_count: (plan.country_codes || []).length,
          is_global: plan.is_global,
          is_regional: plan.is_regional,
          is_topup: plan.is_topup,
          collection: collectionName
        });
      }

      // Commit batch if it reaches the limit
      if (batchCount >= MAX_BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log(`📊 Save summary: ${savedCount} saved, ${filteredCount} filtered out, ${plans.length - savedCount - filteredCount} skipped`);
    return savedCount;
  };

  // Sync packages by selected countries
  const syncBySelectedCountries = async () => {
    if (selectedCountries.length === 0) {
      toast.error('Please select at least one country to sync');
      return;
    }

    await syncPackages('country', selectedCountries);
  };

  // Sync packages by region
  const syncByRegion = async () => {
    await syncPackages('region');
  };

  // Sync global packages
  const syncGlobal = async () => {
    await syncPackages('global');
  };

  // Main sync function - fetch packages directly from Airalo API via Next.js API route
  const syncPackages = async (filterType = 'all', filterValue = null) => {
    try {
      setSyncing(true);
      const filterLabel = filterType === 'country' 
        ? `selected countries (${filterValue.length})`
        : filterType === 'region' 
        ? 'regional packages'
        : filterType === 'global'
        ? 'global packages'
        : 'all packages';
      
      setSyncStatus(`Fetching packages directly from Airalo API...`);

      if (!currentUser) {
        throw new Error('Please log in to sync packages');
      }

      // Get markup percentage from configuration
      const markupConfigRef = doc(db, 'config', 'pricing');
      const markupConfig = await getDoc(markupConfigRef);
      const markupPercentage = markupConfig.exists() ? (markupConfig.data().markup_percentage || 17) : 17;
      
      // Use Next.js API route to fetch raw packages from Airalo (server-side, handles secrets)
      console.log('🚀 Calling Next.js API route to fetch raw packages from Airalo...');
      const response = await fetch('/api/fetch-airalo-packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch packages: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch packages');
      }
      
      // Extract raw packages from response
      const allPackages = result.packages || [];
      
      console.log(`📦 Fetched ${allPackages.length} raw packages from Airalo API`);
      
      if (allPackages.length === 0) {
        throw new Error('No packages found in response');
      }
      
      // Process and format packages for saving
      // Airalo API returns plans, and each plan can have packages nested inside
      const formattedPlans = [];
      
      // Helper function to safely get nested values
      const getValue = (obj, ...keys) => {
        for (const key of keys) {
          if (obj && typeof obj === 'object' && key in obj) {
            return obj[key];
          }
        }
        return null;
      };
      
      // Debug: Log structure of first few packages
      console.log('🔍 Sample package structures:');
      for (let i = 0; i < Math.min(3, allPackages.length); i++) {
        const pkg = allPackages[i];
        console.log(`Package ${i + 1}:`, {
          id: pkg.id,
          title: pkg.title || pkg.name,
          hasPackages: !!pkg.packages,
          packagesLength: pkg.packages?.length || 0,
          hasOperators: !!pkg.operators,
          operatorsLength: pkg.operators?.length || 0,
          hasPrice: !!pkg.price,
          price: pkg.price,
          country_code: pkg.country_code,
          hasCountries: !!pkg.countries,
          countriesLength: pkg.countries?.length || 0,
          keys: Object.keys(pkg).slice(0, 20)
        });
        
        // If it has operators, show first operator structure
        if (pkg.operators && pkg.operators.length > 0) {
          const firstOp = pkg.operators[0];
          console.log(`  First operator:`, {
            id: firstOp.id,
            title: firstOp.title || firstOp.name,
            hasPackages: !!firstOp.packages,
            packagesLength: firstOp.packages?.length || 0
          });
          if (firstOp.packages && firstOp.packages.length > 0) {
            console.log(`    First package in operator:`, {
              id: firstOp.packages[0].id,
              title: firstOp.packages[0].title || firstOp.packages[0].name,
              price: firstOp.packages[0].price,
              amount: firstOp.packages[0].amount,
              day: firstOp.packages[0].day
            });
          }
        }
      }
      
      // Process plans - extract packages from nested structure (matching sync-airalo logic)
      // Look for plans that have packages (these are the actual plans with pricing data)
      const plansWithPackages = allPackages.filter(p => p.packages && Array.isArray(p.packages));
      console.log(`📦 Found ${plansWithPackages.length} plans with packages array`);
      
      // Also look for plans that have operators with packages
      const plansWithOperators = allPackages.filter(p => p.operators && Array.isArray(p.operators));
      console.log(`🏢 Found ${plansWithOperators.length} plans with operators array`);
      
      // Count total packages in operators
      let totalOperatorPackages = 0;
      for (const plan of plansWithOperators) {
        for (const operator of plan.operators || []) {
          if (operator.packages && Array.isArray(operator.packages)) {
            totalOperatorPackages += operator.packages.length;
          }
        }
      }
      console.log(`📊 Total packages in operators: ${totalOperatorPackages}`);
      
      // Process plans with direct packages
      for (const plan of plansWithPackages) {
        try {
          // Extract country codes from plan level - check countries array first (for regional/global)
          let planCountryCodes = [];
          if (plan.countries && Array.isArray(plan.countries)) {
            planCountryCodes = plan.countries.map(c => 
              typeof c === 'string' ? c : (c.country_code || c.code || c.id || c)
            ).filter(Boolean);
          } else if (plan.country_codes && Array.isArray(plan.country_codes)) {
            planCountryCodes = plan.country_codes;
          } else if (plan.country_code) {
            planCountryCodes = [plan.country_code];
          }
          
          // Check plan-level flags - also check if it has multiple countries (regional indicator)
          const hasMultipleCountries = planCountryCodes.length >= 2;
          const planIsGlobal = plan.is_global === true || plan.type === 'global' || plan.type === 'multi-country' || 
                              (planCountryCodes.length >= 10);
          const planIsRegional = plan.is_regional === true || plan.type === 'regional' || 
                                (hasMultipleCountries && planCountryCodes.length < 10);
          const planRegion = getValue(plan, 'region', 'region_slug') || '';
          
          // Extract packages from this plan
          for (const pkg of plan.packages) {
            try {
              // Skip packages with no valid price - these are likely country entries
              const pkgPrice = parseFloat(pkg.price) || 0;
              if (pkgPrice === 0) {
                continue;
              }
              
              const packageId = pkg.id || pkg.slug || `${plan.id}_${pkg.title || pkg.name}`;
              if (!packageId) continue;
              
              // Use package-level country codes if available, otherwise use plan-level
              let countryCodes = planCountryCodes;
              if (pkg.country_codes && Array.isArray(pkg.country_codes)) {
                countryCodes = pkg.country_codes;
              } else if (pkg.country_code) {
                countryCodes = [pkg.country_code];
              }
              
              const originalPrice = pkgPrice;
              const retailPrice = originalPrice > 0 ? Math.round(originalPrice * (1 + markupPercentage / 100)) : 0;
              
              // Extract operator name - handle both string and object formats (SDK returns object)
              let operatorName = '';
              const pkgOperator = getValue(pkg, 'operator');
              if (pkgOperator) {
                operatorName = typeof pkgOperator === 'string' ? pkgOperator : (pkgOperator.title || pkgOperator.name || '');
              }
              if (!operatorName) {
                const planOperator = getValue(plan, 'operator');
                operatorName = typeof planOperator === 'string' ? planOperator : (planOperator?.title || planOperator?.name || '');
              }
              
              // Format plan data
              formattedPlans.push({
                slug: String(packageId),
                name: getValue(pkg, 'name', 'title') || getValue(plan, 'name', 'title') || 'Unnamed Plan',
                description: getValue(pkg, 'description', 'short_info') || getValue(plan, 'description') || '',
                price: retailPrice,
                original_price: originalPrice,
                currency: getValue(pkg, 'currency') || getValue(plan, 'currency') || 'USD',
                country_codes: countryCodes,
                country_ids: countryCodes,
                capacity: getValue(pkg, 'capacity', 'amount', 'data') || 0,
                period: getValue(pkg, 'period', 'day', 'validity') || getValue(plan, 'period') || 0,
                operator: operatorName,
                type: getValue(pkg, 'type') || getValue(plan, 'type') || '',
                is_global: pkg.is_global === true || planIsGlobal || false,
                is_regional: pkg.is_regional === true || planIsRegional || false,
                region: getValue(pkg, 'region', 'region_slug') || planRegion,
                is_topup: pkg.is_topup === true || false,
                is_roaming: pkg.is_roaming === true || false,
                hidden: true
              });
            } catch (pkgError) {
              console.error('⚠️ Error processing nested package:', pkgError, pkg);
              continue;
            }
          }
        } catch (planError) {
          console.error('⚠️ Error processing plan with packages:', planError, plan);
          continue;
        }
      }
      
      // Process plans with operators (the actual structure we're getting)
      let operatorPackagesProcessed = 0;
      let operatorPackagesSkipped = 0;
      for (const plan of plansWithOperators) {
        try {
          // Extract country codes from plan level - check both country_code and countries array
          let planCountryCodes = [];
          if (plan.countries && Array.isArray(plan.countries)) {
            planCountryCodes = plan.countries.map(c => 
              typeof c === 'string' ? c : (c.country_code || c.code || c.id || c)
            ).filter(Boolean);
          } else if (plan.country_codes && Array.isArray(plan.country_codes)) {
            planCountryCodes = plan.country_codes;
          } else if (plan.country_code) {
            planCountryCodes = [plan.country_code];
          }
          
          // Also check if operator has countries
          for (const operator of plan.operators) {
            // Extract country codes from operator if available - prioritize operator's countries array
            // This is crucial for regional packages where operator has multiple countries
            let operatorCountryCodes = [];
            if (operator.countries && Array.isArray(operator.countries)) {
              operatorCountryCodes = operator.countries.map(c => 
                typeof c === 'string' ? c : (c.country_code || c.code || c.id || c)
              ).filter(Boolean);
            } else if (operator.country_codes && Array.isArray(operator.country_codes)) {
              operatorCountryCodes = operator.country_codes;
            } else if (operator.country_code) {
              operatorCountryCodes = [operator.country_code];
            }
            
            // If operator has no countries, fall back to plan's countries
            if (operatorCountryCodes.length === 0) {
              operatorCountryCodes = planCountryCodes;
            }
            
            // Log if operator has multiple countries (regional indicator)
            if (operatorCountryCodes.length >= 2) {
              console.log(`🌍 Operator "${operator.title || operator.name || operator.id}" has ${operatorCountryCodes.length} countries:`, operatorCountryCodes.slice(0, 5));
            }
            
            // Extract packages from this operator
            if (operator.packages && Array.isArray(operator.packages)) {
              for (const pkg of operator.packages) {
                try {
                  // Skip packages with no valid price
                  const pkgPrice = parseFloat(pkg.price || pkg.amount || pkg.cost) || 0;
                  if (pkgPrice === 0) {
                    operatorPackagesSkipped++;
                    if (operatorPackagesSkipped <= 3) {
                      console.log(`⏭️ Skipping operator package with no price:`, {
                        id: pkg.id,
                        title: pkg.title || pkg.name,
                        price: pkg.price,
                        amount: pkg.amount,
                        cost: pkg.cost
                      });
                    }
                    continue;
                  }
                  operatorPackagesProcessed++;
                  
                  const packageId = pkg.id || pkg.slug || `${operator.id || plan.id}_${pkg.title || pkg.name}`;
                  if (!packageId) continue;
                  
                  // Use country codes from operator (which may have multiple countries for regional packages)
                  let countryCodes = operatorCountryCodes;
                  // Also check package-level country codes
                  if (pkg.country_codes && Array.isArray(pkg.country_codes)) {
                    countryCodes = pkg.country_codes;
                  } else if (pkg.country_code) {
                    countryCodes = [pkg.country_code];
                  } else if (pkg.countries && Array.isArray(pkg.countries)) {
                    countryCodes = pkg.countries.map(c => 
                      typeof c === 'string' ? c : (c.country_code || c.code || c.id || c)
                    ).filter(Boolean);
                  }
                  
                  // Determine if this is regional based on country count (2+ countries = regional)
                  const hasMultipleCountries = countryCodes.length >= 2;
                  const isRegionalByCountryCount = hasMultipleCountries && countryCodes.length < 10;
                  
                  const originalPrice = pkgPrice;
                  const retailPrice = originalPrice > 0 ? Math.round(originalPrice * (1 + markupPercentage / 100)) : 0;
                  
                  // Extract operator name - handle both string and object formats
                  let operatorName = '';
                  const pkgOperator = getValue(pkg, 'operator');
                  if (pkgOperator) {
                    operatorName = typeof pkgOperator === 'string' ? pkgOperator : (pkgOperator.title || pkgOperator.name || '');
                  }
                  if (!operatorName) {
                    operatorName = getValue(operator, 'title', 'name') || getValue(plan, 'operator') || '';
                    // If plan.operator is also an object, extract title
                    if (operatorName && typeof operatorName === 'object') {
                      operatorName = operatorName.title || operatorName.name || '';
                    }
                  }
                  
                  // Format plan data
                  formattedPlans.push({
                    slug: String(packageId),
                    name: getValue(pkg, 'name', 'title') || getValue(operator, 'title', 'name') || getValue(plan, 'name', 'title') || 'Unnamed Plan',
                    description: getValue(pkg, 'description', 'short_info') || getValue(operator, 'description') || getValue(plan, 'description') || '',
                    price: retailPrice,
                    original_price: originalPrice,
                    currency: getValue(pkg, 'currency') || getValue(operator, 'currency') || getValue(plan, 'currency') || 'USD',
                    country_codes: countryCodes,
                    country_ids: countryCodes,
                    capacity: getValue(pkg, 'capacity', 'amount', 'data') || 0,
                    period: getValue(pkg, 'period', 'day', 'validity') || getValue(operator, 'period') || getValue(plan, 'period') || 0,
                    operator: operatorName,
                    type: getValue(pkg, 'type') || getValue(operator, 'type') || getValue(plan, 'type') || '',
                    is_global: pkg.is_global === true || plan.is_global === true || (countryCodes.length >= 10) || false,
                    is_regional: pkg.is_regional === true || plan.is_regional === true || isRegionalByCountryCount || false,
                    region: getValue(pkg, 'region', 'region_slug') || getValue(operator, 'region') || getValue(plan, 'region', 'region_slug') || '',
                    is_topup: pkg.is_topup === true || false,
                    is_roaming: pkg.is_roaming === true || operator.is_roaming === true || plan.is_roaming === true || false,
                    hidden: true
                  });
                } catch (pkgError) {
                  console.error('⚠️ Error processing operator package:', pkgError, pkg);
                  continue;
                }
              }
            }
          }
        } catch (planError) {
          console.error('⚠️ Error processing plan with operators:', planError, plan);
          continue;
        }
      }
      
      // Also process individual plans that are packages themselves (no nested structure)
      const plansWithoutNesting = allPackages.filter(p => 
        !p.packages && 
        !p.operators && 
        (p.price || p.amount || p.cost)
      );
      console.log(`📦 Found ${plansWithoutNesting.length} plans without nesting (direct packages)`);
      
      for (const plan of plansWithoutNesting) {
        try {
          // Skip if it looks like a country entry (no price)
          const planPrice = parseFloat(plan.price || plan.amount || plan.cost) || 0;
          if (planPrice === 0) {
            continue;
          }
          
          const packageId = plan.id || plan.slug;
          if (!packageId) continue;
          
          // Extract country codes
          let planCountryCodes = [];
          if (plan.countries && Array.isArray(plan.countries)) {
            planCountryCodes = plan.countries.map(c => 
              typeof c === 'string' ? c : (c.country_code || c.code || c.id || c)
            ).filter(Boolean);
          } else if (plan.country_codes && Array.isArray(plan.country_codes)) {
            planCountryCodes = plan.country_codes;
          } else if (plan.country_code) {
            planCountryCodes = [plan.country_code];
          }
          
          const planIsGlobal = plan.is_global === true || plan.type === 'global' || plan.type === 'multi-country';
          const planIsRegional = plan.is_regional === true || plan.type === 'regional';
          const planRegion = getValue(plan, 'region', 'region_slug') || '';
          
          const originalPrice = planPrice;
          const retailPrice = originalPrice > 0 ? Math.round(originalPrice * (1 + markupPercentage / 100)) : 0;
          
          // Extract operator name - handle both string and object formats (SDK returns object)
          let operatorName = '';
          const planOperator = getValue(plan, 'operator');
          if (planOperator) {
            operatorName = typeof planOperator === 'string' ? planOperator : (planOperator.title || planOperator.name || '');
          }
          
          formattedPlans.push({
            slug: String(packageId),
            name: getValue(plan, 'name', 'title') || 'Unnamed Plan',
            description: getValue(plan, 'description', 'short_info') || '',
            price: retailPrice,
            original_price: originalPrice,
            currency: getValue(plan, 'currency') || 'USD',
            country_codes: planCountryCodes,
            country_ids: planCountryCodes,
            capacity: getValue(plan, 'capacity', 'amount', 'data') || 0,
            period: getValue(plan, 'period', 'day', 'validity') || 0,
            operator: operatorName,
            type: getValue(plan, 'type') || '',
            is_global: planIsGlobal,
            is_regional: planIsRegional,
            region: planRegion,
            is_topup: plan.is_topup === true || false,
            is_roaming: plan.is_roaming === true || false,
            hidden: true
          });
        } catch (planError) {
          console.error('⚠️ Error processing direct plan:', planError, plan);
          continue;
        }
      }
      
      console.log(`✅ Formatted ${formattedPlans.length} plans from ${allPackages.length} raw packages`);
      console.log(`📊 Processing summary:`, {
        rawPackagesFromAPI: allPackages.length,
        plansWithPackages: plansWithPackages.length,
        plansWithOperators: plansWithOperators.length,
        totalOperatorPackages: totalOperatorPackages,
        operatorPackagesProcessed: operatorPackagesProcessed,
        operatorPackagesSkipped: operatorPackagesSkipped,
        plansWithoutNesting: plansWithoutNesting?.length || 0,
        formattedPlans: formattedPlans.length
      });
      
      // Calculate extraction efficiency
      const extractionRate = formattedPlans.length > 0 ? ((formattedPlans.length / allPackages.length) * 100).toFixed(1) : 0;
      console.log(`📈 Extraction rate: ${extractionRate}% (${formattedPlans.length} formatted from ${allPackages.length} raw)`);
      
      // Detailed analysis for regional packages
      const plansWithNoCountries = formattedPlans.filter(p => !p.country_codes || p.country_codes.length === 0);
      const plansWithOneCountry = formattedPlans.filter(p => p.country_codes && p.country_codes.length === 1);
      const plansWithTwoToNineCountries = formattedPlans.filter(p => {
        const count = (p.country_codes || []).length;
        return count >= 2 && count < 10;
      });
      const plansWithTenToNineteenCountries = formattedPlans.filter(p => {
        const count = (p.country_codes || []).length;
        return count >= 10 && count < 20;
      });
      const plansWithTwentyPlusCountries = formattedPlans.filter(p => {
        const count = (p.country_codes || []).length;
        return count >= 20;
      });
      
      console.log(`📊 Country code distribution:`, {
        noCountries: plansWithNoCountries.length,
        oneCountry: plansWithOneCountry.length,
        twoToNineCountries: plansWithTwoToNineCountries.length,
        tenToNineteenCountries: plansWithTenToNineteenCountries.length,
        twentyPlusCountries: plansWithTwentyPlusCountries.length
      });
      
      // Show sample of packages with no countries (might be regional but missing country codes)
      if (plansWithNoCountries.length > 0) {
        console.log(`⚠️ ${plansWithNoCountries.length} packages have NO country codes:`, 
          plansWithNoCountries.slice(0, 5).map(p => ({
            name: p.name,
            type: p.type,
            region: p.region,
            is_regional: p.is_regional,
            is_global: p.is_global
          }))
        );
      }
      
      // Debug: Log sample of formatted plans to see structure
      if (formattedPlans.length > 0) {
        console.log('📋 Sample formatted plan:', {
          name: formattedPlans[0].name,
          country_codes: formattedPlans[0].country_codes,
          country_codes_length: formattedPlans[0].country_codes?.length || 0,
          is_global: formattedPlans[0].is_global,
          is_regional: formattedPlans[0].is_regional,
          type: formattedPlans[0].type,
          region: formattedPlans[0].region
        });
        
        // Count how many have country codes
        const plansWithCountries = formattedPlans.filter(p => p.country_codes && p.country_codes.length > 0);
        const plansWithMultipleCountries = formattedPlans.filter(p => p.country_codes && p.country_codes.length >= 2);
        const plansWithManyCountries = formattedPlans.filter(p => p.country_codes && p.country_codes.length >= 10);
        const plansWith2to9Countries = formattedPlans.filter(p => {
          const count = (p.country_codes || []).length;
          return count >= 2 && count < 10;
        });
        console.log(`📊 Plan statistics:`, {
          total: formattedPlans.length,
          withCountries: plansWithCountries.length,
          withMultipleCountries: plansWithMultipleCountries.length,
          with2to9Countries: plansWith2to9Countries.length,
          withManyCountries: plansWithManyCountries.length,
          withIsGlobal: formattedPlans.filter(p => p.is_global === true).length,
          withIsRegional: formattedPlans.filter(p => p.is_regional === true).length
        });
        
        // Log sample regional packages
        const sampleRegional = formattedPlans.filter(p => {
          const count = (p.country_codes || []).length;
          return count >= 2 && count < 10;
        }).slice(0, 5);
        console.log(`🌍 Sample regional packages (2-9 countries):`, sampleRegional.map(p => ({
          name: p.name,
          country_codes: p.country_codes,
          country_count: p.country_codes?.length || 0,
          is_regional: p.is_regional
        })));
      }
      
      // Filter and save plans based on filter type
      setSyncStatus(`Filtering and saving ${filterLabel}...`);
      
      try {
        const savedCount = await savePlansToFirestore(formattedPlans, filterType, filterValue);
        setSyncStatus(`Successfully synced and saved ${savedCount} ${filterLabel}`);
        toast.success(`Sync completed: ${savedCount} ${filterLabel} synced and saved`, {
          duration: 5000,
        });
        await loadCountriesFromSupabase();
        await loadTopupsFromSupabase();
      } catch (saveError) {
        console.error('❌ Error saving plans:', saveError);
        setSyncStatus(`Error saving plans: ${saveError.message}`);
        toast.error(`Error saving plans: ${saveError.message}`);
      }
    } catch (error) {
      console.error('❌ Error fetching packages:', error);
      setSyncStatus(`Error: ${error.message}`);
      toast.error(`Error fetching packages: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };






  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              {/* Delete All Plans Button - Super Admin Only */}
              {hasPermission('delete_data') && (
                <button
                  onClick={deleteAllPlans}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Delete all plans and topups from database"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete All Plans
                </button>
              )}
            
            {/* Hide/Unhide Selected Button */}
            {selectedCountries.length > 0 && (
                <>
                {showHiddenFilter === 'hidden' ? (
                  <button
                    onClick={unhideSelectedCountries}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Unhide Selected ({selectedCountries.length})
                  </button>
                ) : (
                  <button
                    onClick={hideSelectedCountries}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide Selected ({selectedCountries.length})
                  </button>
                )}
                </>
            )}
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Status:</span>
            <button
              onClick={() => setShowHiddenFilter('visible')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showHiddenFilter === 'visible'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Visible
            </button>
            <button
              onClick={() => setShowHiddenFilter('hidden')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showHiddenFilter === 'hidden'
                  ? 'bg-gray-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hidden
            </button>
            <button
              onClick={() => setShowHiddenFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showHiddenFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </div>
          
          {/* Sync Status */}
          {syncStatus && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">{syncStatus}</p>
            </div>
          )}
        </div>
      </div>

      {/* Countries Grid */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading countries...</p>
          </div>
        ) : filteredCountries.length === 0 ? (
          <div className="p-8 text-center">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No countries found</h3>
            <p className="text-gray-600">Try adjusting your search terms</p>
          </div>
        ) : (
          <>
            {/* Select All Checkbox */}
            <div className="px-6 pt-6 pb-2 border-b border-gray-200">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                {selectedCountries.length === filteredCountries.length && filteredCountries.length > 0 ? (
                  <CheckSquare className="w-5 h-5 text-gray-900" />
                ) : (
                  <Square className="w-5 h-5 text-gray-400" />
                )}
                {selectedCountries.length === filteredCountries.length && filteredCountries.length > 0
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
              {filteredCountries.map((country) => {
                const isSelected = selectedCountries.includes(country.code);
                return (
                  <div 
                    key={country.id} 
                    className={`border rounded-lg p-4 transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => toggleCountrySelection(country.code)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 flex-1">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        {country.flagImage ? (
                          <img 
                            src={country.flagImage} 
                            alt={country.name || country.code}
                            className="w-8 h-6 object-cover rounded"
                            onError={(e) => {
                              // Fallback to emoji if image fails to load
                              e.target.style.display = 'none';
                              const emojiSpan = e.target.parentElement.querySelector('.flag-emoji-fallback');
                              if (emojiSpan) emojiSpan.style.display = 'inline';
                            }}
                          />
                        ) : null}
                        <span className="text-xl flag-emoji-fallback" style={{ display: country.flagImage ? 'none' : 'inline' }}>
                          {country.flagEmoji}
                        </span>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{country.name}</h3>
                          <p className="text-xs text-gray-600">{country.code}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Topups Table */}
      {showTopups && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Battery className="w-5 h-5" />
              Topups ({filteredTopups.length})
            </h2>
          </div>
          {filteredTopups.length === 0 ? (
            <div className="p-8 text-center">
              <Battery className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No topups found</h3>
              <p className="text-gray-600">Try adjusting your search terms or sync topups</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Countries</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTopups.map((topup) => (
                    <tr key={topup.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{topup.name || 'Unnamed'}</div>
                        <div className="text-xs text-gray-500">{topup.slug}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {typeof topup.operator === 'string' ? topup.operator : (topup.operator?.title || 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {topup.country_codes && topup.country_codes.length > 0 
                            ? topup.country_codes.slice(0, 3).join(', ') + (topup.country_codes.length > 3 ? '...' : '')
                            : 'N/A'}
                        </div>
                        {topup.is_global && <span className="text-xs text-blue-600">Global</span>}
                        {topup.is_regional && <span className="text-xs text-purple-600">Regional</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {topup.price ? `${topup.currency || 'USD'} ${topup.price}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {topup.capacity === -1 || topup.capacity === 0 ? 'Unlimited' : `${topup.capacity} GB`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{topup.period ? `${topup.period} days` : 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          topup.is_global ? 'bg-blue-100 text-blue-800' :
                          topup.is_regional ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {topup.is_global ? 'Global' : topup.is_regional ? 'Regional' : 'Country'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CountriesManagement;
