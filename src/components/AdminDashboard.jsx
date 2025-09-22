'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, writeBatch, addDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { getSettings, updateSettingsSection, resetSettingsToDefaults, validateSettings } from '../services/settingsService';
import { getAllReferralCodes, getReferralUsageStats, nukeAllReferralData } from '../services/referralService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Globe, 
  RefreshCw, 
  Trash2, 
  Edit, 
  Eye, 
  EyeOff, 
  Search,
  Download,
  AlertTriangle,
  Plus,
  MapPin,
  TrendingUp,
  Database,
  Activity,
  DollarSign,
  FileText,
  MessageSquare,
  Mail,
  Link,
  Phone,
  Building,
  Clock,
  Save,
  ExternalLink,
  Linkedin,
  Facebook,
  Instagram,
  Youtube,
  LogOut,
  Smartphone,
  Apple,
  Play,
  Briefcase,
  User,
  ChevronDown,
  ChevronRight,
  Gift,
  CreditCard
} from 'lucide-react';
import toast from 'react-hot-toast';
import BlogManagement from './BlogManagement';
import AdminEsimManagement from './AdminEsimManagement';
import ConfigurationManagement from './ConfigurationManagement';
import CountriesManagement from './CountriesManagement';
import PlansManagement from './PlansManagement';
import NotificationsManagement from './NotificationsManagement';
import LinksManagement from './LinksManagement';
import ContactRequestsManagement from './ContactRequestsManagement';
import NewsletterManagement from './NewsletterManagement';
import JobApplicationsManagement from './JobApplicationsManagement';

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

