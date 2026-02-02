'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, writeBatch, addDoc, setDoc, serverTimestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, auth, functions } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone,
  Eye,
  EyeOff,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Globe,
  MapPin,
  ShoppingCart,
  Battery,
  CheckSquare,
  Square,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Availability Dropdown Component - Purchase and Topup are MUTUALLY EXCLUSIVE
const AvailabilityDropdown = ({ plan, onUpdate }) => {
  // Initialize from plan data - ensure only one can be true
  let purchaseAvailable = plan.available_for_purchase === true;
  let topupAvailable = plan.available_for_topup === true;
  
  // CRITICAL: If both are true, fix it based on slug
  if (purchaseAvailable && topupAvailable) {
    const slug = (plan.slug || '').toLowerCase();
    // If slug has "-topup" suffix, it's a topup package
    if (slug.includes('-topup') || slug.endsWith('-topup')) {
      purchaseAvailable = false;
      topupAvailable = true;
    } else {
      purchaseAvailable = true;
      topupAvailable = false;
    }
    
    // Auto-fix: Update Firestore immediately
    if (plan.id) {
      onUpdate(plan.id, { purchase: purchaseAvailable, topup: topupAvailable });
    }
  }
  
  const handlePurchaseChange = async (e) => {
    const newPurchaseValue = e.target.value === 'yes';
    // MUTUALLY EXCLUSIVE: If purchase is Yes, topup MUST be No
    await onUpdate(plan.id, { 
      purchase: newPurchaseValue, 
      topup: newPurchaseValue ? false : topupAvailable 
    });
  };
  
  const handleTopupChange = async (e) => {
    const newTopupValue = e.target.value === 'yes';
    // MUTUALLY EXCLUSIVE: If topup is Yes, purchase MUST be No
    await onUpdate(plan.id, { 
      purchase: newTopupValue ? false : purchaseAvailable, 
      topup: newTopupValue 
    });
  };
  
  // Determine which one is active (only one can be true)
  const isPurchaseActive = purchaseAvailable && !topupAvailable;
  const isTopupActive = topupAvailable && !purchaseAvailable;
  
  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <div className="flex items-center gap-2">
        <ShoppingCart className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <select
          value={isPurchaseActive ? 'yes' : 'no'}
          onChange={handlePurchaseChange}
          disabled={isTopupActive} // Disable if topup is active
          className={`text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${
            isTopupActive ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <option value="yes">Purchase: Yes</option>
          <option value="no">Purchase: No</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <Battery className="w-4 h-4 text-gray-500 flex-shrink-0" />
        <select
          value={isTopupActive ? 'yes' : 'no'}
          onChange={handleTopupChange}
          disabled={isPurchaseActive} // Disable if purchase is active
          className={`text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${
            isPurchaseActive ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <option value="yes">Topup: Yes</option>
          <option value="no">Topup: No</option>
        </select>
      </div>
    </div>
  );
};

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

const PlansManagement = () => {
  const { currentUser } = useAuth();

  // State Management
  const [loading, setLoading] = useState(false);
  const [allPlans, setAllPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [plansLoading, setPlansLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Ready to sync packages via SDK server');
  const [countryFlags, setCountryFlags] = useState({}); // Map of country code to flag image URL
  
  // Package type tab state
  const [packageTypeTab, setPackageTypeTab] = useState('countries'); // 'countries', 'global', 'regional'

  // Topup filter state
  const [showTopupsOnly, setShowTopupsOnly] = useState(false);
  const [showRegularOnly, setShowRegularOnly] = useState(false);
  
  // Hidden/unhidden filter state
  const [showHiddenFilter, setShowHiddenFilter] = useState('visible'); // 'visible', 'hidden', 'all'
  
  // SMS and Unlimited filter state
  const [showSMSOnly, setShowSMSOnly] = useState(false);
  const [showUnlimitedOnly, setShowUnlimitedOnly] = useState(false);

  // Price editing state
  const [editingPrices, setEditingPrices] = useState({});
  const [pendingPriceChanges, setPendingPriceChanges] = useState({});
  
  // Purchase/Topup availability state
  const [editingAvailability, setEditingAvailability] = useState({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [plansPerPage] = useState(100);
  
  // Selection state for hiding plans
  const [selectedPlans, setSelectedPlans] = useState([]);

  // Load plans and country flags on component mount
  useEffect(() => {
    if (currentUser) {
      loadAllPlans();
      loadCountryFlags();
    }
  }, [currentUser]);

  // Load country flag images from Firestore
  const loadCountryFlags = async () => {
    try {
      const countriesSnapshot = await getDocs(collection(db, 'countries'));
      const flagsMap = {};
      countriesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.code && data.flag) {
          flagsMap[data.code] = data.flag;
        }
      });
      setCountryFlags(flagsMap);
    } catch (error) {
      console.error('❌ Error loading country flags:', error);
    }
  };

  // Helper function to get flag (image URL or emoji)
  const getFlagDisplay = (countryCode) => {
    if (countryFlags[countryCode]) {
      return { type: 'image', url: countryFlags[countryCode] };
    }
    return { type: 'emoji', emoji: getFlagEmoji(countryCode) };
  };

  // Helper function to categorize plan as global or regional
  const categorizePlan = (plan) => {
    // STRICT: Match backend logic exactly
    const planType = (plan.type || '').toLowerCase();
    const planRegion = (plan.region || plan.region_slug || '').toLowerCase();
    const planName = (plan.name || plan.title || '').toLowerCase();
    const planSlug = (plan.slug || '').toLowerCase();
    
    // Check explicit backend flags first
    if (plan.is_global === true) {
      return 'global';
    }
    
    // Check is_regional flag OR parent_category (for sub-packages)
    if (plan.is_regional === true || plan.parent_category === 'regional') {
      return 'regional';
    }
    
    // Check if it's a global package
    if (planType === 'global' || 
        planRegion === 'global' || 
        planSlug === 'global' || 
        planName === 'global' ||
        planSlug.startsWith('discover') ||  // Discover/Discover+ are Airalo's global packages
        planName.startsWith('discover')) {
      return 'global';
    }
    
    // Check if it's a regional package (match known regional identifiers)
    const regionalIdentifiers = [
      'asia', 'europe', 'africa', 'americas', 'middle-east', 'middle east',
      'oceania', 'caribbean', 'latin-america', 'latin america',
      'north-america', 'south-america', 'central-america',
      'eastern-europe', 'western-europe', 'scandinavia',
      'asean', 'gcc', 'european-union', 'eu', 'mena',
      'middle-east-and-north-africa', 'middle-east-north-africa'
    ];
    
    if (planType === 'regional' || 
        regionalIdentifiers.includes(planSlug) || 
        regionalIdentifiers.includes(planName) ||
        (planRegion && planRegion !== '' && planRegion !== 'global' && regionalIdentifiers.includes(planRegion))) {
      return 'regional';
    }
    
    // Everything else is a country plan
    return 'other';
  };

  // Filter plans based on search, country, and package type tab
  useEffect(() => {
    let filtered = [...allPlans];

    // Filter out countries and parent containers - only show actual plans
    filtered = filtered.filter(plan => {
      // Skip parent containers (countries/regions)
      if (plan.is_parent === true) {
        return false;
      }
      
      // Skip entries that look like countries (no price, no valid capacity/period)
      // These are country listings that were accidentally synced as plans
      const price = plan.price;
      const hasValidPrice = price !== null && price !== undefined && price > 0;
      
      const capacity = plan.capacity;
      const hasValidCapacity = capacity && capacity !== 0 && capacity !== 'Unlimited' && capacity !== -1;
      
      const period = plan.period;
      const hasValidPeriod = period && period > 0;
      
      const hasPackages = plan.packages && Array.isArray(plan.packages) && plan.packages.length > 0;
      
      // Country entries typically have:
      // - price: 0 or null
      // - capacity: "Unlimited" or 0
      // - period: 0 or null
      // - No packages
      const looksLikeCountry = !hasValidPrice && 
                               (capacity === 'Unlimited' || capacity === 0 || capacity === null || capacity === undefined) &&
                               (!period || period === 0) &&
                               !hasPackages;
      
      if (looksLikeCountry) {
        // Additional check: if slug matches country name pattern exactly, it's definitely a country
        const slug = (plan.slug || '').toLowerCase().trim();
        const name = (plan.name || '').toLowerCase().trim();
        const slugFromName = name.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        
        if (slug && name && (slug === slugFromName || slug === name.replace(/\s+/g, '-'))) {
          return false; // Skip country entries
        }
      }
      
      // Keep plans that have actual plan data:
      // - Must have a valid price (> 0), OR
      // - Must have valid capacity AND period (not unlimited/0), OR
      // - Must have packages array
      return hasValidPrice || (hasValidCapacity && hasValidPeriod) || hasPackages;
    });
    
    // Filter by hidden/unhidden status
    if (showHiddenFilter === 'visible') {
      filtered = filtered.filter(plan => plan.hidden !== true);
    } else if (showHiddenFilter === 'hidden') {
      filtered = filtered.filter(plan => plan.hidden === true);
    }
    // If 'all', show both hidden and visible plans

    // Filter by topup/regular toggle
    if (showTopupsOnly && !showRegularOnly) {
      // Show ONLY topup packages - check both is_topup field and slug pattern
      filtered = filtered.filter(plan => {
        const isTopupField = plan.is_topup === true;
        const slug = (plan.slug || '').toLowerCase();
        const hasTopupInSlug = slug.includes('-topup') || slug.endsWith('topup');
        const isTopupAvailable = plan.available_for_topup === true;
        return isTopupField || hasTopupInSlug || isTopupAvailable;
      });
    } else if (showRegularOnly && !showTopupsOnly) {
      // Show ONLY regular (non-topup) packages
      filtered = filtered.filter(plan => {
        const isTopupField = plan.is_topup === true;
        const slug = (plan.slug || '').toLowerCase();
        const hasTopupInSlug = slug.includes('-topup') || slug.endsWith('topup');
        const isTopupAvailable = plan.available_for_topup === true;
        return !isTopupField && !hasTopupInSlug && !isTopupAvailable;
      });
    }
    // If both are true or both are false, show all packages

    // Filter by package type tab
    if (packageTypeTab === 'countries') {
      // 'countries' tab shows ONLY country plans (not global or regional)
      filtered = filtered.filter(plan => categorizePlan(plan) === 'other');
    } else if (packageTypeTab === 'global') {
      // Show all global plans including sub-plans
      filtered = filtered.filter(plan => categorizePlan(plan) === 'global' || plan.parent_category === 'global');
    } else if (packageTypeTab === 'regional') {
      // Show all regional plans including sub-plans
      filtered = filtered.filter(plan => categorizePlan(plan) === 'regional' || plan.parent_category === 'regional');
    }

    // Filter by SMS inclusion
    if (showSMSOnly) {
      filtered = filtered.filter(plan => {
        // Check if plan is from SMS collection (is_sms flag)
        const isFromSmsCollection = plan.is_sms === true;
        
        // Check if plan includes SMS (text or voice capabilities)
        const hasText = plan.text === true || plan.text === 'true' || plan.text === 'yes';
        const hasVoice = plan.voice === true || plan.voice === 'true' || plan.voice === 'yes';
        const hasSMS = plan.sms === true || plan.sms === 'true' || plan.sms === 'yes';
        
        // Also check plan name and description for SMS mentions
        const planName = (plan.name || '').toLowerCase();
        const planDesc = (plan.description || '').toLowerCase();
        const planSlug = (plan.slug || '').toLowerCase();
        const hasSMSInName = planName.includes('sms') || planName.includes('text');
        const hasSMSInDesc = planDesc.includes('sms') || planDesc.includes('text');
        
        return isFromSmsCollection || hasText || hasVoice || hasSMS || hasSMSInName || hasSMSInDesc;
      });
    }

    // Filter by unlimited data
    if (showUnlimitedOnly) {
      filtered = filtered.filter(plan => {
        // Check if plan is from unlimited collection (is_unlimited flag)
        const isFromUnlimitedCollection = plan.is_unlimited === true;
        
        const capacity = plan.capacity;
        const hasUnlimitedCapacity = capacity === -1 || capacity === 0 || capacity === 'Unlimited' || 
               (typeof capacity === 'string' && capacity.toLowerCase().includes('unlimited'));
        
        // Also check plan name for unlimited mentions
        const planName = (plan.name || '').toLowerCase();
        const hasUnlimitedInName = planName.includes('unlimited');
        
        return isFromUnlimitedCollection || hasUnlimitedCapacity || hasUnlimitedInName;
      });
    }

    // Filter by search term (including slug)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.name?.toLowerCase().includes(searchLower) ||
        plan.slug?.toLowerCase().includes(searchLower) ||
        plan.operator?.toLowerCase().includes(searchLower) ||
        (plan.country_codes || plan.country_ids || []).some(code => 
          code.toLowerCase().includes(searchLower)
        )
      );
    }

    setFilteredPlans(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [allPlans, searchTerm, packageTypeTab, showTopupsOnly, showRegularOnly, showHiddenFilter, showSMSOnly, showUnlimitedOnly]);

  // Plans Management Functions - Load from Firestore (client-side, same as frontend)
  const loadAllPlans = async () => {
    try {
      setLoading(true);
      
      console.log('📱 Fetching all plans from Firestore...');
      
      const allPlansRaw = [];
      for (const coll of ['dataplans', 'dataplans-unlimited', 'dataplans-sms']) {
        const snap = await getDocs(collection(db, coll));
        snap.docs.forEach(d => allPlansRaw.push({ id: d.id, ...d.data(), _collection: coll }));
      }
      
      if (allPlansRaw.length === 0) {
        setAllPlans([]);
        toast.error('No plans found in Firestore. Please sync plans first.');
        return;
      }
      
      // Transform Firestore plans to match expected format and categorize
      const allPlansData = allPlansRaw.map(plan => {
        // Determine if it's a topup based on rechargeability or other indicators
        const isTopup = plan.rechargeability === 'rechargeable' || plan.rechargeability === 'topup' || 
                       plan.is_topup === true || (plan.topups && Array.isArray(plan.topups) && plan.topups.length > 0);
        
        // Determine package type from package_type or type field
        const packageType = plan.package_type || plan.type || 'local';
        const isGlobal = packageType === 'global';
        const isRegional = packageType === 'regional';
        
        // Get country code if country_id exists (we'll need to fetch country info)
        // For now, we'll use the country_id and fetch country details if needed
        
        return {
          id: plan.id,
          slug: plan.slug || plan.id?.toString(),
          name: plan.name || plan.title,
          title: plan.title || plan.name,
          description: plan.description || '',
          price: plan.price || plan.price_usd || 0,
          price_usd: plan.price_usd || plan.price || 0,
          price_rub: plan.price_rub || 0,
          capacity: plan.capacity || plan.data_amount_mb || 0,
          data_amount: plan.data_amount || '',
          data_amount_mb: plan.data_amount_mb || plan.capacity || 0,
          period: plan.period || plan.validity_days || 0,
          validity_days: plan.validity_days || plan.period || 0,
          operator: plan.operator || '',
          is_active: plan.enabled !== false && plan.hidden !== true,
          status: (plan.enabled !== false && plan.hidden !== true) ? 'active' : 'inactive',
          package_type: packageType,
          type: packageType, // For categorizePlan function
          is_global: isGlobal,
          is_regional: isRegional,
          is_unlimited: plan.is_unlimited || false,
          is_sms: plan.sms_included || plan.is_sms || false,
          is_topup: isTopup,
          country_id: plan.country_id,
          country_codes: plan.country_codes || [],
          hidden: plan.hidden || false,
          enabled: plan.enabled !== false,
          // Additional fields
          rechargeability: plan.rechargeability || null,
          apn_type: plan.apn_type || null,
          apn_value: plan.apn_value || null,
          topups: plan.topups || null,
          last_synced_at: plan.last_synced_at,
          created_at: plan.created_at,
          updated_at: plan.updated_at,
          _source: 'firestore'
        };
      });
      
      // Categorize plans for statistics
      const plansData = allPlansData.filter(p => !p.is_topup && !p.is_unlimited && !p.is_sms);
      const unlimitedPlansData = allPlansData.filter(p => !p.is_topup && p.is_unlimited && !p.is_sms);
      const smsPlansData = allPlansData.filter(p => !p.is_topup && p.is_sms);
      const topupsData = allPlansData.filter(p => p.is_topup && !p.is_unlimited && !p.is_sms);
      const unlimitedTopupsData = allPlansData.filter(p => p.is_topup && p.is_unlimited && !p.is_sms);
      const smsTopupsData = allPlansData.filter(p => p.is_topup && p.is_sms);
      
      setAllPlans(allPlansData);
      console.log('✅ Loaded from Firestore:', {
        plans: plansData.length,
        unlimitedPlans: unlimitedPlansData.length,
        smsPlans: smsPlansData.length,
        topups: topupsData.length,
        unlimitedTopups: unlimitedTopupsData.length,
        smsTopups: smsTopupsData.length,
        total: allPlansData.length
      });

      // Debug: Log price information for global and regional packages (including topups)
      const globalPlans = allPlansData.filter(plan => categorizePlan(plan) === 'global');
      const regionalPlans = allPlansData.filter(plan => categorizePlan(plan) === 'regional');
      const topupsInData = allPlansData.filter(plan => plan.is_topup === true);
      const regionalTopups = topupsInData.filter(plan => plan.is_regional === true);
      
      console.log(`📊 Global packages: ${globalPlans.length}`);
      console.log(`📊 Regional packages: ${regionalPlans.length}`);
      console.log(`🔋 Total topups: ${topupsInData.length} (${regionalTopups.length} regional)`);

    } catch (error) {
      console.error('❌ Error loading plans:', error);
      toast.error('Error loading plans: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePlanPrice = async (planId, newPrice) => {
    try {
      setLoading(true);
      const planRef = doc(db, 'dataplans', planId);
      await updateDoc(planRef, {
        price: parseFloat(newPrice)
      });
      
      toast.success('Price updated to $' + newPrice + '!');
      await loadAllPlans();
    } catch (error) {
      console.error('❌ Error updating plan price:', error);
      toast.error('Error updating price: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (planId, newPrice) => {
    setPendingPriceChanges(prev => ({
      ...prev,
      [planId]: parseFloat(newPrice) || 0
    }));
  };

  const savePriceChange = async (planId) => {
    const newPrice = pendingPriceChanges[planId];
    if (newPrice !== undefined) {
      await updatePlanPrice(planId, newPrice);
      setEditingPrices(prev => ({ ...prev, [planId]: false }));
      setPendingPriceChanges(prev => ({ ...prev, [planId]: undefined }));
    }
  };

  const cancelPriceChange = (planId) => {
    setEditingPrices(prev => ({ ...prev, [planId]: false }));
    setPendingPriceChanges(prev => ({ ...prev, [planId]: undefined }));
  };

  const startEditingPrice = (planId) => {
    setEditingPrices(prev => ({ ...prev, [planId]: true }));
  };

  // Hide/Show plans functionality
  const togglePlanSelection = (planId) => {
    setSelectedPlans(prev => 
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedPlans.length === filteredPlans.length) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(filteredPlans.map(plan => plan.id));
    }
  };

  const hideSelectedPlans = async () => {
    if (selectedPlans.length === 0) {
      toast.error('Please select at least one plan to hide');
      return;
    }

    if (!window.confirm(`Hide ${selectedPlans.length} selected plan(s)? They will not be deleted but will be hidden from the list.`)) {
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(db);
      let successCount = 0;
      let skippedCount = 0;
      const skippedPlans = [];
      
      // Check each plan exists before updating - use correct collection
      for (const planId of selectedPlans) {
        // Find the plan in allPlans to get its collection
        const plan = allPlans.find(p => p.id === planId);
        
        if (!plan) {
          skippedCount++;
          skippedPlans.push(planId);
          console.warn(`⚠️ Plan not found in loaded plans: ${planId}`);
          continue;
        }
        
        // Determine collection based on plan properties
        let collectionName = plan._collection || 'dataplans'; // Use stored collection or default
        
        // Fallback: determine collection from plan properties if _collection not set
        if (!plan._collection) {
          if (plan.is_topup) {
            if (plan.is_unlimited) {
              collectionName = 'topups-unlimited';
            } else if (plan.is_sms) {
              collectionName = 'topups-sms';
            } else {
              collectionName = 'topups';
            }
          } else {
            if (plan.is_unlimited) {
              collectionName = 'dataplans-unlimited';
            } else if (plan.is_sms) {
              collectionName = 'dataplans-sms';
            } else {
              collectionName = 'dataplans';
            }
          }
        }
        
        const planRef = doc(db, collectionName, planId);
        const planDoc = await getDoc(planRef);
        
        if (planDoc.exists()) {
          batch.update(planRef, { hidden: true });
          successCount++;
          console.log(`✅ Will hide plan ${planId} from collection: ${collectionName}`);
        } else {
          skippedCount++;
          skippedPlans.push({ id: planId, collection: collectionName });
          console.warn(`⚠️ Plan document does not exist in ${collectionName}: ${planId}`);
        }
      }
      
      if (successCount > 0) {
        await batch.commit();
        if (skippedCount > 0) {
          toast.success(`Successfully hid ${successCount} plan(s). ${skippedCount} plan(s) not found and skipped.`, {
            duration: 5000
          });
          console.warn(`⚠️ Skipped plans (not found):`, skippedPlans);
        } else {
          toast.success(`Successfully hid ${successCount} plan(s)`);
        }
      } else {
        toast.error(`No plans were hidden. All ${selectedPlans.length} selected plan(s) do not exist in the database.`);
        console.error('❌ All selected plans do not exist:', selectedPlans);
      }
      
      setSelectedPlans([]);
      await loadAllPlans();
    } catch (error) {
      console.error('❌ Error hiding plans:', error);
      toast.error(`Error hiding plans: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const unhideSelectedPlans = async () => {
    if (selectedPlans.length === 0) {
      toast.error('Please select at least one plan to unhide');
      return;
    }

    if (!window.confirm(`Unhide ${selectedPlans.length} selected plan(s)? They will be visible in the list again.`)) {
      return;
    }

    try {
      setLoading(true);
      const batch = writeBatch(db);
      let successCount = 0;
      let skippedCount = 0;
      const skippedPlans = [];
      
      // Check each plan exists before updating - use correct collection
      for (const planId of selectedPlans) {
        // Find the plan in allPlans to get its collection
        const plan = allPlans.find(p => p.id === planId);
        
        if (!plan) {
          skippedCount++;
          skippedPlans.push(planId);
          console.warn(`⚠️ Plan not found in loaded plans: ${planId}`);
          continue;
        }
        
        // Determine collection based on plan properties
        let collectionName = plan._collection || 'dataplans'; // Use stored collection or default
        
        // Fallback: determine collection from plan properties if _collection not set
        if (!plan._collection) {
          if (plan.is_topup) {
            if (plan.is_unlimited) {
              collectionName = 'topups-unlimited';
            } else if (plan.is_sms) {
              collectionName = 'topups-sms';
            } else {
              collectionName = 'topups';
            }
          } else {
            if (plan.is_unlimited) {
              collectionName = 'dataplans-unlimited';
            } else if (plan.is_sms) {
              collectionName = 'dataplans-sms';
            } else {
              collectionName = 'dataplans';
            }
          }
        }
        
        const planRef = doc(db, collectionName, planId);
        const planDoc = await getDoc(planRef);
        
        if (planDoc.exists()) {
          batch.update(planRef, { hidden: false });
          successCount++;
          console.log(`✅ Will unhide plan ${planId} from collection: ${collectionName}`);
        } else {
          skippedCount++;
          skippedPlans.push({ id: planId, collection: collectionName });
          console.warn(`⚠️ Plan document does not exist in ${collectionName}: ${planId}`);
        }
      }
      
      if (successCount > 0) {
        await batch.commit();
        if (skippedCount > 0) {
          toast.success(`Successfully unhid ${successCount} plan(s). ${skippedCount} plan(s) not found and skipped.`, {
            duration: 5000
          });
          console.warn(`⚠️ Skipped plans (not found):`, skippedPlans);
        } else {
          toast.success(`Successfully unhid ${successCount} plan(s)`);
        }
      } else {
        toast.error(`No plans were unhidden. All ${selectedPlans.length} selected plan(s) do not exist in the database.`);
        console.error('❌ All selected plans do not exist:', selectedPlans);
      }
      
      setSelectedPlans([]);
      await loadAllPlans();
    } catch (error) {
      console.error('❌ Error unhiding plans:', error);
      toast.error(`Error unhiding plans: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  // Save plans to Firestore (frontend saves the data from backend)
  const savePlansToFirestore = async (plans) => {
    try {
      if (!plans || !Array.isArray(plans) || plans.length === 0) {
        console.warn('⚠️ No plans to save');
        return;
      }

      console.log(`💾 Saving ${plans.length} plans to Firestore...`);
      let batch = writeBatch(db);
      let batchCount = 0;
      const MAX_BATCH_SIZE = 500; // Firestore batch limit

      for (const plan of plans) {
        if (!plan.slug || !plan.name) {
          console.warn('⚠️ Skipping plan without slug or name:', plan);
          continue;
        }

        const planRef = doc(db, 'dataplans', plan.slug);
        
        // Check if document exists to preserve hidden status
        const existingDoc = await getDoc(planRef);
        const isNewDocument = !existingDoc.exists;

        const planData = {
          slug: plan.slug,
          name: plan.name,
          description: plan.description || '',
          price: plan.price || 0,
          original_price: plan.original_price || plan.price || 0,
          currency: plan.currency || 'USD',
          country_codes: plan.country_codes || [],
          country_ids: plan.country_codes || [],
          capacity: plan.capacity || 0,
          period: plan.period || 0,
          operator: plan.operator || '',
          status: 'active',
          type: plan.type || 'other',
          is_global: plan.is_global || false,
          is_regional: plan.is_regional || false,
          region: plan.region || '',
          is_topup: plan.is_topup || false,
          updated_at: serverTimestamp(),
          synced_at: new Date().toISOString(),
          updated_by: 'sdk_sync',
          provider: 'airalo',
          enabled: true,
          is_roaming: plan.is_roaming || false
        };

        // Only set hidden=True for new documents (preserve existing hidden status)
        if (isNewDocument) {
          planData.hidden = true;
        }

        // Add parent_package_id if it's a sub-plan
        if (plan.parent_package_id) {
          planData.parent_package_id = plan.parent_package_id;
          planData.parent_category = plan.type;
        }

        batch.set(planRef, planData, { merge: true });
        batchCount++;

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

      console.log(`✅ Successfully saved ${plans.length} plans to Firestore`);
    } catch (error) {
      console.error('❌ Error saving plans to Firestore:', error);
      throw error;
    }
  };

  // Sync plans from Airalo SDK Server
  const syncPlansFromAiralo = async () => {
    try {
      setPlansLoading(true);
      setSyncStatus('Syncing packages via SDK server...');

      // Check if user is authenticated
      if (!currentUser) {
        throw new Error('Please log in to sync packages');
      }

      // Get Firebase ID token for authentication
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Ensure user token is fresh
      const token = await user.getIdToken(true); // Force refresh
      console.log(`✅ User authenticated: ${user.email}`);
      
      // Call Firebase HTTP Function directly
      console.log(`🚀 Calling Firebase Cloud Function: sync_packages`);

      const functionUrl = 'https://us-central1-esim-f0e3e.cloudfunctions.net/sync_packages';

      console.log(`📞 Calling sync_packages function with authenticated user...`);
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();

      // Log full response for debugging
      console.log('📦 Cloud Function response:', JSON.stringify(result, null, 2));

      const { success, sync_id, message, status, error, synced_plans, plans_synced, global_count, regional_count, other_count } = result;
      
      if (!success) {
        // Function returned an error response
        const errorMsg = error || message || 'Sync failed';
        console.error('❌ Cloud Function returned error:', errorMsg);
        setSyncStatus(`Error: ${errorMsg}`);
        toast.error(`Sync failed: ${errorMsg}`, {
          duration: 7000,
        });
        return;
      }

      // Check if sync completed with data (synchronous response)
      if (status === 'completed' && synced_plans && Array.isArray(synced_plans)) {
        console.log(`✅ Sync completed with ${synced_plans.length} plans`);
        setSyncStatus(`Synced ${plans_synced} packages. Saving to Firestore...`);
        
        // Save plans to Firestore on frontend
        try {
          await savePlansToFirestore(synced_plans);
          setSyncStatus(`Successfully synced and saved ${plans_synced} packages (${global_count} global, ${regional_count} regional, ${other_count} other)`);
          toast.success(`Sync completed: ${plans_synced} packages synced and saved`, {
            duration: 5000,
          });
          loadAllPlans();
        } catch (saveError) {
          console.error('❌ Error saving plans:', saveError);
          setSyncStatus(`Error saving plans: ${saveError.message}`);
          toast.error(`Error saving plans: ${saveError.message}`, {
            duration: 7000,
          });
        }
        return;
      }

      // If no data returned but success, show message
      setSyncStatus(message || 'Sync completed');
      toast.success(message || 'Sync completed', {
        duration: 3000,
      });
      
      // Legacy code for background sync monitoring (if still needed)
      if (sync_id && sync_id !== 'unknown') {
        const statusRef = doc(db, 'sync_status', sync_id);
        const unsubscribe = onSnapshot(statusRef, async (snapshot) => {
          if (snapshot.exists()) {
            const statusData = snapshot.data();
            const currentStatus = statusData.status;
            
            console.log(`📊 Sync status update: ${currentStatus}`, statusData);
            
            if (currentStatus === 'completed') {
              const { plans_synced, global_count, regional_count, other_count, message: statusMessage, synced_plans } = statusData;
              
              // Log synced plans data if available
              if (synced_plans && Array.isArray(synced_plans) && synced_plans.length > 0) {
                console.log(`📦 Received ${synced_plans.length} synced plans from sync_status:`, synced_plans.slice(0, 5));
                console.log(`✅ Total plans synced: ${plans_synced}, Plans data available: ${synced_plans.length}`);
                
                // Save plans to Firestore on frontend (like before - frontend saves, not backend)
                setSyncStatus('Saving plans to Firestore...');
                try {
                  await savePlansToFirestore(synced_plans);
                  setSyncStatus(`Synced ${plans_synced} packages (${global_count} global, ${regional_count} regional, ${other_count} other)`);
                  toast.success(`Sync completed: ${plans_synced} packages synced and saved`, {
                    duration: 5000,
                  });
                } catch (saveError) {
                  console.error('❌ Error saving plans:', saveError);
                  setSyncStatus(`Error saving plans: ${saveError.message}`);
                  toast.error(`Error saving plans: ${saveError.message}`, {
                    duration: 7000,
                  });
                }
              } else {
                setSyncStatus(`Synced ${plans_synced} packages (${global_count} global, ${regional_count} regional, ${other_count} other)`);
                toast.success(`Sync completed: ${plans_synced} packages synced`, {
                  duration: 5000,
                });
              }
              
              // Reload plans from Firestore
              loadAllPlans();
              
              // Unsubscribe after completion
              unsubscribe();
            } else if (currentStatus === 'failed') {
              const errorMsg = statusData.error || 'Sync failed';
              setSyncStatus(`Sync failed: ${errorMsg}`);
              toast.error(`Sync failed: ${errorMsg}`, {
                duration: 7000,
              });
              unsubscribe();
            } else if (currentStatus === 'running' || currentStatus === 'started') {
              const progressMessage = statusData.message || 'Sync in progress...';
              const plansCount = statusData.plans_synced || 0;
              setSyncStatus(`${progressMessage} (${plansCount} plans synced so far)`);
            }
          }
        }, (error) => {
          console.error('❌ Error listening to sync status:', error);
          setSyncStatus('Error monitoring sync status');
          toast.error('Error monitoring sync status', {
            duration: 5000,
          });
        });
        
        // Set timeout to stop listening after 5 minutes
        setTimeout(() => {
          unsubscribe();
          console.log('⏱️ Stopped monitoring sync status after timeout');
        }, 5 * 60 * 1000);
      } else {
        console.warn('⚠️ No sync_id returned from function');
        setSyncStatus('Sync started but no sync_id received');
      }
    } catch (error) {
      console.error('❌ Error syncing packages from Cloud Function:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        stack: error.stack
      });
      
      setSyncStatus(`Error: ${error.message}`);
      toast.error(`Error syncing packages: ${error.message}`);
    } finally {
      setPlansLoading(false);
    }
  };

  // Count plans by type (excluding parent containers)
  // Note: Hidden filter is applied separately in the filter logic
  const actualPlans = allPlans.filter(plan => !plan.is_parent);
  const visiblePlans = actualPlans.filter(plan => plan.hidden !== true);
  // Count visible plans by type for display (hidden plans excluded from counts)
  const countryPlansCount = visiblePlans.filter(plan => categorizePlan(plan) === 'other').length;
  const globalPlansCount = visiblePlans.filter(plan => categorizePlan(plan) === 'global' || plan.parent_category === 'global').length;
  const regionalPlansCount = visiblePlans.filter(plan => categorizePlan(plan) === 'regional' || plan.parent_category === 'regional').length;

  // Pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Simple pagination without expand/collapse
  const indexOfLastPlan = currentPage * plansPerPage;
  const indexOfFirstPlan = indexOfLastPlan - plansPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirstPlan, indexOfLastPlan);
  const totalPages = Math.ceil(filteredPlans.length / plansPerPage);

  return (
    <div className="space-y-6">
      {/* Package Type Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex gap-2 border-b border-gray-200 mb-4">
          <button
            onClick={() => setPackageTypeTab('countries')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              packageTypeTab === 'countries'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Countries ({countryPlansCount})
          </button>
          <button
            onClick={() => setPackageTypeTab('global')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              packageTypeTab === 'global'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global ({globalPlansCount})
          </button>
          <button
            onClick={() => setPackageTypeTab('regional')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              packageTypeTab === 'regional'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Regional ({regionalPlansCount})
          </button>
        </div>

        {/* Search Bar and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search plans by name, slug, operator..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div className="flex gap-4 items-center">
              {/* Hide Selected Button */}
              {selectedPlans.length > 0 && (
                showHiddenFilter === 'hidden' ? (
                  <button
                    onClick={unhideSelectedPlans}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    Unhide Selected ({selectedPlans.length})
                  </button>
                ) : (
                  <button
                    onClick={hideSelectedPlans}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide Selected ({selectedPlans.length})
                  </button>
                )
              )}
            </div>
          </div>

          {/* Package Type Filter Toggles */}
          <div className="flex gap-2 items-center flex-wrap">
            <span className="text-sm text-gray-600 font-medium">Show:</span>
            <button
              onClick={() => {
                setShowRegularOnly(!showRegularOnly);
                if (!showRegularOnly) setShowTopupsOnly(false);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showRegularOnly
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Regular Only
            </button>
            <button
              onClick={() => {
                setShowTopupsOnly(!showTopupsOnly);
                if (!showTopupsOnly) setShowRegularOnly(false);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                showTopupsOnly
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Topups Only
            </button>
            <button
              onClick={() => {
                setShowRegularOnly(false);
                setShowTopupsOnly(false);
              }}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                !showRegularOnly && !showTopupsOnly
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Packages
            </button>
            
            {/* Hidden/Visible Filter */}
            <div className="flex gap-2 items-center ml-4 pl-4 border-l border-gray-300">
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
          </div>
          
          {/* SMS, Unlimited, and Missing Price Filters */}
          <div className="flex gap-4 items-center flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSMSOnly}
                onChange={(e) => setShowSMSOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">SMS Included</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showUnlimitedOnly}
                onChange={(e) => setShowUnlimitedOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">Unlimited Data</span>
            </label>
          </div>
        </div>
        
        {/* Sync Status */}
        <div className="mt-3 text-sm text-gray-600">
          {syncStatus}
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Select All Checkbox */}
        {filteredPlans.length > 0 && (
          <div className="px-6 pt-4 pb-2 border-b border-gray-200">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              {selectedPlans.length === filteredPlans.length && filteredPlans.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-gray-900" />
              ) : (
                <Square className="w-5 h-5 text-gray-400" />
              )}
              {selectedPlans.length === filteredPlans.length && filteredPlans.length > 0
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data & Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Countries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPlans.length > 0 ? (
                currentPlans.map((plan) => {
                  const hasMissingPrice = plan.price === null || plan.price === undefined || plan.price === 0;
                  const planCategory = categorizePlan(plan);
                  
                  const isSelected = selectedPlans.includes(plan.id);
                  return (
                  <tr 
                    key={plan.id} 
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 border-l-4 border-blue-500' 
                        : hasMissingPrice ? 'bg-red-50' : ''
                    }`}
                    onClick={() => togglePlanSelection(plan.id)}
                  >
                    <td 
                      className="px-6 py-4 whitespace-nowrap" 
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePlanSelection(plan.id);
                      }}
                    >
                      <div className="flex items-center cursor-pointer">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full ${
                            planCategory === 'global' ? 'bg-purple-100' : 
                            planCategory === 'regional' ? 'bg-green-100' : 
                            'bg-blue-100'
                          } flex items-center justify-center`}>
                            {planCategory === 'global' ? (
                              <Globe className="w-5 h-5 text-purple-600" />
                            ) : planCategory === 'regional' ? (
                              <MapPin className="w-5 h-5 text-green-600" />
                            ) : (
                              <Smartphone className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {plan.name || 'Unnamed Plan'}
                          </div>
                          {plan.operator && (
                            <div className="text-sm text-gray-500">
                              {typeof plan.operator === 'string' ? plan.operator : (plan.operator.title || plan.operator.name || '')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                        {plan.slug || 'No slug'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {(() => {
                          const capacity = plan.capacity;
                          if (capacity === -1 || capacity === 0 || capacity === 'Unlimited' || capacity === null || capacity === undefined) {
                            return 'Unlimited';
                          }
                          // Convert to number if it's a string
                          const numCapacity = typeof capacity === 'string' ? parseFloat(capacity) : Number(capacity);
                          if (isNaN(numCapacity)) {
                            return 'N/A';
                          }
                          // If capacity is less than 1, it's likely already in GB
                          if (numCapacity < 1 && numCapacity > 0) {
                            return `${numCapacity.toFixed(2)} GB`;
                          }
                          // If capacity is between 1 and 100, assume it's in GB
                          if (numCapacity >= 1 && numCapacity <= 100) {
                            return `${numCapacity} GB`;
                          }
                          // If capacity is greater than 100, assume it's in MB and convert to GB
                          if (numCapacity > 100) {
                            const gb = numCapacity / 1024;
                            // If result is less than 1 GB, show in MB instead
                            if (gb < 1) {
                              return `${numCapacity} MB`;
                            }
                            return `${gb.toFixed(2)} GB`;
                          }
                          // Default: show as-is with GB
                          return `${numCapacity} GB`;
                        })()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {plan.period ? `${plan.period} days` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(plan.country_codes || plan.country_ids || []).length > 0 ? (
                          <>
                            {(plan.country_codes || plan.country_ids || []).slice(0, 3).map((code, index) => {
                              const flag = getFlagDisplay(code);
                              return (
                                <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {flag.type === 'image' ? (
                                    <>
                                      <img 
                                        src={flag.url} 
                                        alt={code}
                                        className="w-5 h-4 object-cover rounded mr-1 flag-img"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          const emojiSpan = e.target.parentElement.querySelector('.flag-emoji-fallback');
                                          if (emojiSpan) emojiSpan.style.display = 'inline';
                                        }}
                                      />
                                      <span className="flag-emoji-fallback" style={{ display: 'none' }}>
                                        {getFlagEmoji(code)}
                                      </span>
                                    </>
                                  ) : (
                                    <span>{flag.emoji}</span>
                                  )}
                                </span>
                              );
                            })}
                            {(plan.country_codes || plan.country_ids || []).length > 3 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                +{(plan.country_codes || plan.country_ids || []).length - 3}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            🌍
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center space-x-2">
                        {editingPrices[plan.id] ? (
                          <input
                            type="number"
                            value={pendingPriceChanges[plan.id] !== undefined ? pendingPriceChanges[plan.id] : (plan.price || 0)}
                            onChange={(e) => handlePriceChange(plan.id, e.target.value)}
                            className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            step="0.01"
                            min="0"
                            autoFocus
                          />
                        ) : (
                          <div
                            onClick={() => startEditingPrice(plan.id)}
                            className={`w-20 px-2 py-1 text-sm cursor-pointer hover:text-blue-600 transition-colors ${
                              plan.price === null || plan.price === undefined || plan.price === 0
                                ? 'text-red-600 font-semibold'
                                : 'text-gray-900'
                            }`}
                            title={
                              plan.price === null || plan.price === undefined || plan.price === 0
                                ? 'Price missing - click to set'
                                : 'Click to edit price'
                            }
                          >
                            {plan.price === null || plan.price === undefined || plan.price === 0
                              ? 'N/A'
                              : `$${typeof plan.price === 'number' ? plan.price.toFixed(2) : plan.price}`
                            }
                          </div>
                        )}
                        {editingPrices[plan.id] && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => savePriceChange(plan.id)}
                              disabled={loading}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => cancelPriceChange(plan.id)}
                              disabled={loading}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No plans found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredPlans.length > plansPerPage && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing {indexOfFirstPlan + 1} to {Math.min(indexOfLastPlan, filteredPlans.length)} of {filteredPlans.length} results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Previous</span>
                  <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                  // Show first page, last page, current page, and pages around current page
                  const shouldShow = 
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    Math.abs(pageNumber - currentPage) <= 1;
                  
                  if (!shouldShow) {
                    // Show ellipsis for gaps
                    if (pageNumber === 2 && currentPage > 3) {
                      return (
                        <span key={`ellipsis-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      );
                    }
                    if (pageNumber === totalPages - 1 && currentPage < totalPages - 2) {
                      return (
                        <span key={`ellipsis-${pageNumber}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNumber === currentPage
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Next</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlansManagement;