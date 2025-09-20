'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, writeBatch, addDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { getContactRequests, updateContactRequestStatus, deleteContactRequest } from '../services/contactService';
import { getNewsletterSubscriptions, updateNewsletterSubscriptionStatus, deleteNewsletterSubscription, getNewsletterStats } from '../services/newsletterService';
import { getSettings, updateSettingsSection, resetSettingsToDefaults, validateSettings } from '../services/settingsService';
import { getJobApplications, updateJobApplicationStatus, deleteJobApplication, getJobApplicationStats } from '../services/jobsService';
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
  Users,
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
  const { isAdmin, userRole, canManageCountries, canManagePlans, canManageConfig, canDeleteData, canManageAdmins, canManageBlog, canManageNewsletter, canManageContactRequests, loading: adminLoading } = useAdmin();
  const functions = getFunctions();

  // State Management - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [activeTab, setActiveTab] = useState('countries');
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [currentEnvironment, setCurrentEnvironment] = useState('production');
  const [airaloClientId, setAiraloClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Ready to sync data from Airalo API');
  const [rawApiData, setRawApiData] = useState(null);

  
  // Countries Management
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState([]);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  
  // Plans Management
  const [allPlans, setAllPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [planSortBy, setPlanSortBy] = useState('price'); // 'price', 'name', 'country'
  const [planSortOrder, setPlanSortOrder] = useState('asc'); // 'asc', 'desc'
  const [planStatusFilter, setPlanStatusFilter] = useState('all'); // 'all', 'enabled', 'disabled'
  const [planCountryFilter, setPlanCountryFilter] = useState('all'); // 'all' or specific country code
  const [pendingPriceChanges, setPendingPriceChanges] = useState({}); // Track pending price changes
  const [editingPrices, setEditingPrices] = useState({}); // Track which prices are being edited
  const [markupPercentage, setMarkupPercentage] = useState(17);
  const [regularDiscountPercentage, setRegularDiscountPercentage] = useState(10); // Configurable markup percentage
  const [transactionCommissionPercentage, setTransactionCommissionPercentage] = useState(5); // Commission for referral owners
  
  
  // User Management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [showRemoveAdminModal, setShowRemoveAdminModal] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState(null);
  
  // Contact Requests Management
  const [contactRequests, setContactRequests] = useState([]);
  const [filteredContactRequests, setFilteredContactRequests] = useState([]);
  const [contactRequestSearchTerm, setContactRequestSearchTerm] = useState('');
  const [contactRequestStatusFilter, setContactRequestStatusFilter] = useState('all');
  
  // Newsletter Management
  const [newsletterSubscriptions, setNewsletterSubscriptions] = useState([]);
  const [filteredNewsletterSubscriptions, setFilteredNewsletterSubscriptions] = useState([]);
  const [newsletterSearchTerm, setNewsletterSearchTerm] = useState('');
  const [newsletterStatusFilter, setNewsletterStatusFilter] = useState('all');
  const [newsletterStats, setNewsletterStats] = useState({ total: 0, active: 0, unsubscribed: 0, bounced: 0 });
  
  // Jobs Management
  const [jobApplications, setJobApplications] = useState([]);
  const [filteredJobApplications, setFilteredJobApplications] = useState([]);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState('all');

  const [jobStats, setJobStats] = useState({ total: 0, pending: 0, reviewed: 0, contacted: 0, rejected: 0, hired: 0 });
  
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
  
  // Settings Management
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('social');
  const [settingsFormData, setSettingsFormData] = useState({
    socialMedia: {},
    contact: {},
    businessHours: {},
    referral: {},
    appStore: {}
  });
  const [settingsErrors, setSettingsErrors] = useState({});
  
  // Business Hours Modal Management
  const [showBusinessHoursModal, setShowBusinessHoursModal] = useState(false);
  const [businessHoursData, setBusinessHoursData] = useState({
    monday: { open: '', close: '', closed: false },
    tuesday: { open: '', close: '', closed: false },
    wednesday: { open: '', close: '', closed: false },
    thursday: { open: '', close: '', closed: false },
    friday: { open: '', close: '', closed: false },
    saturday: { open: '', close: '', closed: false },
    sunday: { open: '', close: '', closed: false }
  });
  
  // User Dropdown Management
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Countries Modal Management
  const [showCountriesModal, setShowCountriesModal] = useState(false);
  const [selectedCountryPlans, setSelectedCountryPlans] = useState([]);
  const [selectedCountryName, setSelectedCountryName] = useState('');
  const [showAttachPlanModal, setShowAttachPlanModal] = useState(false);
  const [showAttachCountryPlanModal, setShowAttachCountryPlanModal] = useState(false);
  const [selectedCountryForAttach, setSelectedCountryForAttach] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
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
      loadSavedConfig();
      loadCountriesFromFirestore();
      loadRegionsFromFirestore();
      loadAiraloApiKey();
      loadUsersFromFirestore();
      loadContactRequests();
      loadNewsletterSubscriptions();
      loadJobApplications();
      loadReferralCodes();
      loadWithdrawalRequests();
      loadSettings();
      loadMarkupPercentage();
    }
  }, [currentUser]);

  // Filter countries based on search
  useEffect(() => {
    const filtered = countries.filter(country => 
      country.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCountries(filtered);
  }, [countries, searchTerm]);

  // Filter users based on search
  useEffect(() => {
    const filtered = users.filter(user => 
      user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      user.id?.toLowerCase().includes(userSearchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, userSearchTerm]);

  // Filter contact requests based on search and status
  useEffect(() => {
    let filtered = contactRequests.filter(request => 
      request.name?.toLowerCase().includes(contactRequestSearchTerm.toLowerCase()) ||
      request.email?.toLowerCase().includes(contactRequestSearchTerm.toLowerCase()) ||
      request.message?.toLowerCase().includes(contactRequestSearchTerm.toLowerCase())
    );
    
    if (contactRequestStatusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === contactRequestStatusFilter);
    }
    
    setFilteredContactRequests(filtered);
  }, [contactRequests, contactRequestSearchTerm, contactRequestStatusFilter]);

  // Filter newsletter subscriptions based on search and status
  useEffect(() => {
    let filtered = newsletterSubscriptions.filter(subscription => 
      subscription.email?.toLowerCase().includes(newsletterSearchTerm.toLowerCase()) ||
      subscription.source?.toLowerCase().includes(newsletterSearchTerm.toLowerCase())
    );
    
    if (newsletterStatusFilter !== 'all') {
      filtered = filtered.filter(subscription => subscription.status === newsletterStatusFilter);
    }
    
    setFilteredNewsletterSubscriptions(filtered);
  }, [newsletterSubscriptions, newsletterSearchTerm, newsletterStatusFilter]);

  // Filter job applications based on search and status
  useEffect(() => {
    let filtered = jobApplications.filter(application => 
      application.name?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
      application.email?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
      application.position?.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
      application.status?.toLowerCase().includes(jobSearchTerm.toLowerCase())
    );
    
    if (jobStatusFilter !== 'all') {
      filtered = filtered.filter(application => application.status === jobStatusFilter);
    }
    
    setFilteredJobApplications(filtered);
  }, [jobApplications, jobSearchTerm, jobStatusFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAttachPlanModal && !event.target.closest('.dropdown-container')) {
        setShowAttachPlanModal(false);
      }
      if (showAttachCountryPlanModal && !event.target.closest('.dropdown-container')) {
        setShowAttachCountryPlanModal(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAttachPlanModal, showAttachCountryPlanModal]);

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
      const plansSnapshot = await getDocs(collection(db, 'plans'));
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
  const loadSavedConfig = async () => {
    try {
      // Load environment from localStorage as fallback
      const savedEnv = localStorage.getItem('esim_environment');
      if (savedEnv) {
        setCurrentEnvironment(savedEnv);
        console.log('✅ Environment loaded from localStorage:', savedEnv);
      }
    } catch (error) {
      console.error('Error loading saved config:', error);
    }
  };


  const loadAiraloApiKey = async () => {
    try {
      // Try to load from Firestore first
      try {
        const configRef = doc(db, 'config', 'airalo');
        const configDoc = await getDocs(query(collection(db, 'config'), where('__name__', '==', 'airalo')));
        if (!configDoc.empty) {
          const configData = configDoc.docs[0].data();
          if (configData.client_id) {
            setAiraloClientId(configData.client_id);
            console.log('✅ Airalo client ID loaded from Firestore');
          }
          // Always use production mode
          setCurrentEnvironment('production');
          console.log('✅ Airalo environment set to production');
          localStorage.setItem('esim_environment', 'production');
          localStorage.setItem('airalo_environment', 'production');
          return;
        }
      } catch (error) {
        console.log('⚠️ Could not load Airalo API key from Firestore, trying localStorage');
      }
      
      // Fallback to localStorage
      const storedClientId = localStorage.getItem('airalo_client_id');
      if (storedClientId) {
        setAiraloClientId(storedClientId);
        console.log('✅ Airalo client ID loaded from localStorage');
      }
      // Always use production mode
      setCurrentEnvironment('production');
      console.log('✅ Airalo environment set to production');
    } catch (error) {
      console.error('Error loading Airalo API key:', error);
    }
  };

  const saveAiraloCredentials = async () => {
    try {
      if (!airaloClientId.trim()) {
        toast.error('Please enter a valid Airalo Client ID');
        return;
      }
      
      // Save to localStorage
      localStorage.setItem('airalo_client_id', airaloClientId);
      localStorage.setItem('esim_environment', 'production');
      localStorage.setItem('airalo_environment', 'production');
      
      // Save to Firestore so Firebase Functions can access it
      const configRef = doc(db, 'config', 'airalo');
      await setDoc(configRef, {
        client_id: airaloClientId,
        environment: 'production',
        updated_at: new Date(),
        updated_by: currentUser?.uid || 'admin'
      }, { merge: true });
      
      toast.success('Airalo Client ID saved successfully!');
      console.log('✅ Airalo Client ID saved to localStorage and Firestore');
    } catch (error) {
      console.error('Error saving Airalo Client ID:', error);
      toast.error(`Error saving Airalo Client ID: ${error.message}`);
    }
  };




  // Countries Management Functions
  const loadCountriesFromFirestore = async () => {
    try {
      setLoading(true);
      const countriesSnapshot = await getDocs(collection(db, 'countries'));
      const countriesData = countriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          flagEmoji: data.flagEmoji || getFlagEmoji(data.code)
        };
      });
      
      // Now load plans to calculate real minPrice for each country
      console.log('🔄 Loading plans to calculate country minPrice...');
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      const allPlans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out disabled plans for pricing calculations
      const enabledPlans = allPlans.filter(plan => plan.enabled !== false);
      
      // Calculate minPrice for each country based on actual enabled plans
      console.log('🔍 All enabled plans loaded:', enabledPlans.length);
      console.log('🔍 Sample plan data:', allPlans.slice(0, 3).map(p => ({ 
        id: p.id, 
        name: p.name, 
        price: p.price, 
        country_codes: p.country_codes,
        country_ids: p.country_ids 
      })));
      
      const countriesWithPlans = countriesData.map(country => {
        // Find plans for this country (check both mobile and web formats)
        const countryPlans = enabledPlans.filter(plan => {
          const hasMobilePlans = plan.country_codes && plan.country_codes.includes(country.code);
          const hasWebPlans = plan.country_ids && plan.country_ids.includes(country.code);
          return hasMobilePlans || hasWebPlans;
        });
        
        console.log(`🔍 ${country.name} (${country.code}): Found ${countryPlans.length} plans`);
        if (countryPlans.length > 0) {
          console.log(`🔍 ${country.name} plans:`, countryPlans.map(p => ({ 
            id: p.id, 
            name: p.name, 
            price: p.price, 
            country_codes: p.country_codes 
          })));
        }
        
        if (countryPlans.length > 0) {
          // Calculate minPrice from actual plans
          const prices = countryPlans.map(plan => plan.price || 0).filter(price => price > 0);
          
          if (prices.length === 0) {
            console.log(`⚠️ ${country.name}: No valid prices found in ${countryPlans.length} plans`);
            return {
              ...country,
              minPrice: null,
              planCount: countryPlans.length,
              hasPlans: false
            };
          }
          
          const minPrice = Math.min(...prices);
          const planCount = countryPlans.length;
          console.log(`📊 ${country.name}: ${planCount} plans, minPrice: $${minPrice}`);
          
          return {
            ...country,
            minPrice: Math.round(minPrice),
            planCount: planCount,
            hasPlans: true
          };
        } else {
          console.log(`❌ ${country.name}: No plans found`);
          return {
            ...country,
            minPrice: null,
            planCount: 0,
            hasPlans: false
          };
        }
      });
      
      setCountries(countriesWithPlans);
      setFilteredCountries(countriesWithPlans);
      console.log('✅ Loaded', countriesWithPlans.length, 'countries with plan counts from Firestore');
    } catch (error) {
      console.error('❌ Error loading countries:', error);
      toast.error(`Error loading countries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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

      // Reload countries from Firestore
      await loadCountriesFromFirestore();

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
            
            const planRef = doc(db, 'plans', plan.slug);
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

  const deleteCountryFromFirestore = async (countryCode) => {
    if (!window.confirm(`Delete ${countryCode}? This will also delete all associated plans.`)) return;

    try {
      setLoading(true);
      // Delete country and its plans
      const countryQuery = query(collection(db, 'countries'), where('code', '==', countryCode));
      const countrySnapshot = await getDocs(countryQuery);
      
      const batch = writeBatch(db);
      countrySnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      
      toast.success(`${countryCode} deleted successfully!`);
      await loadCountriesFromFirestore();
    } catch (error) {
      console.error('❌ Error deleting country:', error);
      toast.error(`Error deleting ${countryCode}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const showCountryPlans = async (countryCode, countryName) => {
    try {
      setLoading(true);
      
      // Load plans from the plans collection for this country (mobile app compatible)
      // Try both mobile app format (country_codes) and web app format (country_ids)
      const mobilePlansQuery = query(
        collection(db, 'plans'), 
        where('country_codes', 'array-contains', countryCode)
      );
      const webPlansQuery = query(
        collection(db, 'plans'), 
        where('status', '==', 'active'),
        where('country_ids', 'array-contains', countryCode)
      );
      
      // Get both query results
      const [mobilePlansSnapshot, webPlansSnapshot] = await Promise.all([
        getDocs(mobilePlansQuery),
        getDocs(webPlansQuery)
      ]);
      
      // Combine and deduplicate plans
      const allPlans = new Map();
      
      // Add mobile app plans
      mobilePlansSnapshot.docs.forEach(doc => {
        const data = doc.data();
        allPlans.set(doc.id, {
          id: doc.id,
          ...data,
          source: 'mobile',
          data: data.capacity || data.data || 'N/A',
          duration: data.period || data.duration || 'N/A'
        });
      });
      
      // Add web app plans (overwrite if same ID)
      webPlansSnapshot.docs.forEach(doc => {
        const data = doc.data();
        allPlans.set(doc.id, {
          id: doc.id,
          ...data,
          source: 'web',
          data: data.data || data.capacity || 'N/A',
          duration: data.duration || data.period || 'N/A'
        });
      });
      
      const countryPlans = Array.from(allPlans.values());
      console.log('📱📊 Combined plans for', countryName, ':', countryPlans);
      
      setSelectedCountryPlans(countryPlans);
      setSelectedCountryName(countryName);
      setSelectedCountryForAttach({ code: countryCode, name: countryName });
      setShowCountriesModal(true);
      
      // Load available plans for this country
      await loadAvailablePlansForCountry();
    } catch (error) {
      console.error('❌ Error loading country plans:', error);
      toast.error(`Error loading plans for ${countryName}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllCountries = async () => {
    if (!window.confirm('Delete ALL countries? This will remove all countries and their plans from the database. Airalo can then fetch fresh data.')) return;

    try {
      setIsDeleting(true);
      console.log('🗑️ Starting deletion of all countries...');
      
      // Get all countries
      const countriesSnapshot = await getDocs(collection(db, 'countries'));
      console.log(`Found ${countriesSnapshot.docs.length} countries to delete`);
      
      // Get all plans 
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      console.log(`Found ${plansSnapshot.docs.length} plans to delete`);
      
      // Create batch operations
      const batch = writeBatch(db);
      
      // Add all countries to deletion batch
      countriesSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Add all plans to deletion batch
      plansSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Execute batch deletion
      await batch.commit();
      
      // Clear local state
      setCountries([]);
      setFilteredCountries([]);
      setAllPlans([]);
      setFilteredPlans([]);
      setPlans([]);
      setPendingPriceChanges({});
      setEditingPrices({});
      
      toast.success(`Successfully deleted ${countriesSnapshot.docs.length} countries and ${plansSnapshot.docs.length} plans!`);
      console.log('✅ All countries and plans deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting all countries:', error);
      toast.error(`Error deleting countries: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };







  const deleteCountryPlan = async (planId, planName) => {
    console.log('🗑️ deleteCountryPlan called with:', { planId, planName });
    
    try {
      setLoading(true);
      console.log('🗑️ Deleting document from Firestore:', planId);
      await deleteDoc(doc(db, 'plans', planId));
      console.log('✅ Document deleted successfully');
      toast.success(`${planName} plan detached successfully!`);
      
      // Refresh country plans if modal is open (mobile app compatible)
      if (showCountriesModal && selectedCountryForAttach) {
        console.log('🔄 Refreshing country plans after delete for:', selectedCountryForAttach.code);
        await showCountryPlans(selectedCountryForAttach.code, selectedCountryForAttach.name);
      } else {
        console.log('⚠️ Cannot refresh after delete: showCountriesModal:', showCountriesModal, 'selectedCountryForAttach:', selectedCountryForAttach);
      }
      
      // Refresh countries to update plan counts
      await loadCountriesFromFirestore();
    } catch (error) {
      console.error('❌ Error deleting country plan:', error);
      toast.error(`Error detaching plan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateCountryPlanPrice = async (planId, newPrice) => {
    console.log('🔧 updateCountryPlanPrice called with:', { planId, newPrice });
    
    try {
      setLoading(true);
      console.log('🔧 Updating plan price:', { planId, newPrice, selectedCountryForAttach });
      
      console.log('🔧 Updating document in Firestore:', planId);
      await updateDoc(doc(db, 'plans', planId), {
        price: Math.round(newPrice), // Store as whole number
        updatedAt: new Date(),
        priceUpdatedVia: 'admin_panel'
      });
      console.log('✅ Document updated successfully');
      toast.success('Plan price updated successfully!');
      
      // Refresh country plans if modal is open (mobile app compatible)
      if (showCountriesModal && selectedCountryForAttach) {
        console.log('🔄 Refreshing country plans for:', selectedCountryForAttach.code);
        await showCountryPlans(selectedCountryForAttach.code, selectedCountryForAttach.name);
      } else {
        console.log('⚠️ Cannot refresh: showCountriesModal:', showCountriesModal, 'selectedCountryForAttach:', selectedCountryForAttach);
      }
      
      // Refresh countries to update plan counts
      await loadCountriesFromFirestore();
    } catch (error) {
      console.error('❌ Error updating plan price:', error);
      toast.error(`Error updating price: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlans = async () => {
    try {
      setLoading(true);
      
      // Load plans from Firebase directly (normal display)
      console.log('📱 Loading plans from Firebase...');
      const plansSnapshot = await getDocs(collection(db, 'plans'));
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


  // User Management Functions
  const loadUsersFromFirestore = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setFilteredUsers(usersData);
      console.log('✅ Loaded', usersData.length, 'users from Firestore');
    } catch (error) {
      console.error('❌ Error loading users:', error);
      toast.error(`Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Contact Requests Management Functions
  const loadContactRequests = async () => {
    try {
      setLoading(true);
      const requests = await getContactRequests();
      setContactRequests(requests);
      setFilteredContactRequests(requests);
      console.log('✅ Loaded', requests.length, 'contact requests from Firestore');
    } catch (error) {
      console.error('❌ Error loading contact requests:', error);
      toast.error(`Error loading contact requests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRequestStatus = async (requestId, newStatus) => {
    try {
      setLoading(true);
      await updateContactRequestStatus(requestId, newStatus);
      toast.success(`Request status updated to ${newStatus}`);
      await loadContactRequests();
    } catch (error) {
      console.error('❌ Error updating request status:', error);
      toast.error(`Error updating request status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContactRequest = async (requestId, requestName) => {
    if (!window.confirm(`Delete contact request from ${requestName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteContactRequest(requestId);
      toast.success('Contact request deleted successfully');
      await loadContactRequests();
    } catch (error) {
      console.error('❌ Error deleting contact request:', error);
      toast.error(`Error deleting contact request: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Newsletter Management Functions
  const loadNewsletterSubscriptions = async () => {
    try {
      setLoading(true);
      const subscriptions = await getNewsletterSubscriptions();
      const stats = await getNewsletterStats();
      setNewsletterSubscriptions(subscriptions);
      setFilteredNewsletterSubscriptions(subscriptions);
      setNewsletterStats(stats);
      console.log('✅ Loaded', subscriptions.length, 'newsletter subscriptions from Firestore');
    } catch (error) {
      console.error('❌ Error loading newsletter subscriptions:', error);
      toast.error(`Error loading newsletter subscriptions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNewsletterStatus = async (subscriptionId, newStatus) => {
    try {
      setLoading(true);
      await updateNewsletterSubscriptionStatus(subscriptionId, newStatus);
      toast.success(`Subscription status updated to ${newStatus}`);
      await loadNewsletterSubscriptions();
    } catch (error) {
      console.error('❌ Error updating newsletter status:', error);
      toast.error(`Error updating newsletter status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNewsletterSubscription = async (subscriptionId, subscriberEmail) => {
    if (!window.confirm(`Delete newsletter subscription for ${subscriberEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteNewsletterSubscription(subscriptionId);
      toast.success('Newsletter subscription deleted successfully');
      await loadNewsletterSubscriptions();
    } catch (error) {
      console.error('❌ Error deleting newsletter subscription:', error);
      toast.error(`Error deleting newsletter subscription: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Jobs Management Functions
  const loadJobApplications = async () => {
    try {
      setLoading(true);
      const applications = await getJobApplications();
      const stats = await getJobApplicationStats();
      setJobApplications(applications);
      setFilteredJobApplications(applications);
      setJobStats(stats);
      console.log('✅ Loaded', applications.length, 'job applications from Firestore');
    } catch (error) {
      console.error('❌ Error loading job applications:', error);
      toast.error(`Error loading job applications: ${error.message}`);
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


  const handleUpdateJobApplicationStatus = async (applicationId, newStatus) => {
    try {
      setLoading(true);
      await updateJobApplicationStatus(applicationId, newStatus);
      toast.success(`Application status updated to ${newStatus}`);
      await loadJobApplications();
    } catch (error) {
      console.error('❌ Error updating job application status:', error);
      toast.error(`Error updating job application status: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJobApplication = async (applicationId, applicantName) => {
    if (!window.confirm(`Delete job application from ${applicantName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteJobApplication(applicationId);
      toast.success('Job application deleted successfully');
      await loadJobApplications();
    } catch (error) {
      console.error('❌ Error deleting job application:', error);
      toast.error(`Error deleting job application: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Settings Management Functions
  const loadSettings = async () => {
    try {
      setSettingsLoading(true);
      const settingsData = await getSettings();
      setSettings(settingsData);
      setSettingsFormData({
        socialMedia: settingsData.socialMedia || {},
        contact: settingsData.contact || {},
        businessHours: settingsData.businessHours || {},
        referral: settingsData.referral || {},
        appStore: settingsData.appStore || {}
      });
      console.log('✅ Loaded settings from Firestore');
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      toast.error(`Error loading settings: ${error.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSettingsInputChange = (section, field, value) => {
    setSettingsFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear error for this field
    if (settingsErrors[field]) {
      setSettingsErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSaveSettings = async (section) => {
    try {
      setSettingsLoading(true);
      
      // Validate the data
      const validation = validateSettings({ [section]: settingsFormData[section] });
      if (!validation.isValid) {
        setSettingsErrors(validation.errors);
        toast.error('Please fix the validation errors');
        return;
      }
      
      await updateSettingsSection(section, settingsFormData[section], currentUser?.uid);
      toast.success(`${section} settings updated successfully!`);
      await loadSettings();
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast.error(`Error saving settings: ${error.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Business Hours Functions
  const handleOpenBusinessHoursModal = () => {
    // Load existing business hours data
    const existingHours = settings?.businessHours || {};
    setBusinessHoursData({
      monday: existingHours.monday || { open: '', close: '', closed: false },
      tuesday: existingHours.tuesday || { open: '', close: '', closed: false },
      wednesday: existingHours.wednesday || { open: '', close: '', closed: false },
      thursday: existingHours.thursday || { open: '', close: '', closed: false },
      friday: existingHours.friday || { open: '', close: '', closed: false },
      saturday: existingHours.saturday || { open: '', close: '', closed: false },
      sunday: existingHours.sunday || { open: '', close: '', closed: false }
    });
    setShowBusinessHoursModal(true);
  };

  const handleBusinessHoursChange = (day, field, value) => {
    setBusinessHoursData(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSaveBusinessHours = async () => {
    try {
      setSettingsLoading(true);
      await updateSettingsSection('businessHours', businessHoursData, currentUser?.uid);
      toast.success('Business hours updated successfully!');
      setShowBusinessHoursModal(false);
      await loadSettings();
    } catch (error) {
      console.error('❌ Error saving business hours:', error);
      toast.error(`Error saving business hours: ${error.message}`);
    } finally {
      setSettingsLoading(false);
    }
  };

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

  const removeUserFromAdmin = async (userId, userEmail) => {
    if (!window.confirm(`Remove admin privileges from ${userEmail}? This user will lose access to admin features.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Update user role to 'user' (remove admin privileges)
      await updateDoc(doc(db, 'users', userId), {
        role: 'user',
        adminRemovedAt: new Date(),
        adminRemovedBy: currentUser.email,
        updatedAt: new Date()
      });
      
      toast.success(`Admin privileges removed from ${userEmail}`);
      
      // Refresh users list
      await loadUsersFromFirestore();
      
      // Close modal if open
      setShowRemoveAdminModal(false);
      setSelectedUserForAction(null);
    } catch (error) {
      console.error('❌ Error removing admin privileges:', error);
      toast.error(`Error removing admin privileges: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Delete user ${userEmail}? This action cannot be undone and will remove all user data.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete user document
      await deleteDoc(doc(db, 'users', userId));
      
      toast.success(`User ${userEmail} deleted successfully`);
      
      // Refresh users list
      await loadUsersFromFirestore();
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      toast.error(`Error deleting user: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailablePlansForCountry = async () => {
    try {
      setLoading(true);
      
      // Load plans from Firebase directly (normal display)
      console.log('📱 Loading plans from Firebase...');
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      const allPlans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter out disabled plans
      const enabledPlans = allPlans.filter(plan => plan.enabled !== false);
      
      if (enabledPlans.length > 0) {

        
        // Transform plans to match expected format (support both mobile and web formats)
        const transformedPlans = enabledPlans.map(plan => {
          // Handle mobile app format (capacity/period) vs web format (data/duration)
          const data = plan.capacity || plan.data;
          const duration = plan.period || plan.duration;
          
          return {
            id: plan.slug || plan.id,
            name: plan.name,
            data: (data === 'Unlimited' || data === -1 || data === 0) ? 'Unlimited GB' : (data ? `${data} GB` : 'N/A'),
            duration: duration ? `${duration} days` : 'N/A',
            price: plan.price || 0,
            currency: plan.currency || 'USD',
            country: plan.country_codes?.[0] || plan.country_ids?.[0] || 'Multiple Countries',
            description: plan.description || '',
            capacity: (plan.capacity === -1 || plan.capacity === 0) ? 'Unlimited' : plan.capacity,
            period: plan.period,
            operator: plan.operator || '',
            country_codes: plan.country_codes || plan.country_ids || []
          };
        });
        
        // Filter out plans already attached to this country (if we have selectedCountryForAttach)
        let available = transformedPlans;
        if (selectedCountryForAttach) {
          const existingCountryPlans = selectedCountryPlans.map(cp => cp.originalPlanId || cp.id);
          available = transformedPlans.filter(plan => !existingCountryPlans.includes(plan.id));
        }
        
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


  const syncAllDataFromAiralo = async () => {
    try {
      setLoading(true);
      setRawApiData(null);
      
      if (!airaloClientId.trim()) {
        toast.error('Please configure Airalo Client ID first');
        return;
      }

      setSyncStatus('Syncing all data and fetching raw response...');
      
      // First, get raw response data for display
      console.log('🧪 Fetching raw API response...');
      const rawResponse = await fetch('/api/test-airalo', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const rawResult = await rawResponse.json();
      
      if (rawResult.success) {
        setRawApiData(rawResult);
        console.log(`✅ Raw response fetched: ${rawResult.analysis?.totalCountries || 0} countries found`);
      }
      
      // Then sync the data
      console.log('🔄 Starting to sync all data via Next.js API...');
      const response = await fetch('/api/sync-airalo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Successfully synced all data via Next.js API`);
        toast.success(`Successfully synced all data: ${result.total_synced} items`);
        
        // Refresh local data
        await loadCountriesFromFirestore();
        await loadRegionsFromFirestore();
        
        // Reload plans from Firebase (now with updated data)
        await loadAvailablePlans();
        
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
      
    } catch (error) {
      console.error('❌ Error syncing data via Next.js API:', error);
      toast.error(`Error syncing data: ${error.message}`);
      setSyncStatus(`Error syncing data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const attachPlanToCountry = async (plan) => {
    if (!selectedCountryForAttach) {
      toast.error('No country selected');
      return;
    }

    try {
      setLoading(true);
      
      // Check if plan already exists for this country
      const existingPlanQuery = query(
        collection(db, 'plans'),
        where('name', '==', plan.name),
        where('country_codes', 'array-contains', selectedCountryForAttach.code)
      );
      const existingPlanSnapshot = await getDocs(existingPlanQuery);
      
      if (!existingPlanSnapshot.empty) {
        toast.error(`Plan "${plan.name}" is already available for ${selectedCountryForAttach.name}`);
        return;
      }
      
      // Attach the plan to the country (BOTH mobile and web app compatible)
      const planData = {
        name: plan.name,
        data: plan.capacity || plan.data || 'N/A',
        duration: plan.period || plan.duration || 'N/A',
        price: Math.round(plan.price), // Store as whole number
        currency: plan.currency || 'USD',
        description: plan.description || '',
        country: selectedCountryForAttach.name,
        countryCode: selectedCountryForAttach.code, // Web compatibility
        country_ids: [selectedCountryForAttach.code], // Web compatibility
        country_codes: [selectedCountryForAttach.code], // Mobile app compatibility
        status: 'active', // Web compatibility
        originalPlanId: plan.id,
        originalCountry: plan.country,
        attachedAt: new Date(),
        attachedVia: 'admin_panel'
      };
      
      // If it's a mobile app plan, preserve original fields
      if (plan.capacity && plan.period) {
        planData.capacity = plan.capacity;
        planData.period = plan.period;
      }
      
      await addDoc(collection(db, 'plans'), planData);
      
      toast.success(`Plan "${plan.name}" attached to ${selectedCountryForAttach.name}!`);
      setShowAttachCountryPlanModal(false);
      
      // Refresh the country plans in the current modal
      if (showCountriesModal && selectedCountryForAttach) {
        await showCountryPlans(selectedCountryForAttach.code, selectedCountryForAttach.name);
      }
      
      // Refresh plans modal if open
      if (showPlansModal && selectedCountry) {
        await showCountryPlans(selectedCountry.code, selectedCountry.name);
      }
      
      // Refresh countries to update plan counts
      await loadCountriesFromFirestore();
    } catch (error) {
      console.error('❌ Error attaching plan to country:', error);
      toast.error(`Error attaching plan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (planId, currentStatus) => {
    try {
      setLoading(true);
      const planRef = doc(db, 'plans', planId);
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
      const planRef = doc(db, 'plans', planId);
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
  const calculateRetailPrice = (originalPrice) => {
    return Math.round(originalPrice * (1 + markupPercentage / 100));
  };

  // Load markup percentage from configuration
  const loadMarkupPercentage = async () => {
    try {
      const pricingConfigRef = doc(db, 'config', 'pricing');
      const pricingConfig = await getDoc(pricingConfigRef);
      
      if (pricingConfig.exists()) {
        const data = pricingConfig.data();
        setMarkupPercentage(data.markup_percentage || 17);
        setRegularDiscountPercentage(data.regular_discount_percentage || 10);
        setTransactionCommissionPercentage(data.transaction_commission_percentage || 5);
        console.log(`💰 Loaded markup percentage: ${data.markup_percentage || 17}%`);
        console.log(`💰 Loaded regular discount percentage: ${data.regular_discount_percentage || 10}%`);
        console.log(`💰 Loaded transaction commission percentage: ${data.transaction_commission_percentage || 5}%`);
      }
    } catch (error) {
      console.error('❌ Error loading markup percentage:', error);
    }
  };

  // Save markup percentage configuration
  const saveMarkupPercentage = async () => {
    try {
      setLoading(true);
      
      // Save to both locations for compatibility
      // 1. Save to config/pricing (for backward compatibility)
      const pricingConfigRef = doc(db, 'config', 'pricing');
      await setDoc(pricingConfigRef, {
        markup_percentage: markupPercentage,
        regular_discount_percentage: regularDiscountPercentage,
        transaction_commission_percentage: transactionCommissionPercentage,
        updated_at: serverTimestamp(),
        updated_by: currentUser?.uid || 'admin'
      }, { merge: true });
      
      // 2. Save to settings/general/referral (for referral system)
      const settingsRef = doc(db, 'settings', 'general');
      await setDoc(settingsRef, {
        referral: {
          discountPercentage: markupPercentage,
          minimumPrice: 0.5,
          transactionCommissionPercentage: transactionCommissionPercentage
        },
        regular: {
          discountPercentage: regularDiscountPercentage,
          minimumPrice: 0.5
        },
        updatedAt: serverTimestamp(),
        updatedBy: currentUser?.uid || 'admin'
      }, { merge: true });
      
      toast.success(`Settings updated: Referral ${markupPercentage}%, Regular ${regularDiscountPercentage}%, Commission ${transactionCommissionPercentage}%`);
      console.log(`✅ Settings saved: Referral ${markupPercentage}%, Regular ${regularDiscountPercentage}%, Commission ${transactionCommissionPercentage}%`);
    } catch (error) {
      console.error('❌ Error saving markup percentage:', error);
      toast.error(`Error saving markup percentage: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

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
    { label: 'Total Countries', value: countries.length, icon: Globe, color: 'blue' },
    { label: 'Regions', value: regions.length, icon: MapPin, color: 'green' },
    { label: 'Environment', value: currentEnvironment, icon: Settings, color: 'gray' },
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
              { id: 'config', label: 'Configuration', icon: Settings, permission: canManageConfig },
              { id: 'countries', label: 'Countries', icon: Globe, permission: canManageCountries },
              { id: 'plans', label: 'Plans Management', icon: Smartphone, permission: canManagePlans },
              { id: 'esim', label: 'eSIM Management', icon: Activity, permission: canManagePlans },
              { id: 'blog', label: 'Blog Management', icon: FileText, permission: canManageBlog },
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
                  ['settings', 'requests', 'newsletter', 'jobs', 'users'].includes(activeTab)
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
                    { id: 'settings', label: 'Links', icon: Link, permission: canManageConfig },
                    { id: 'requests', label: 'Contact Requests', icon: MessageSquare, permission: canManageContactRequests },
                    { id: 'newsletter', label: 'Newsletter', icon: Mail, permission: canManageNewsletter },
                    { id: 'jobs', label: 'Job Applications', icon: Briefcase, permission: canManageContactRequests },
                    { id: 'users', label: 'Manage Users', icon: Users, permission: canManageAdmins },
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
                { id: 'config', label: 'Configuration' },
                { id: 'settings', label: 'Links' },
                { id: 'countries', label: 'Countries' },
                { id: 'plans', label: 'Plans Management' },
                { id: 'esim', label: 'eSIM Management' },
                { id: 'blog', label: 'Blog Management' },
                { id: 'requests', label: 'Contact Requests' },
                { id: 'newsletter', label: 'Newsletter' },
                { id: 'jobs', label: 'Job Applications' },
                { id: 'users', label: 'Manage Users' },
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
                        {countries.length} countries loaded
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Configuration Tab */}
            {activeTab === 'config' && canManageConfig && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Data Sync */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center">
                      <Download className="text-green-600 mr-2" />
                      Data Synchronization
                    </h2>
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">API Endpoint:</div>
                      <div className="text-sm font-mono text-blue-600 break-all">
                        https://partners-api.airalo.com/v2
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-4">
                        <button
                          onClick={syncAllDataFromAiralo}
                          disabled={loading}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
                        >
                          {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                          Sync All Data from Airalo API
                        </button>
                      </div>
                      
                    </div>
                  </div>

                  {/* Airalo API Configuration */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Globe className="text-blue-600 mr-2" />
                    Airalo API Configuration
                  </h2>
                  <div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client ID (API Key)
                      </label>
                      <input
                        type="text"
                        value={airaloClientId}
                        onChange={(e) => setAiraloClientId(e.target.value)}
                        placeholder="Enter your Airalo Client ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    
                    <div className="mt-4">
                      <button
                      onClick={saveAiraloCredentials}
                      disabled={loading || !airaloClientId.trim()}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Globe className="w-5 h-5 mr-2" />}
                      Save Airalo Client ID
                    </button>
                    </div>
                  </div>
                </div>
                </div>

                {/* Price Configuration */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Settings className="text-blue-600 mr-2" />
                    Price Configuration
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Configure referral program discount percentage.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Referral Program Discount</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Set the discount percentage applied to original prices for users with referral codes.
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={markupPercentage}
                            onChange={(e) => setMarkupPercentage(parseFloat(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Example: $10 original → ${(10 * (100 - markupPercentage) / 100).toFixed(2)} discounted
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Regular/Basic Discount</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Set the discount percentage applied to original prices for all regular users.
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={regularDiscountPercentage}
                            onChange={(e) => setRegularDiscountPercentage(parseFloat(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Example: $10 original → ${(10 * (100 - regularDiscountPercentage) / 100).toFixed(2)} discounted
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Transaction Commission</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Set the commission percentage that referral code owners earn from each transaction made by their referred users.
                      </p>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={transactionCommissionPercentage}
                            onChange={(e) => setTransactionCommissionPercentage(parseFloat(e.target.value) || 0)}
                            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            min="0"
                            max="100"
                            step="0.1"
                          />
                          <span className="text-sm text-gray-600">%</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Example: $10 transaction → ${(10 * transactionCommissionPercentage / 100).toFixed(2)} commission earned
                        </div>
                      </div>
                    </div>

                    <div className="text-center pt-4">
                      <button
                        onClick={saveMarkupPercentage}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Saving...' : 'Save All Discount Settings'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Database Management */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Database className="text-gray-600 mr-2" />
                    Database Management
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Manage your database content and sync fresh data from Airalo.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800 mb-2">Reset All Data</h3>
                      <p className="text-sm text-gray-600 mb-3">
                        This will remove all countries and their associated plans from the database. 
                        Fresh data can then be synced from Airalo. This action cannot be undone.
                      </p>
                      <button
                        onClick={deleteAllCountries}
                        disabled={loading || isDeleting}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center"
                      >
                        {isDeleting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 mr-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </motion.div>
                        ) : (
                          <Trash2 className="w-5 h-5 mr-2" />
                        )}
                        {isDeleting ? 'Resetting...' : 'Reset All Data'}
                      </button>
                    </div>
                  </div>
                </div>


                {/* Add spacing after the section */}
                <div className="h-8"></div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && canManageConfig && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Website Links</h2>
                      <p className="text-gray-600">Manage social media links, contact information, and company details</p>
                    </div>
                    <div className="flex space-x-3">
                    </div>
                  </div>
                </div>

                {/* Links Tabs */}
                <div className="bg-white rounded-xl shadow-lg p-1">
                  <nav className="flex space-x-1">
                    {[
                      { id: 'social', label: 'Social Media', icon: Link },
                      { id: 'contact', label: 'Contact Info', icon: Phone },
                      { id: 'hours', label: 'Business Hours', icon: Clock },
                      { id: 'referral', label: 'Referral Settings', icon: Gift },
                      { id: 'appstore', label: 'App Store Links', icon: Smartphone }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveSettingsTab(tab.id)}
                          className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            activeSettingsTab === tab.id
                              ? 'bg-black text-white shadow-lg'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Links Content */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  {settingsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading links...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Social Media Tab */}
                      {activeSettingsTab === 'social' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Social Media Links</h3>
                            <button
                              onClick={() => handleSaveSettings('socialMedia')}
                              disabled={settingsLoading}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Social Media
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Linkedin className="w-4 h-4 inline mr-2" />
                                LinkedIn URL
                              </label>
                              <input
                                type="url"
                                value={settingsFormData.socialMedia.linkedin || ''}
                                onChange={(e) => handleSettingsInputChange('socialMedia', 'linkedin', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://linkedin.com/company/yourcompany"
                              />
                              {settingsErrors.linkedin && (
                                <p className="text-red-500 text-sm mt-1">{settingsErrors.linkedin}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Facebook className="w-4 h-4 inline mr-2" />
                                Facebook URL
                              </label>
                              <input
                                type="url"
                                value={settingsFormData.socialMedia.facebook || ''}
                                onChange={(e) => handleSettingsInputChange('socialMedia', 'facebook', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://facebook.com/yourcompany"
                              />
                              {settingsErrors.facebook && (
                                <p className="text-red-500 text-sm mt-1">{settingsErrors.facebook}</p>
                              )}
                            </div>


                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Instagram className="w-4 h-4 inline mr-2" />
                                Instagram URL
                              </label>
                              <input
                                type="url"
                                value={settingsFormData.socialMedia.instagram || ''}
                                onChange={(e) => handleSettingsInputChange('socialMedia', 'instagram', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://instagram.com/yourcompany"
                              />
                              {settingsErrors.instagram && (
                                <p className="text-red-500 text-sm mt-1">{settingsErrors.instagram}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Youtube className="w-4 h-4 inline mr-2" />
                                YouTube URL
                              </label>
                              <input
                                type="url"
                                value={settingsFormData.socialMedia.youtube || ''}
                                onChange={(e) => handleSettingsInputChange('socialMedia', 'youtube', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="https://youtube.com/c/yourcompany"
                              />
                              {settingsErrors.youtube && (
                                <p className="text-red-500 text-sm mt-1">{settingsErrors.youtube}</p>
                              )}
                            </div>

                          </div>
                        </div>
                      )}

                      {/* Contact Information Tab */}
                      {activeSettingsTab === 'contact' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Contact Information</h3>
                            <button
                              onClick={() => handleSaveSettings('contact')}
                              disabled={settingsLoading}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Contact Info
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Mail className="w-4 h-4 inline mr-2" />
                                Email Address
                              </label>
                              <input
                                type="email"
                                value={settingsFormData.contact.email || ''}
                                onChange={(e) => handleSettingsInputChange('contact', 'email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="contact@yourcompany.com"
                              />
                              {settingsErrors.email && (
                                <p className="text-red-500 text-sm mt-1">{settingsErrors.email}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Phone className="w-4 h-4 inline mr-2" />
                                Phone Number
                              </label>
                              <input
                                type="tel"
                                value={settingsFormData.contact.phone || ''}
                                onChange={(e) => handleSettingsInputChange('contact', 'phone', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+1 (555) 123-4567"
                              />
                              {settingsErrors.phone && (
                                <p className="text-red-500 text-sm mt-1">{settingsErrors.phone}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <Building className="w-4 h-4 inline mr-2" />
                                Company Name
                              </label>
                              <input
                                type="text"
                                value={settingsFormData.contact.companyName || ''}
                                onChange={(e) => handleSettingsInputChange('contact', 'companyName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Your Company Name"
                              />
                              {settingsErrors.companyName && (
                                <p className="text-red-500 text-sm mt-1">{settingsErrors.companyName}</p>
                              )}
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                <MapPin className="w-4 h-4 inline mr-2" />
                                Address
                              </label>
                              <input
                                type="text"
                                value={settingsFormData.contact.address || ''}
                                onChange={(e) => handleSettingsInputChange('contact', 'address', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="123 Main Street, City, State 12345"
                              />
                            </div>

                          </div>
                        </div>
                      )}


                      {/* Business Hours Tab */}
                      {activeSettingsTab === 'hours' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Business Hours</h3>
                            <button
                              onClick={handleOpenBusinessHoursModal}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Manage Hours
                            </button>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="text-md font-medium text-gray-900 mb-4">Current Business Hours</h4>
                            <div className="space-y-2">
                              {settings?.businessHours ? (
                                Object.entries(settings.businessHours).map(([day, hours]) => (
                                  <div key={day} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                    <span className="font-medium capitalize">{day}</span>
                                    <span className="text-gray-600">
                                      {hours.closed ? 'Closed' : `${hours.open || '--'} - ${hours.close || '--'}`}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500">No business hours set. Click "Manage Hours" to add them.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Referral Settings Tab */}
                      {activeSettingsTab === 'referral' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Referral Discount Settings</h3>
                            <button
                              onClick={() => handleSaveSettings('referral')}
                              disabled={settingsLoading}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Referral Settings
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Discount Percentage */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                              <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4">
                                  <Gift className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Discount Percentage</h4>
                                  <p className="text-sm text-gray-600">Percentage discount for users who used referral codes</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Discount Percentage (%)
                                </label>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={settingsFormData.referral?.discountPercentage || 10}
                                    onChange={(e) => handleSettingsInputChange('referral', 'discountPercentage', parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    placeholder="50"
                                  />
                                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                  Example: 50% means users pay half the original price
                                </p>
                              </div>
                            </div>

                            {/* Minimum Price */}
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                              <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mr-4">
                                  <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">Minimum Price</h4>
                                  <p className="text-sm text-gray-600">Minimum price after discount (in USD)</p>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Minimum Price ($)
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={settingsFormData.referral?.minimumPrice || 0.5}
                                    onChange={(e) => handleSettingsInputChange('referral', 'minimumPrice', parseFloat(e.target.value) || 0)}
                                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0.50"
                                  />
                                </div>
                                <p className="text-xs text-gray-500">
                                  Example: $0.50 means no plan will cost less than $0.50
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Preview */}
                          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-4">Discount Preview</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-2">Original Price: $5.00</div>
                                <div className="text-lg font-semibold text-green-600">
                                  Discounted: ${((5.00 * (100 - (settingsFormData.referral?.discountPercentage || 10))) / 100).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Save: ${(5.00 - ((5.00 * (100 - (settingsFormData.referral?.discountPercentage || 10))) / 100)).toFixed(2)}
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-2">Original Price: $10.00</div>
                                <div className="text-lg font-semibold text-green-600">
                                  Discounted: ${Math.max((settingsFormData.referral?.minimumPrice || 0.5), ((10.00 * (100 - (settingsFormData.referral?.discountPercentage || 10))) / 100)).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Save: ${(10.00 - Math.max((settingsFormData.referral?.minimumPrice || 0.5), ((10.00 * (100 - (settingsFormData.referral?.discountPercentage || 10))) / 100))).toFixed(2)}
                                </div>
                              </div>
                              <div className="bg-white rounded-lg p-4 border border-gray-200">
                                <div className="text-sm text-gray-600 mb-2">Original Price: $1.00</div>
                                <div className="text-lg font-semibold text-green-600">
                                  Discounted: ${Math.max((settingsFormData.referral?.minimumPrice || 0.5), ((1.00 * (100 - (settingsFormData.referral?.discountPercentage || 10))) / 100)).toFixed(2)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Save: ${(1.00 - Math.max((settingsFormData.referral?.minimumPrice || 0.5), ((1.00 * (100 - (settingsFormData.referral?.discountPercentage || 10))) / 100))).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Commission Display Section */}
                          <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                              <Gift className="w-5 h-5 mr-2" />
                              Recent Commissions
                            </h3>
                            <div className="space-y-4">
                              {withdrawalRequests
                                .filter(request => request.type === 'commission')
                                .slice(0, 10)
                                .map((commission, index) => (
                                  <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                                        <Gift className="w-5 h-5 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          Commission from {commission.referralCode}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          Referred user: {commission.referredUserId}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {commission.timestamp?.toDate ? 
                                            new Date(commission.timestamp.toDate()).toLocaleString() : 
                                            'Recent'
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-semibold text-green-600">
                                        +${commission.amount?.toFixed(2) || '0.00'}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {commission.planName || 'eSIM Plan'}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              {withdrawalRequests.filter(request => request.type === 'commission').length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                  <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                  <p>No commissions earned yet</p>
                                  <p className="text-sm">Commissions will appear here when users make purchases with referral codes</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* App Store Links Tab */}
                      {activeSettingsTab === 'appstore' && (
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">App Store Links</h3>
                            <button
                              onClick={() => handleSaveSettings('appStore')}
                              disabled={settingsLoading}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save App Store Links
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* iOS App Store */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                              <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mr-4">
                                  <Apple className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">iOS App Store</h4>
                                  <p className="text-sm text-gray-600">Apple App Store link</p>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  App Store URL
                                </label>
                                <input
                                  type="url"
                                  value={settingsFormData.appStore?.iosUrl || ''}
                                  onChange={(e) => handleSettingsInputChange('appStore', 'iosUrl', e.target.value)}
                                  placeholder="https://apps.apple.com/app/your-app"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            {/* Google Play Store */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                              <div className="flex items-center mb-4">
                                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mr-4">
                                  <Play className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">Google Play Store</h4>
                                  <p className="text-sm text-gray-600">Android app link</p>
                                </div>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Play Store URL
                                </label>
                                <input
                                  type="url"
                                  value={settingsFormData.appStore?.androidUrl || ''}
                                  onChange={(e) => handleSettingsInputChange('appStore', 'androidUrl', e.target.value)}
                                  placeholder="https://play.google.com/store/apps/details?id=your.app"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>

                        </div>
                      )}

                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Countries Tab */}
            {activeTab === 'countries' && canManageCountries && (
              <div className="space-y-6">
                {/* Search and Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search countries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex space-x-3">
                      {/* Delete All Countries button moved to Configuration tab */}
                    </div>
                  </div>
                </div>

                {/* Countries Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCountries.map((country, index) => (
                    <motion.div
                      key={country.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{country.name}</h3>
                          <p className="text-sm text-gray-500">{country.code}</p>
                        </div>
                        <span className="text-2xl">{country.flagEmoji || getFlagEmoji(country.code) || '🏳️'}</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {country.hasPlans ? (
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              From ${country.minPrice}
                            </p>
                            <p className="text-xs text-gray-500">
                              {country.planCount} plan{country.planCount !== 1 ? 's' : ''} available
                            </p>
                          </div>
                        ) : null}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => deleteCountryFromFirestore(country.code)}
                          className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Plans Management Tab */}
            {activeTab === 'plans' && canManagePlans && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Plans Management</h2>
                      <p className="text-gray-600 mt-1">Manage eSIM plans, pricing, and availability</p>
                    </div>
                  </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    {/* Status Filter */}
                    <select
                      value={planStatusFilter}
                      onChange={(e) => setPlanStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Plans</option>
                      <option value="enabled">Enabled Only</option>
                      <option value="disabled">Disabled Only</option>
                    </select>

                    {/* Country Filter */}
                    <select
                      value={planCountryFilter}
                      onChange={(e) => setPlanCountryFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Countries</option>
                      {getUniqueCountries().map(countryCode => (
                        <option key={countryCode} value={countryCode}>
                          {getFlagEmoji(countryCode)} {countryCode}
                        </option>
                      ))}
                    </select>

                    {/* Sort By */}
                    <select
                      value={planSortBy}
                      onChange={(e) => setPlanSortBy(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="price">Sort by Price</option>
                      <option value="name">Sort by Name</option>
                      <option value="country">Sort by Country</option>
                    </select>

                    {/* Sort Order */}
                    <select
                      value={planSortOrder}
                      onChange={(e) => setPlanSortOrder(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="asc">Ascending</option>
                      <option value="desc">Descending</option>
                    </select>
                  </div>
                </div>

                {/* Plans Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data & Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Countries
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Retail Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredPlans.length > 0 ? (
                          filteredPlans.map((plan) => (
                            <tr key={plan.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                      <Smartphone className="w-5 h-5 text-blue-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {plan.name || 'Unnamed Plan'}
                                    </div>
                                    {plan.operator && (
                                      <div className="text-sm text-gray-500">
                                        {plan.operator}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {(plan.capacity === -1 || plan.capacity === 0 || plan.capacity === 'Unlimited') ? 'Unlimited' : `${plan.capacity} GB`}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {plan.period ? `${plan.period} days` : 'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-wrap gap-1">
                                  {(plan.country_codes || plan.country_ids || []).length > 0 ? (
                                    <>
                                      {(plan.country_codes || plan.country_ids || []).slice(0, 3).map((code, index) => (
                                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          {getFlagEmoji(code)}
                                        </span>
                                      ))}
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
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Retail:</span>
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
                                      className="w-20 px-2 py-1 text-sm text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                    >
                                      {plan.price || 0}
                                    </div>
                                  )}
                                  <span className="text-sm text-gray-500">
                                    {plan.currency || 'USD'}
                                  </span>
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
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button
                                  onClick={() => togglePlanStatus(plan.id, plan.enabled)}
                                  disabled={loading}
                                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    plan.enabled
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  } disabled:opacity-50`}
                                >
                                  {plan.enabled ? (
                                    <>
                                      <Eye className="w-3 h-3 mr-1" />
                                      Enabled
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="w-3 h-3 mr-1" />
                                      Disabled
                                    </>
                                  )}
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => togglePlanStatus(plan.id, plan.enabled)}
                                    disabled={loading}
                                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                  >
                                    {plan.enabled ? 'Disable' : 'Enable'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
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

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Smartphone className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Plans</p>
                        <p className="text-2xl font-bold text-gray-900">{allPlans.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Eye className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Enabled Plans</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {allPlans.filter(plan => plan.enabled).length}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <EyeOff className="w-8 h-8 text-red-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Disabled Plans</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {allPlans.filter(plan => !plan.enabled).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* eSIM Management Tab */}
            {activeTab === 'esim' && canManagePlans && (
              <AdminEsimManagement />
            )}

            {/* Blog Management Tab */}
            {activeTab === 'blog' && canManageBlog && (
              <BlogManagement />
            )}

            {/* Contact Requests Tab */}
            {activeTab === 'requests' && canManageContactRequests && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Contact Requests</h2>
                      <p className="text-gray-600">Manage customer support requests and inquiries</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {filteredContactRequests.length} request{filteredContactRequests.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search requests by name, email, or message..."
                        value={contactRequestSearchTerm}
                        onChange={(e) => setContactRequestSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={contactRequestStatusFilter}
                        onChange={(e) => setContactRequestStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Message
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredContactRequests.length > 0 ? (
                          filteredContactRequests.map((request) => (
                            <tr key={request.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700">
                                        {request.name?.charAt(0).toUpperCase() || 'U'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {request.name || 'Unknown'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {request.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-gray-900 max-w-xs truncate">
                                  {request.message}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  request.status === 'new' 
                                    ? 'bg-blue-100 text-blue-800'
                                    : request.status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : request.status === 'resolved'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {request.status?.replace('_', ' ') || 'unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {request.createdAt ? new Date(request.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <select
                                    value={request.status || 'new'}
                                    onChange={(e) => handleUpdateRequestStatus(request.id, e.target.value)}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="new">New</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                  </select>
                                  <button
                                    onClick={() => handleDeleteContactRequest(request.id, request.name)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition-colors"
                                    title="Delete request"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm">No contact requests found</p>
                              {contactRequestSearchTerm && (
                                <p className="text-xs mt-1">Try adjusting your search terms</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Newsletter Tab */}
            {activeTab === 'newsletter' && canManageNewsletter && (
              <div className="space-y-6">
                {/* Header with Stats */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Newsletter Subscriptions</h2>
                      <p className="text-gray-600">Manage newsletter subscribers and their status</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {filteredNewsletterSubscriptions.length} subscription{filteredNewsletterSubscriptions.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{newsletterStats.total}</div>
                      <div className="text-sm text-blue-800">Total Subscribers</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{newsletterStats.active}</div>
                      <div className="text-sm text-green-800">Active</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-gray-600">{newsletterStats.unsubscribed}</div>
                      <div className="text-sm text-gray-800">Unsubscribed</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-600">{newsletterStats.bounced}</div>
                      <div className="text-sm text-red-800">Bounced</div>
                    </div>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search subscribers by email or source..."
                        value={newsletterSearchTerm}
                        onChange={(e) => setNewsletterSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={newsletterStatusFilter}
                        onChange={(e) => setNewsletterStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="unsubscribed">Unsubscribed</option>
                        <option value="bounced">Bounced</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subscriptions Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subscribed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredNewsletterSubscriptions.length > 0 ? (
                          filteredNewsletterSubscriptions.map((subscription) => (
                            <tr key={subscription.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700">
                                        {subscription.email?.charAt(0).toUpperCase() || 'U'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {subscription.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  subscription.status === 'active' 
                                    ? 'bg-green-100 text-green-800'
                                    : subscription.status === 'unsubscribed'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {subscription.status || 'unknown'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {subscription.source || 'website'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {subscription.subscribedAt ? new Date(subscription.subscribedAt.toDate()).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <select
                                    value={subscription.status || 'active'}
                                    onChange={(e) => handleUpdateNewsletterStatus(subscription.id, e.target.value)}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="active">Active</option>
                                    <option value="unsubscribed">Unsubscribed</option>
                                    <option value="bounced">Bounced</option>
                                  </select>
                                  <button
                                    onClick={() => handleDeleteNewsletterSubscription(subscription.id, subscription.email)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition-colors"
                                    title="Delete subscription"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm">No newsletter subscriptions found</p>
                              {newsletterSearchTerm && (
                                <p className="text-xs mt-1">Try adjusting your search terms</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && canManageContactRequests && (
              <div className="space-y-6">
                {/* Header with Stats */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">Job Applications</h2>
                      <p className="text-gray-600">Manage job applications and candidate status</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {filteredJobApplications.length} application{filteredJobApplications.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">{jobStats.total}</div>
                      <div className="text-sm text-blue-800">Total Applications</div>
                    </div>
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-yellow-600">{jobStats.pending}</div>
                      <div className="text-sm text-yellow-800">Pending</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">{jobStats.reviewed}</div>
                      <div className="text-sm text-purple-800">Reviewed</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{jobStats.contacted}</div>
                      <div className="text-sm text-green-800">Contacted</div>
                    </div>
                    <div className="bg-red-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-red-600">{jobStats.rejected}</div>
                      <div className="text-sm text-red-800">Rejected</div>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-emerald-600">{jobStats.hired}</div>
                      <div className="text-sm text-emerald-800">Hired</div>
                    </div>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search applications by name, email, or position..."
                        value={jobSearchTerm}
                        onChange={(e) => setJobSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <select
                        value={jobStatusFilter}
                        onChange={(e) => setJobStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="contacted">Contacted</option>
                        <option value="rejected">Rejected</option>
                        <option value="hired">Hired</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Applicant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Position
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Applied
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredJobApplications.length > 0 ? (
                          filteredJobApplications.map((application) => (
                            <tr key={application.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <User className="w-5 h-5 text-gray-600" />
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {application.name}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {application.email}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                                  <span className="text-sm text-gray-900">{application.position}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">{application.phone}</div>
                                <div className="text-sm text-gray-500">{application.email}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  application.status === 'pending' 
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : application.status === 'reviewed'
                                    ? 'bg-purple-100 text-purple-800'
                                    : application.status === 'contacted'
                                    ? 'bg-green-100 text-green-800'
                                    : application.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : application.status === 'hired'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {application.status || 'pending'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  {application.resumeUrl && (
                                    <a
                                      href={application.resumeUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-xs transition-colors"
                                      title="View Resume"
                                    >
                                      <ExternalLink className="w-3 h-3 inline mr-1" />
                                      Resume
                                    </a>
                                  )}
                                  <select
                                    value={application.status || 'pending'}
                                    onChange={(e) => handleUpdateJobApplicationStatus(application.id, e.target.value)}
                                    className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="reviewed">Reviewed</option>
                                    <option value="contacted">Contacted</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="hired">Hired</option>
                                  </select>
                                  <button
                                    onClick={() => handleDeleteJobApplication(application.id, application.name)}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs transition-colors"
                                    title="Delete application"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                              <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium">No job applications found</p>
                              <p className="text-sm">Applications will appear here when candidates apply for positions.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


            {/* Manage Users Tab */}
            {activeTab === 'users' && canManageAdmins && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">User Management</h2>
                      <p className="text-gray-600">Manage users and their permissions</p>
                    </div>
                  </div>
                </div>

                {/* Users Search and Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search users by email, role, or user ID..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="text-sm text-gray-600">
                      {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                    </div>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10">
                                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                      <span className="text-sm font-medium text-gray-700">
                                        {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {user.email || 'No email'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      User ID: {user.id}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.role === 'admin' || user.role === 'super_admin'
                                    ? 'bg-red-100 text-red-800'
                                    : user.role === 'moderator'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {user.role || 'user'}
                                </span>
                              </td>

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      // Navigate to user details page in same window
                                      window.location.href = `/admin/user/${user.id}`;
                                    }}
                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs transition-colors"
                                    title="View user details"
                                  >
                                    View Details
                                  </button>
                                  {(user.role === 'admin' || user.role === 'super_admin') && (
                                    <button
                                      onClick={() => {
                                        setSelectedUserForAction(user);
                                        setShowRemoveAdminModal(true);
                                      }}
                                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs transition-colors"
                                      title="Remove admin privileges"
                                    >
                                      Remove Admin
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteUser(user.id, user.email || 'Unknown')}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-md text-xs transition-colors"
                                    title="Delete user"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                              <p className="text-sm">No users found</p>
                              {userSearchTerm && (
                                <p className="text-xs mt-1">Try adjusting your search terms</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
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

        {/* Country Plans Modal */}
        {showCountriesModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold">Plans for {selectedCountryName}</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage country eSIM plans</p>
                  </div>
                  <div className="flex space-x-3">
                    <div className="relative dropdown-container" style={{ position: 'relative', zIndex: 9999 }}>
                      <button
                        onClick={async () => {
                          const newState = !showAttachCountryPlanModal;
                          setShowAttachCountryPlanModal(newState);
                          if (newState) {
                            // Load available plans when opening the modal
                            await loadAvailablePlansForCountry();
                          }
                        }}
                        className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Attach Plan
                      </button>
                      
                      {/* Dropdown Menu */}
                                                {showAttachCountryPlanModal && (
                        <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden" style={{ 
                          minWidth: '400px', 
                          maxWidth: '90vw',
                          maxHeight: '400px',
                          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}>
                          <div className="p-3 border-b border-gray-200 bg-gray-50">
                            <h4 className="font-semibold text-gray-900">Select Plan to Attach</h4>
                            <p className="text-sm text-gray-600">Available plans from Airalo</p>
                          </div>
                          
                          <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
                          {availablePlans.length > 0 ? (
                            <div className="p-2">
                              {availablePlans.map((plan) => (
                                <div
                                  key={plan.id}
                                  onClick={() => {
                                    attachPlanToCountry(plan);
                                    setShowAttachCountryPlanModal(false);
                                  }}
                                  className="p-3 hover:bg-gray-50 rounded-lg cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-gray-900 text-sm truncate">{plan.name}</h5>
                                      <p className="text-xs text-gray-600">{plan.data} • {plan.duration}</p>
                                      <p className="text-xs text-gray-500">Country: {plan.country}</p>
                                    </div>
                                    <div className="text-right ml-2 flex-shrink-0">
                                      <p className="text-sm font-bold text-green-600">{plan.currency === 'USD' ? '$' : plan.currency}{Math.round(plan.price)}</p>
                                      <p className="text-xs text-gray-500">{plan.currency}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCountriesModal(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-96">
                {selectedCountryPlans.length > 0 ? (
                  <div className="space-y-4">
                    {selectedCountryPlans.map((plan) => {
                      console.log('📋 Rendering plan:', plan);
                      return (
                        <div key={plan.id} className="border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-md transition-all">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                                {plan.source && (
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    plan.source === 'mobile' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {plan.source === 'mobile' ? '📱 Mobile' : '🌐 Web'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{plan.data} • {plan.duration}</p>
                              <p className="text-sm text-gray-500">Country: {plan.country}</p>
                              <div className="mt-2">
                                <div>
                                  <p className="text-gray-500">Price</p>
                                  <p className="text-lg font-bold text-black">{plan.currency === 'USD' ? '$' : plan.currency}{Math.round(plan.price)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  console.log('🔧 Edit button clicked for plan:', plan);
                                  const newPrice = prompt(`Edit price for "${plan.name}"\n\nCurrent price: ${plan.currency === 'USD' ? '$' : plan.currency}${Math.round(plan.price)}\n\nEnter new price:`, Math.round(plan.price));
                                  if (newPrice && !isNaN(parseFloat(newPrice)) && parseFloat(newPrice) > 0) {
                                    console.log('💰 Updating price for plan:', plan.id, 'to:', newPrice);
                                    updateCountryPlanPrice(plan.id, parseFloat(newPrice));
                                  } else if (newPrice !== null) {
                                    toast.error('Please enter a valid price');
                                  }
                                }}
                                className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit Price
                              </button>
                              <button
                                onClick={() => {
                                  console.log('🗑️ Delete button clicked for plan:', plan);
                                  if (window.confirm(`Remove plan "${plan.name}" from this country?`)) {
                                    console.log('🗑️ Deleting plan:', plan.id, plan.name);
                                    deleteCountryPlan(plan.id, plan.name);
                                  }
                                }}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Plans Attached</h4>
                    <p className="text-gray-600">This country doesn't have any plans yet. Use "Attach Plan" to add plans from Airalo.</p>
                  </div>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Available Plans: {selectedCountryPlans.length}</span>
                  <span>Country: {selectedCountryName}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}




        {/* Attach Country Plan Modal */}

        {/* Remove Admin Modal */}
        {showRemoveAdminModal && selectedUserForAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-red-600">Remove Admin Privileges</h3>
                <button
                  onClick={() => {
                    setShowRemoveAdminModal(false);
                    setSelectedUserForAction(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-800">Warning</span>
                  </div>
                  <p className="text-sm text-red-700 mt-2">
                    You are about to remove admin privileges from <strong>{selectedUserForAction.email}</strong>.
                  </p>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>What this means:</strong></p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>User will lose access to admin dashboard</li>
                    <li>User will become a regular user</li>
                    <li>This action can be reversed by another admin</li>
                  </ul>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRemoveAdminModal(false);
                      setSelectedUserForAction(null);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => removeUserFromAdmin(selectedUserForAction.id, selectedUserForAction.email)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                  >
                    {loading ? 'Removing...' : 'Remove Admin'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Business Hours Modal */}
        {showBusinessHoursModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold">Manage Business Hours</h3>
                <button
                  onClick={() => setShowBusinessHoursModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {Object.entries(businessHoursData).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-24">
                        <span className="font-medium capitalize">{day}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={hours.closed}
                          onChange={(e) => handleBusinessHoursChange(day, 'closed', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Closed</span>
                      </div>
                      
                      {!hours.closed && (
                        <div className="flex items-center space-x-2">
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-gray-500">to</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowBusinessHoursModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBusinessHours}
                  disabled={settingsLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors flex items-center"
                >
                  {settingsLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Hours
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
