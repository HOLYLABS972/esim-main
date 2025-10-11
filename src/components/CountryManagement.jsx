'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc, 
  serverTimestamp,
  where,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { esimService } from '../services/esimService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe,
  Edit3,
  Trash2,
  Search,
  Plus,
  Upload,
  Download,
  RefreshCw,
  Save,
  X,
  Image as ImageIcon,
  DollarSign,
  Languages,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';
import { usePathname } from 'next/navigation';
import CountryEditModal from './CountryEditModal';
import TariffManagement from './TariffManagement';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
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

const CountryManagement = () => {
  const { currentUser } = useAuth();
  const { t, locale } = useI18n();
  const pathname = usePathname();
  
  // Get current language for RTL detection
  const getCurrentLanguage = () => {
    if (locale) return locale;
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('roamjet-language');
      if (savedLanguage) return savedLanguage;
    }
    return detectLanguageFromPath(pathname);
  };

  const currentLanguage = getCurrentLanguage();
  const isRTL = getLanguageDirection(currentLanguage) === 'rtl';

  // State Management
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Airalo sync states
  const [syncingPrices, setSyncingPrices] = useState(false);
  const [syncingCountry, setSyncingCountry] = useState(null);
  
  // Expanded country details
  const [expandedCountry, setExpandedCountry] = useState(null);
  
  // Tariff management view
  const [showTariffManagement, setShowTariffManagement] = useState(false);
  const [selectedCountryForTariffs, setSelectedCountryForTariffs] = useState(null);

  // Load countries on component mount
  useEffect(() => {
    if (currentUser) {
      loadCountries();
    }
  }, [currentUser]);

  // Filter countries based on search term
  useEffect(() => {
    let filtered = [...countries];

    if (searchTerm.trim()) {
      filtered = filtered.filter(country => 
        country.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(country.translations || {}).some(translation => 
          translation.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    setFilteredCountries(filtered);
  }, [countries, searchTerm]);

  // Load all countries from Firebase
  const loadCountries = async () => {
    try {
      setLoading(true);
      const countriesSnapshot = await getDocs(
        query(collection(db, 'countries'), orderBy('name', 'asc'))
      );
      
      const countriesData = countriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCountries(countriesData);
      console.log('✅ Loaded', countriesData.length, 'countries from Firebase');
    } catch (error) {
      console.error('❌ Error loading countries:', error);
      toast.error(`Error loading countries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Sync prices from Airalo for specific country
  // This function:
  // 1. Calls sync-airalo API to fetch fresh pricing data from Airalo API
  // 2. Airalo data is stored in Firebase (dataplans collection)
  // 3. Reads the updated plans from Firebase
  // 4. Updates the country document with plan count and min price
  const syncCountryPricesFromAiralo = async (countryCode) => {
    try {
      setSyncingCountry(countryCode);
      console.log('🔄 Syncing prices for country from Airalo API:', countryCode);
      
      // First, trigger a full sync from Airalo API to Firebase
      console.log('📡 Calling sync-airalo API to fetch fresh data from Airalo...');
      const syncResult = await esimService.syncAllDataFromApi();
      
      if (!syncResult.success) {
        throw new Error(syncResult.error || 'Failed to sync from Airalo');
      }
      
      console.log('✅ Sync completed:', syncResult);
      
      // Now fetch the updated plans from Firebase (fetch ALL plans, not just 50)
      const result = await esimService.fetchPlans(null, 2000);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch plans from Firebase');
      }
      
      // Debug: Check the structure of plans data
      console.log('🔍 Total plans from Firebase:', result.plans?.length || 0);
      if (result.plans && result.plans.length > 0) {
        const samplePlan = result.plans[0];
        console.log('🔍 Sample plan structure:', {
          id: samplePlan.id,
          name: samplePlan.name,
          slug: samplePlan.slug,
          price: samplePlan.price,
          country_codes: samplePlan.country_codes,
          capacity: samplePlan.capacity,
          period: samplePlan.period
        });
      }
      
      // Filter plans for this specific country
      const countryPlans = result.plans.filter(plan => {
        if (plan.country_codes && Array.isArray(plan.country_codes)) {
          return plan.country_codes.includes(countryCode);
        }
        if (plan.country_ids && Array.isArray(plan.country_ids)) {
          return plan.country_ids.includes(countryCode);
        }
        return false;
      });
      
      console.log(`🔍 Found ${countryPlans.length} plans for ${countryCode}`);
      
      if (countryPlans.length === 0) {
        toast.error(`No plans found for ${countryCode}. The country may not be available in Airalo.`, {
          icon: '⚠️',
        });
        
        // Still update the country to show it was checked
        const countryRef = doc(db, 'countries', countryCode);
        await updateDoc(countryRef, {
          planCount: 0,
          lastPriceSync: serverTimestamp(),
          lastSyncBy: currentUser?.uid || 'admin'
        });
        
        await loadCountries();
        return;
      }
      
      // Calculate min price from the plans
      const prices = countryPlans.map(p => parseFloat(p.price) || 0).filter(p => p > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      
      // Update country's plan count, minPrice, and last sync
      const countryRef = doc(db, 'countries', countryCode);
      await updateDoc(countryRef, {
        planCount: countryPlans.length,
        minPrice: minPrice,
        status: 'active', // Ensure country is marked as active
        lastPriceSync: serverTimestamp(),
        lastSyncBy: currentUser?.uid || 'admin'
      });
      
      toast.success(
        `✅ Synced ${countryCode}: ${countryPlans.length} plans found, min price $${minPrice.toFixed(2)}`
      );
      
      // Reload countries to show updated data
      await loadCountries();
      
    } catch (error) {
      console.error('❌ Error syncing country prices:', error);
      toast.error(`Error syncing ${countryCode}: ${error.message}`);
    } finally {
      setSyncingCountry(null);
    }
  };

  // Sync prices from Airalo for all countries
  const syncAllCountriesFromAiralo = async () => {
    try {
      setSyncingPrices(true);
      console.log('🌍 Syncing all countries from existing dataplans...');
      
      // Fetch ALL plans from Firebase dataplans collection
      console.log('📡 Reading all plans from Firebase dataplans collection...');
      const plansSnapshot = await getDocs(collection(db, 'dataplans'));
      const airaloPlans = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📊 Fetched', airaloPlans.length, 'plans from Firebase dataplans collection');
      
      // Get all existing countries from Firebase
      const countriesSnapshot = await getDocs(collection(db, 'countries'));
      const existingCountries = countriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log('🌍 Found', existingCountries.length, 'countries in Firebase');
      
      let countriesUpdated = 0;
      
      // Update each country with plan count and min price
      for (const country of existingCountries) {
        const countryCode = country.code || country.id;
        
        // Filter plans for this country
        const countryPlans = airaloPlans.filter(plan => {
          if (plan.country_codes && Array.isArray(plan.country_codes)) {
            return plan.country_codes.includes(countryCode);
          }
          if (plan.country_ids && Array.isArray(plan.country_ids)) {
            return plan.country_ids.includes(countryCode);
          }
          return false;
        });
        
        // Calculate min price
        const prices = countryPlans.map(p => parseFloat(p.price) || 0).filter(p => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        
        // Debug log for countries with/without plans
        if (countryPlans.length === 0) {
          console.log(`⚠️ ${countryCode} (${country.name}): No plans found`);
        } else {
          console.log(`✅ ${countryCode} (${country.name}): ${countryPlans.length} plans, min price $${minPrice.toFixed(2)}`);
        }
        
        // Update country in Firebase (even if no plans, to show 0)
        const countryRef = doc(db, 'countries', countryCode);
        await updateDoc(countryRef, {
          planCount: countryPlans.length,
          minPrice: minPrice,
          status: 'active', // Ensure country is marked as active
          lastPriceSync: serverTimestamp(),
          lastSyncBy: currentUser?.uid || 'admin'
        });
        
        countriesUpdated++;
      }
      
      toast.success(
        `✅ Synced all countries: ${countriesUpdated} countries updated with ${airaloPlans.length} total plans`
      );
      
      // Reload countries
      await loadCountries();
      
    } catch (error) {
      console.error('❌ Error syncing all countries:', error);
      toast.error(`Error syncing all countries: ${error.message}`);
    } finally {
      setSyncingPrices(false);
    }
  };

  // Delete country
  const deleteCountry = async (countryCode, countryName) => {
    if (!window.confirm(`Are you sure you want to delete "${countryName}" (${countryCode})? This will also delete all associated plans.`)) {
      return;
    }

    try {
      setLoading(true);
      
      // Delete all plans for this country
      const plansQuery = query(
        collection(db, 'dataplans'),
        where('country_codes', 'array-contains', countryCode)
      );
      const plansSnapshot = await getDocs(plansQuery);
      
      const deletePromises = plansSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      // Delete country
      await deleteDoc(doc(db, 'countries', countryCode));
      
      toast.success(`Deleted "${countryName}" and ${plansSnapshot.docs.length} associated plans`);
      await loadCountries();
      
    } catch (error) {
      console.error('❌ Error deleting country:', error);
      toast.error(`Error deleting country: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Open tariff management for a country
  const openTariffManagement = (country) => {
    setSelectedCountryForTariffs(country);
    setShowTariffManagement(true);
  };

  // Close tariff management
  const closeTariffManagement = () => {
    setShowTariffManagement(false);
    setSelectedCountryForTariffs(null);
    // Reload countries to show updated plan counts
    loadCountries();
  };

  // If showing tariff management, render that instead
  if (showTariffManagement && selectedCountryForTariffs) {
    return (
      <TariffManagement
        countryCode={selectedCountryForTariffs.code}
        countryName={selectedCountryForTariffs.name}
        onBack={closeTariffManagement}
        onSyncPrices={syncCountryPricesFromAiralo}
      />
    );
  }

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header with Actions */}
      <div className="bg-white rounded-xl border-4 border-gray-200/40 shadow-lg p-6">
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Country Management</h2>
            <p className="text-gray-600 mt-1 text-sm">Manage countries, translations, photos, and pricing</p>
          </div>
          
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Country
            </button>
            
            <button
              onClick={syncAllCountriesFromAiralo}
              disabled={syncingPrices}
              className="btn-secondary flex items-center gap-2 text-sm"
              title="Fetch prices from Airalo and update all countries"
            >
              {syncingPrices ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Sync All Prices</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border-4 border-gray-200/40 shadow-lg p-4">
        <div className="relative max-w-md">
          <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
          <input
            type="text"
            placeholder={t('countryManagement.searchCountries', 'Search countries...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-full border-4 border-gray-200/40 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}
          />
        </div>
      </div>

      {/* Countries Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCountries.map((country) => (
          <motion.div
            key={country.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border-4 border-gray-200/40 shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
          >
            {/* Country Header */}
            <div className="p-4">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="text-2xl">
                    {country.photo ? (
                      <img 
                        src={country.photo} 
                        alt={country.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      getFlagEmoji(country.code)
                    )}
                  </div>
                  <div>
                    <h3 className={`text-base font-semibold text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {country.translations?.[currentLanguage] || country.name}
                    </h3>
                    <p className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {country.code}
                    </p>
                  </div>
                </div>
                
                <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={() => {
                      setEditingCountry(country);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                    title="Edit country"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteCountry(country.code, country.name)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                    title="Delete country"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Country Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="text-xl font-bold text-cool-black">
                    {country.planCount || 0}
                  </div>
                  <div className="text-xs text-cool-black">Plans</div>
                </div>
                <div className={`text-center ${isRTL ? 'text-right' : 'text-left'}`}>
                  <div className="text-xl font-bold text-cool-black">
                    ${country.minPrice?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-cool-black">Min Price</div>
                </div>
              </div>

              {/* Last Sync Info */}
              {country.lastPriceSync && (
                <div className={`text-xs text-cool-black mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  Last synced: {new Date(country.lastPriceSync.toDate()).toLocaleDateString()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => syncCountryPricesFromAiralo(country.code)}
                  disabled={syncingCountry === country.code}
                  className="flex-1 px-2 py-1.5 bg-tufts-blue text-white rounded-full  flex items-center justify-center gap-2 "
                >
                  {syncingCountry === country.code ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Sync
                </button>
                
                <button
                  onClick={() => openTariffManagement(country)}
                  className="flex-1 px-2 py-1.5 bg-cool-black text-white rounded-full  flex items-center justify-center gap-2 "
                >
                  <DollarSign className="w-4 h-4" />
                  Manage
                </button>
                
                <button
                  onClick={() => setExpandedCountry(
                    expandedCountry === country.code ? null : country.code
                  )}
                  className="px-2 py-1.5 bg-gray-100 text-gray-700 rounded-full  flex items-center gap-1 text-sm"
                >
                  {expandedCountry === country.code ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Details
                </button>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedCountry === country.code && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-gray-200/40"
                  >
                    <div className="space-y-3">
                      {/* Translations */}
                      <div>
                        <h4 className="text-base font-medium text-gray-700 mb-2">Translations</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(country.translations || {}).map(([lang, translation]) => (
                            <div key={lang} className="flex justify-between">
                              <span className="text-gray-500 uppercase">{lang}:</span>
                              <span className="text-gray-900">{translation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Source Info */}
                      <div>
                        <h4 className="text-base font-medium text-gray-700 mb-2">Source</h4>
                        <div className="text-xs text-gray-600">
                          {country.source || 'Manual'}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredCountries.length === 0 && !loading && (
        <div className="text-center py-12">
          <Globe className="w-10 h-10 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No countries found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first country'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary text-sm"
          >
            Add Country
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">Loading countries...</p>
        </div>
      )}

      {/* Edit Country Modal */}
      <CountryEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCountry(null);
        }}
        country={editingCountry}
        onSave={loadCountries}
      />

      {/* Create Country Modal */}
      <CountryEditModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        country={null}
        onSave={loadCountries}
      />
    </div>
  );
};

export default CountryManagement;