const AdminDashboard = () => {
  const { currentUser, logout } = useAuth();
  const { isAdmin, userRole, canManageCountries, canManagePlans, canManageConfig, canDeleteData, canManageBlog, canManageNewsletter, canManageContactRequests, loading: adminLoading } = useAdmin();
  const functions = getFunctions();

  // State Management - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState('countries');
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rawApiData, setRawApiData] = useState(null);

  
  // Plans Management
  const [allPlans, setAllPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [planSortBy, setPlanSortBy] = useState('price'); // 'price', 'name', 'country'
  const [planSortOrder, setPlanSortOrder] = useState('asc'); // 'asc', 'desc'
  const [planStatusFilter, setPlanStatusFilter] = useState('all'); // 'all', 'enabled', 'disabled'
  const [planCountryFilter, setPlanCountryFilter] = useState('all'); // 'all' or specific country code
  const [pendingPriceChanges, setPendingPriceChanges] = useState({}); // Track pending price changes
  const [editingPrices, setEditingPrices] = useState({}); // Track which prices are being edited
  
  
  
  
  
  
  // Referral Codes Management
  const [referralCodes, setReferralCodes] = useState([]);
  const [referralUsageStats, setReferralUsageStats] = useState({});
  const [loadingReferralCodes, setLoadingReferralCodes] = useState(false);
  
  // Withdrawal Requests Management
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState('all'); // all, pending, approved, rejected
  const [userWithdrawalRequests, setUserWithdrawalRequests] = useState([]);
  const [loadingUserWithdrawals, setLoadingUserWithdrawals] = useState(false);
  
  
  // User Dropdown Management
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Plans Modal Management
  const [showAttachPlanModal, setShowAttachPlanModal] = useState(false);
  
  // Countries for notifications
  const [regions, setRegions] = useState([]);
  const [showCreateRegionModal, setShowCreateRegionModal] = useState(false);
  const [newRegion, setNewRegion] = useState({
    name: '',
    code: '',
    description: '',
    minPrice: 0,
    icon: '🌍'
  });

  // Initialize data - ALL HOOKS MUST BE BEFORE CONDITIONAL RETURNS
  useEffect(() => {
    if (currentUser) {
      loadRegionsFromFirestore();
      loadReferralCodes();
      loadWithdrawalRequests();
    }
  }, [currentUser]);







  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAttachPlanModal && !event.target.closest('.dropdown-container')) {
        setShowAttachPlanModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachPlanModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest('.user-dropdown-container')) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserDropdown]);

  // Plans Management Functions
  const loadAllPlans = async () => {
    try {
      setLoading(true);
      const plansSnapshot = await getDocs(collection(db, 'dataplans'));
      const plans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        enabled: doc.data().enabled !== false // Default to enabled if not set
      }));
      
      setAllPlans(plans);
      setFilteredPlans(plans);
    } catch (error) {
      console.error('Error loading plans:', error);
      toast.error(`Error loading plans: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load plans when Plans tab is selected
  useEffect(() => {
    if (activeTab === 'plans' && allPlans.length === 0) {
      loadAllPlans();
    }
  }, [activeTab, allPlans.length, loadAllPlans]);

  // Filter and sort plans
  useEffect(() => {
    let filtered = [...allPlans];

    // Filter by status
    if (planStatusFilter !== 'all') {
      filtered = filtered.filter(plan => 
        planStatusFilter === 'enabled' ? plan.enabled : !plan.enabled
      );
    }

    // Filter by country
    if (planCountryFilter !== 'all') {
      filtered = filtered.filter(plan => 
        plan.country_codes?.includes(planCountryFilter) || 
        plan.country_ids?.includes(planCountryFilter)
      );
    }

    // Sort plans
    filtered.sort((a, b) => {
      if (planSortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (planSortBy === 'price') {
        return (a.price || 0) - (b.price || 0);
      } else if (planSortBy === 'country') {
        const aCountry = a.country_codes?.[0] || '';
        const bCountry = b.country_codes?.[0] || '';
        return aCountry.localeCompare(bCountry);
      }
      return 0;
    });

    setFilteredPlans(filtered);
  }, [allPlans, planStatusFilter, planCountryFilter, planSortBy]);

  // Error handling - AFTER ALL HOOKS
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Please log in</h2>
          <p className="text-gray-600">You need to be logged in to access the admin dashboard</p>
        </div>
      </div>
    );
  }


  // Configuration Functions






  const fetchCountriesFromAPI = async () => {
    try {
      setLoading(true);
      setSyncStatus('Syncing countries via Firebase Functions...');
      console.log('🔄 Starting to sync countries via Firebase Functions...');

      // Call Firebase Cloud Function instead of direct API
      const syncCountriesFunction = httpsCallable(functions, 'sync_countries_from_airalo');
      const result = await syncCountriesFunction();
      
      if (result.data.success) {
        const count = result.data.countries_synced || 0;
        console.log(`✅ Successfully synced ${count} countries via Firebase Functions`);
        setSyncStatus(`Successfully synced ${count} countries from Airalo API`);
        toast.success(`Successfully synced ${count} countries from Airalo API`);
      } else {
        throw new Error(result.data.error || 'Unknown error occurred');
      }


    } catch (error) {
      console.error('❌ Error fetching countries from API:', error);
      setSyncStatus(`Error: ${error.message}`);
      toast.error(`Error fetching countries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Currency conversion helper
  const convertToUSD = (amount, fromCurrency) => {
    const exchangeRates = {
      'CNY': 0.14,  // 1 CNY = 0.14 USD
      'THB': 0.028, // 1 THB = 0.028 USD
      'EUR': 1.08,  // 1 EUR = 1.08 USD
      'GBP': 1.27,  // 1 GBP = 1.27 USD
      'JPY': 0.0067, // 1 JPY = 0.0067 USD
      'USD': 1.0    // 1 USD = 1 USD
    };
    
    const rate = exchangeRates[fromCurrency.toUpperCase()] || 1.0;
    return parseFloat(amount) * rate;
  };

  const syncAllDataFromAPI = async () => {
    try {
      setLoading(true);
      
      if (!airaloClientId.trim()) {
        toast.error('Please configure Airalo Client ID first');
        return;
      }

      setSyncStatus('Fetching raw data from Airalo SANDBOX API...');
      
      // Get raw plans from Next.js API (no processing)
      console.log('🔄 Getting raw plans from Airalo SANDBOX API...');
      const response = await fetch('/api/sync-airalo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        console.log('🔍 API response:', result);
        
        const countries = result.countries || [];
        const plans = result.plans || [];
        
        console.log(`✅ Got ${countries.length} countries and ${plans.length} plans`);
        console.log('🔍 First plan:', plans[0]);
        
        setSyncStatus('Converting prices and saving to Firebase...');
        
        // Process and save countries + plans
        const batch = writeBatch(db);
        
        // Save countries
        countries.forEach(country => {
          if (country.countryCode && country.countryName) {
            const countryRef = doc(db, 'countries', country.countryCode);
            batch.set(countryRef, {
              name: country.countryName,
              code: country.countryCode,
              status: 'active',
              updated_at: new Date(),
              synced_at: new Date().toISOString()
            }, { merge: true });
          }
        });
        
        // Save plans with price conversion
        plans.forEach(plan => {
          if (plan.slug && plan.name) {
            // Extract price and currency from raw data
            const rawPrice = plan.retailPrice || plan.price || '0';
            const rawCurrency = plan.priceCurrency || plan.currency || 'USD';
            
            // Convert to USD
            const priceFloat = parseFloat(rawPrice) || 0;
            const usdPrice = rawCurrency === 'USD' ? priceFloat : convertToUSD(priceFloat, rawCurrency);
            
            console.log(`💰 Plan: ${plan.name} - ${rawPrice} ${rawCurrency} → $${usdPrice.toFixed(2)} USD`);
            
            const planRef = doc(db, 'dataplans', plan.slug);
            const countryData = plan.countries || [];
            const countryCodes = countryData.map(c => c.countryCode || c.code || c).filter(Boolean);
            
            batch.set(planRef, {
              slug: plan.slug,
              name: plan.name,
              description: plan.description || '',
              price: usdPrice, // Converted USD price
              currency: 'USD', // Always USD now
              originalPrice: priceFloat, // Keep original for reference
              originalCurrency: rawCurrency, // Keep original currency
              capacity: plan.capacity === -1 ? 'Unlimited' : (plan.capacity || 0),
              period: plan.period || 0,
              country_codes: countryCodes,
              operator: plan.operator || '',
              status: 'active',
              updated_at: new Date(),
              synced_at: new Date().toISOString()
            }, { merge: true });
          }
        });
        
        await batch.commit();
        console.log('✅ Successfully saved all data to Firebase');
        
        toast.success(`Successfully synced ${countries.length} countries and ${plans.length} plans`);
        setSyncStatus(`Successfully synced ${countries.length + plans.length} items from Airalo API`);
        
        // Refresh local data
        await loadCountriesFromFirestore();
        await loadAvailablePlans();
        
      } else {
        throw new Error(result.data.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('❌ Error syncing data:', error);
      toast.error(`Error syncing data: ${error.message}`);
      setSyncStatus(`Error syncing data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };












  const loadAvailablePlans = async () => {
    try {
      setLoading(true);
      
      // Load plans from Firebase directly (normal display)
      console.log('📱 Loading plans from Firebase...');
      const plansSnapshot = await getDocs(collection(db, 'dataplans'));
      const allPlans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out disabled plans
      const enabledPlans = allPlans.filter(plan => plan.enabled !== false);
      
      if (enabledPlans.length > 0) {

        
        // Transform plans to match expected format
        const transformedPlans = enabledPlans.map(plan => ({
          id: plan.slug || plan.id,
          name: plan.name,
          data: (plan.capacity === 'Unlimited' || plan.capacity === -1 || plan.capacity === 0) ? 'Unlimited GB' : (plan.capacity ? `${plan.capacity} GB` : 'N/A'),
          duration: plan.period ? `${plan.period} days` : 'N/A',
          price: plan.price || 0,
          currency: plan.currency || 'USD',
          country: plan.country_codes?.[0] || 'Multiple Countries',
          description: plan.description || '',
          capacity: (plan.capacity === -1 || plan.capacity === 0) ? 'Unlimited' : plan.capacity,
          period: plan.period,
          operator: plan.operator || '',
          country_codes: plan.country_codes || []
        }));
        
        const available = transformedPlans;
        
        setAvailablePlans(available);

        
        // Debug: Log the first few plans to see their structure
        if (available.length > 0) {
          console.log('🔍 First plan data:', available[0]);
          console.log('🔍 All plans price data:', available.map(p => ({ name: p.name, price: p.price, currency: p.currency })));
        }
        

        
      } else {
        // If no plans in Firebase, show message to sync first
        setAvailablePlans([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading plans from Firebase:', error);
      toast.error(`Error loading plans: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };






  // Referral Codes Management Functions
  const loadReferralCodes = async () => {
    try {
      setLoadingReferralCodes(true);
      
      // Load all referral codes
      const codesResult = await getAllReferralCodes();
      if (codesResult.success) {
        setReferralCodes(codesResult.referralCodes);
      } else {
        throw new Error(codesResult.error);
      }
      
      // Load usage statistics
      const statsResult = await getReferralUsageStats();
      if (statsResult.success) {
        setReferralUsageStats(statsResult.stats);
      }
    } catch (error) {
      console.error('❌ Error loading referral codes:', error);
      toast.error(`Error loading referral codes: ${error.message}`);
    } finally {
      setLoadingReferralCodes(false);
    }
  };

  const handleNukeReferralData = async () => {
    if (!window.confirm('⚠️ NUCLEAR OPTION: Are you absolutely sure you want to DELETE ALL referral data? This will permanently remove:\n\n• All referral code documents\n• All referral transactions\n• All referral codes from user accounts\n\nThis action CANNOT be undone!')) {
      return;
    }

    try {
      setLoadingReferralCodes(true);
      const result = await nukeAllReferralData();
      if (result.success) {
        toast.success(`💥 NUKED ${result.deletedCodes} referral codes and deleted ${result.deletedTransactions} transactions`);
        await loadReferralCodes(); // Reload to show updated data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('❌ Error nuking referral data:', error);
      toast.error(`Error nuking referral data: ${error.message}`);
    } finally {
      setLoadingReferralCodes(false);
    }
  };

  // Withdrawal Requests Management Functions
  const loadWithdrawalRequests = async () => {
    try {
      setLoadingWithdrawals(true);
      
      // Get all withdrawal requests from all users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const allWithdrawals = [];
      
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        // Get withdrawal transactions for this user
        const withdrawalsSnapshot = await getDocs(
          query(
            collection(db, 'users', userId, 'transactions'),
            where('method', '==', 'withdrawal'),
            orderBy('timestamp', 'desc')
          )
        );
        
        // Also get referral commission transactions (real earnings)
        const commissionSnapshot = await getDocs(
          query(
            collection(db, 'users', userId, 'transactions'),
            where('method', '==', 'referral_commission'),
            orderBy('timestamp', 'desc')
          )
        );
        
        withdrawalsSnapshot.docs.forEach(withdrawalDoc => {
          const withdrawalData = withdrawalDoc.data();
          allWithdrawals.push({
            id: withdrawalDoc.id,
            userId: userId,
            userEmail: userData.email || 'Unknown',
            userName: userData.displayName || userData.email || 'Unknown',
            bankAccount: userData.bankAccount || null,
            ...withdrawalData
          });
        });
        
        // Add commission transactions as earnings (not withdrawals)
        commissionSnapshot.docs.forEach(commissionDoc => {
          const commissionData = commissionDoc.data();
          allWithdrawals.push({
            id: commissionDoc.id,
            userId: userId,
            userEmail: userData.email || 'Unknown',
            userName: userData.displayName || userData.email || 'Unknown',
            bankAccount: userData.bankAccount || null,
            ...commissionData,
            type: 'commission' // Mark as commission for display
          });
        });
      }
      
      setWithdrawalRequests(allWithdrawals);
      console.log('✅ Loaded', allWithdrawals.length, 'withdrawal requests');
    } catch (error) {
      console.error('❌ Error loading withdrawal requests:', error);
      toast.error(`Error loading withdrawal requests: ${error.message}`);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  const handleUpdateWithdrawalStatus = async (withdrawalId, userId, newStatus) => {
    try {
      setLoadingWithdrawals(true);
      
      // Update the withdrawal transaction status
      const withdrawalRef = doc(db, 'users', userId, 'transactions', withdrawalId);
      await updateDoc(withdrawalRef, {
        status: newStatus,
        processedAt: new Date(),
        processedBy: currentUser.email
      });
      
      toast.success(`Withdrawal request ${newStatus} successfully`);
      await loadWithdrawalRequests(); // Reload to show updated data
    } catch (error) {
      console.error('❌ Error updating withdrawal status:', error);
      toast.error(`Error updating withdrawal status: ${error.message}`);
    } finally {
      setLoadingWithdrawals(false);
    }
  };

  // Group referral codes by owner
  const groupedReferralCodes = referralCodes.reduce((groups, code) => {
    const ownerEmail = code.ownerEmail;
    if (!groups[ownerEmail]) {
      groups[ownerEmail] = {
        ownerEmail,
        ownerId: code.ownerId,
        codes: [],
        totalUsage: 0
      };
    }
    groups[ownerEmail].codes.push(code);
    groups[ownerEmail].totalUsage += code.usageCount || 0;
    return groups;
  }, {});




  // User Dropdown Functions
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('❌ Error logging out:', error);
      toast.error(`Error logging out: ${error.message}`);
    }
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      setSettingsLoading(true);
      await resetSettingsToDefaults(currentUser?.uid);
      toast.success('Settings reset to defaults successfully!');
      await loadSettings();
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      toast.error(`Error resetting settings: ${error.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadRegionsFromFirestore = async () => {
    try {
      setLoading(true);
      const regionsSnapshot = await getDocs(collection(db, 'regions'));
      const regionsData = regionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRegions(regionsData);
      console.log('✅ Loaded', regionsData.length, 'regions from Firestore');
    } catch (error) {
      console.error('❌ Error loading regions:', error);
      toast.error(`Error loading regions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  const createRegion = async () => {
    if (!newRegion.name || !newRegion.code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      // Check if region with same code already exists
      const existingRegionQuery = query(
        collection(db, 'regions'),
        where('code', '==', newRegion.code.toUpperCase())
      );
      const existingRegionSnapshot = await getDocs(existingRegionQuery);
      
      if (!existingRegionSnapshot.empty) {
        toast.error(`Region with code "${newRegion.code}" already exists`);
        return;
      }
      
      const regionData = {
        name: newRegion.name,
        code: newRegion.code.toUpperCase(),
        description: newRegion.description,
        minPrice: newRegion.minPrice,
        icon: newRegion.icon,
        status: 'active',
        createdAt: new Date(),
        createdBy: currentUser?.uid || 'admin'
      };
      
      await addDoc(collection(db, 'regions'), regionData);
      
      toast.success(`Region "${newRegion.name}" created successfully!`);
      setShowCreateRegionModal(false);
      setNewRegion({
        name: '',
        code: '',
        description: '',
        minPrice: 0,
        icon: '🌍'
      });
      
      // Refresh regions list
      await loadRegionsFromFirestore();
    } catch (error) {
      console.error('❌ Error creating region:', error);
      toast.error(`Error creating region: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };






  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      setLoading(true);
      const planRef = doc(db, 'dataplans', planId);
      await updateDoc(planRef, {
        enabled: !currentStatus
      });
      
      // Update local state
      setAllPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, enabled: !currentStatus } : plan
      ));
      
      toast.success(`Plan ${!currentStatus ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error toggling plan status:', error);
      toast.error(`Error updating plan: ${error.message}`);
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
      
      // Update local state
      setAllPlans(prev => prev.map(plan => 
        plan.id === planId ? { ...plan, price: parseFloat(newPrice) } : plan
      ));
      
      // Clear pending changes for this plan
      setPendingPriceChanges(prev => {
        const newPending = { ...prev };
        delete newPending[planId];
        return newPending;
      });
      
      toast.success('Plan price updated successfully!');
    } catch (error) {
      console.error('Error updating plan price:', error);
      toast.error(`Error updating plan price: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle price input change (store in pending changes)
  const handlePriceChange = (planId, newPrice) => {
    const price = parseFloat(newPrice);
    if (!isNaN(price) && price >= 0) {
      setPendingPriceChanges(prev => ({
        ...prev,
        [planId]: price
      }));
    }
  };

  // Save pending price changes
  const savePriceChange = async (planId) => {
    const pendingPrice = pendingPriceChanges[planId];
    if (pendingPrice !== undefined) {
      await updatePlanPrice(planId, pendingPrice);
      stopEditingPrice(planId);
    }
  };

  // Cancel pending price changes
  const cancelPriceChange = (planId) => {
    setPendingPriceChanges(prev => {
      const newPending = { ...prev };
      delete newPending[planId];
      return newPending;
    });
    setEditingPrices(prev => {
      const newEditing = { ...prev };
      delete newEditing[planId];
      return newEditing;
    });
  };

  // Start editing price
  const startEditingPrice = (planId) => {
    setEditingPrices(prev => ({
      ...prev,
      [planId]: true
    }));
  };

  // Stop editing price
  const stopEditingPrice = (planId) => {
    setEditingPrices(prev => {
      const newEditing = { ...prev };
      delete newEditing[planId];
      return newEditing;
    });
  };

  // Calculate retail price with configurable markup

  // Get unique countries from all plans
  const getUniqueCountries = () => {
    const countrySet = new Set();
    allPlans.forEach(plan => {
      if (plan.country_codes) {
        plan.country_codes.forEach(code => countrySet.add(code));
      }
      if (plan.country_ids) {
        plan.country_ids.forEach(id => countrySet.add(id));
      }
    });
    return Array.from(countrySet).sort();
  };


  // Overview Stats
  const statsData = [
    { label: 'Total Plans', value: allPlans.length, icon: Smartphone, color: 'purple' },
    { label: 'Regions', value: regions.length, icon: MapPin, color: 'green' },
    { label: 'Status', value: 'Active', icon: Activity, color: 'emerald' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl">
                <Settings className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Admin Panel
                </h1>
                <p className="text-gray-500 text-xs">
                  eSIM Management
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {/* Main Navigation Items */}
            {[
              { id: 'config', label: 'API Configuration', icon: Settings, permission: canManageConfig },
              { id: 'countries', label: 'Countries', icon: Globe, permission: canManageCountries },
              { id: 'plans', label: 'Plans Management', icon: Smartphone, permission: canManagePlans },
              { id: 'esim', label: 'eSIM Management', icon: Activity, permission: canManagePlans },
              { id: 'notifications', label: 'Notifications', icon: MessageSquare, permission: true },
            ].filter(tab => tab.permission).map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                    activeTab === tab.id
                      ? 'bg-black text-white shadow-lg'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}

            {/* Administration Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-200 text-left ${
                  ['settings', 'requests', 'newsletter', 'jobs', 'blog'].includes(activeTab)
                    ? 'bg-black text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <Database className="w-5 h-5 mr-3" />
                  Administration
                </div>
                {showAdminDropdown ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
              
              {/* Administration Dropdown Menu */}
              {showAdminDropdown && (
                <div className="ml-4 mt-2 space-y-1">
                  {[
                    { id: 'settings', label: 'Contact Forms', icon: Link, permission: canManageConfig },
                    { id: 'requests', label: 'Contact Requests', icon: MessageSquare, permission: canManageContactRequests },
                    { id: 'newsletter', label: 'Newsletter', icon: Mail, permission: canManageNewsletter },
                    { id: 'jobs', label: 'Job Applications', icon: Briefcase, permission: canManageContactRequests },
                    { id: 'blog', label: 'Blog Management', icon: FileText, permission: canManageBlog },
                  ].filter(tab => tab.permission).map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 text-left text-sm ${
                          activeTab === tab.id
                            ? 'bg-gray-800 text-white shadow-lg'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-3" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="relative user-dropdown-container">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-sm">
                    {(currentUser?.displayName || currentUser?.email || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-gray-900 font-medium text-sm truncate">
                    {currentUser?.displayName || currentUser?.email || 'Admin'}
                  </p>
                  <p className="text-gray-500 text-xs">Administrator</p>
                </div>
              </button>
              
              {/* User Dropdown */}
              {showUserDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Content Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {[
                { id: 'config', label: 'API Configuration' },
                { id: 'settings', label: 'Contact Forms' },
                { id: 'countries', label: 'Countries' },
                { id: 'plans', label: 'Plans Management' },
                { id: 'esim', label: 'eSIM Management' },
                { id: 'requests', label: 'Contact Requests' },
                { id: 'newsletter', label: 'Newsletter' },
                { id: 'jobs', label: 'Job Applications' },
                { id: 'blog', label: 'Blog Management' },
              ].find(tab => tab.id === activeTab)?.label || 'Dashboard'}
            </h2>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsData.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-xl shadow-lg p-6 border border-gray-100"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                          </div>
                                                  <div className={`p-3 rounded-lg ${
                          stat.color === 'blue' ? 'bg-blue-100' :
                          stat.color === 'green' ? 'bg-green-100' :
                          stat.color === 'gray' ? 'bg-gray-100' :
                          stat.color === 'emerald' ? 'bg-emerald-100' :
                          'bg-gray-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${
                            stat.color === 'blue' ? 'text-blue-600' :
                            stat.color === 'green' ? 'text-green-600' :
                            stat.color === 'gray' ? 'text-gray-600' :
                            stat.color === 'emerald' ? 'text-emerald-600' :
                            'text-gray-600'
                          }`} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Activity className="text-blue-600 mr-2" />
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => setActiveTab('config')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
                    >
                      <Settings className="w-8 h-8 text-blue-600 mb-2" />
                      <p className="font-medium">Configuration</p>
                      <p className="text-sm text-gray-600">Manage API keys and environment</p>
                    </button>
                    <button
                      onClick={() => setActiveTab('countries')}
                      className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200"
                    >
                      <Globe className="w-8 h-8 text-green-600 mb-2" />
                      <p className="font-medium">Manage Countries</p>
                      <p className="text-sm text-gray-600">View and manage country plans</p>
                      <p className="text-xs text-green-600 font-medium mt-1">
                        Manage countries
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Tab */}
            {activeTab === 'config' && canManageConfig && (
              <ConfigurationManagement />
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && canManageConfig && (
              <LinksManagement />
            )}

            {/* Countries Tab */}
            {activeTab === 'countries' && canManageCountries && (
              <CountriesManagement />
            )}

            {/* Plans Management Tab */}
            {activeTab === 'plans' && canManagePlans && (
              <PlansManagement />
            )}

            {/* eSIM Management Tab */}
            {activeTab === 'esim' && canManagePlans && (
              <AdminEsimManagement />
            )}

            {/* Blog Management Tab */}
            {activeTab === 'blog' && canManageBlog && (
              <BlogManagement />
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <NotificationsManagement />
            )}

            {/* Contact Requests Tab */}
            {activeTab === 'requests' && canManageContactRequests && (
              <ContactRequestsManagement />
            )}

            {/* Newsletter Tab */}
            {activeTab === 'newsletter' && canManageNewsletter && (
              <NewsletterManagement />
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && canManageContactRequests && (
              <JobApplicationsManagement />
            )}


          </motion.div>
        </AnimatePresence>

        {/* Create Region Modal */}
        {showCreateRegionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Create New Region</h3>
                <button
                  onClick={() => setShowCreateRegionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region Name*</label>
                  <input
                    type="text"
                    value={newRegion.name}
                    onChange={(e) => setNewRegion({...newRegion, name: e.target.value})}
                    placeholder="e.g., Europe"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region Code*</label>
                  <input
                    type="text"
                    value={newRegion.code}
                    onChange={(e) => setNewRegion({...newRegion, code: e.target.value.toUpperCase()})}
                    placeholder="e.g., EUR"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newRegion.description}
                    onChange={(e) => setNewRegion({...newRegion, description: e.target.value})}
                    placeholder="Description of the regional coverage"
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Starting Price</label>
                  <input
                    type="number"
                    value={newRegion.minPrice}
                    onChange={(e) => setNewRegion({...newRegion, minPrice: parseFloat(e.target.value)})}
                    placeholder="0.00"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                  <input
                    type="text"
                    value={newRegion.icon}
                    onChange={(e) => setNewRegion({...newRegion, icon: e.target.value})}
                    placeholder="🌍"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateRegionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createRegion}
                  disabled={loading || !newRegion.name || !newRegion.code}
                  className="flex-1 bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create Region'}
                </button>
              </div>
            </motion.div>
          </div>
        )}





        {/* Attach Country Plan Modal */}



            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
