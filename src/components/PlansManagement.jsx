'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, writeBatch, addDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useI18n } from '../contexts/I18nContext';
import { getLanguageDirection, detectLanguageFromPath } from '../utils/languageUtils';
import { usePathname } from 'next/navigation';

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
  const { t, locale } = useI18n();
  const pathname = usePathname();
  const functions = getFunctions();
  
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
  const [allPlans, setAllPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [availableCountries, setAvailableCountries] = useState([]);
  
  // Price editing state
  const [editingPrices, setEditingPrices] = useState({});
  const [pendingPriceChanges, setPendingPriceChanges] = useState({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [plansPerPage] = useState(15);

  // Load plans on component mount
  useEffect(() => {
    if (currentUser) {
      loadAllPlans();
    }
  }, [currentUser]);

  // Filter plans based on search and country
  useEffect(() => {
    let filtered = [...allPlans];

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(plan => 
        plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.operator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (plan.country_codes || plan.country_ids || []).some(code => 
          code.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filter by country
    if (selectedCountry) {
      filtered = filtered.filter(plan => 
        (plan.country_codes || []).includes(selectedCountry) ||
        (plan.country_ids || []).includes(selectedCountry)
      );
    }

    setFilteredPlans(filtered);
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [allPlans, searchTerm, selectedCountry]);

  // Plans Management Functions
  const loadAllPlans = async () => {
    try {
      setLoading(true);
      const plansSnapshot = await getDocs(collection(db, 'dataplans'));
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAllPlans(plansData);
      console.log('✅ Loaded', plansData.length, 'plans from Firestore');

      // Extract unique countries from plans
      const countries = new Set();
      plansData.forEach(plan => {
        (plan.country_codes || []).forEach(code => countries.add(code));
        (plan.country_ids || []).forEach(code => countries.add(code));
      });
      
      const sortedCountries = Array.from(countries).sort();
      console.log('🔍 Extracted countries from plans:', sortedCountries);
      console.log('🔍 Sample plan data:', plansData.slice(0, 2).map(p => ({
        id: p.id,
        name: p.name,
        country_codes: p.country_codes,
        country_ids: p.country_ids
      })));
      setAvailableCountries(sortedCountries);
    } catch (error) {
      console.error('❌ Error loading plans:', error);
      toast.error(t('plansManagement.errorLoadingPlans', 'Error loading plans: {{error}}', { error: error.message }));
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
      
      toast.success(t('plansManagement.priceUpdated', 'Price updated to ${{price}}!', { price: newPrice }));
      await loadAllPlans();
    } catch (error) {
      console.error('❌ Error updating plan price:', error);
      toast.error(t('plansManagement.errorUpdatingPrice', 'Error updating price: {{error}}', { error: error.message }));
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

  const stopEditingPrice = (planId) => {
    setEditingPrices(prev => ({ ...prev, [planId]: false }));
  };

  // Pagination calculations
  const indexOfLastPlan = currentPage * plansPerPage;
  const indexOfFirstPlan = indexOfLastPlan - plansPerPage;
  const currentPlans = filteredPlans.slice(indexOfFirstPlan, indexOfLastPlan);
  const totalPages = Math.ceil(filteredPlans.length / plansPerPage);

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

  const deletePlan = async (planId, planName) => {
    if (!window.confirm(t('plansManagement.confirmDelete', 'Are you sure you want to delete "{{planName}}"? This action cannot be undone.', { planName }))) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'dataplans', planId));
      toast.success(t('plansManagement.planDeleted', 'Plan "{{planName}}" deleted successfully!', { planName }));
      await loadAllPlans();
    } catch (error) {
      console.error('❌ Error deleting plan:', error);
      toast.error(t('plansManagement.errorDeletingPlan', 'Error deleting plan: {{error}}', { error: error.message }));
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Bar and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5`} />
            <input
              type="text"
              placeholder={t('plansManagement.searchPlans', 'Search plans...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black`}
              style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}
            />
          </div>
          <div className={`flex gap-4 items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <span className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('plansManagement.countries', 'Countries')}: {availableCountries.length}
            </span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              style={{ textAlign: isRTL ? 'right' : 'left', direction: isRTL ? 'rtl' : 'ltr' }}
            >
              <option value="">{t('plansManagement.allCountries', 'All Countries')}</option>
              {availableCountries.length > 0 ? (
                availableCountries.map(country => (
                  <option key={country} value={country}>
                    {getFlagEmoji(country)} {country}
                  </option>
                ))
              ) : (
                <option value="" disabled>{t('plansManagement.noCountriesFound', 'No countries found')}</option>
              )}
            </select>
            {selectedCountry && (
              <button
                onClick={() => setSelectedCountry('')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('plansManagement.clearFilter', 'Clear Filter')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('plansManagement.plan', 'Plan')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('plansManagement.slug', 'Slug')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('plansManagement.dataDuration', 'Data & Duration')}
                </th>
                <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                  {t('plansManagement.countries', 'Countries')}
                </th>
                          <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                            {t('plansManagement.price', 'Price')}
                          </th>
                          <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider`}>
                            {t('plansManagement.actions', 'Actions')}
                          </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentPlans.length > 0 ? (
                currentPlans.map((plan) => (
                  <tr key={plan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                        <div className={`${isRTL ? 'mr-4' : 'ml-4'}`}>
                          <div className={`text-sm font-medium text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {plan.name || t('plansManagement.unnamedPlan', 'Unnamed Plan')}
                          </div>
                          {plan.operator && (
                            <div className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                              {plan.operator}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded ${isRTL ? 'text-right' : 'text-left'}`}>
                        {plan.slug || t('plansManagement.noSlug', 'No slug')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {(plan.capacity === -1 || plan.capacity === 0 || plan.capacity === 'Unlimited') ? t('plansManagement.unlimited', 'Unlimited') : `${plan.capacity} GB`}
                      </div>
                      <div className={`text-sm text-gray-500 ${isRTL ? 'text-right' : 'text-left'}`}>
                        {plan.period ? t('plansManagement.days', '{{days}} days', { days: plan.period }) : t('plansManagement.notAvailable', 'N/A')}
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
                                  {editingPrices[plan.id] && (
                                    <div className="flex space-x-1">
                                      <button
                                        onClick={() => savePriceChange(plan.id)}
                                        disabled={loading}
                                        className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                                      >
                                        {t('plansManagement.save', 'Save')}
                                      </button>
                                      <button
                                        onClick={() => cancelPriceChange(plan.id)}
                                        disabled={loading}
                                        className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                                      >
                                        {t('plansManagement.cancel', 'Cancel')}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => deletePlan(plan.id, plan.name || 'Unnamed Plan')}
                                  disabled={loading}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete plan"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Smartphone className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">{t('plansManagement.noPlansFound', 'No plans found')}</p>
                      <p className="text-sm">{t('plansManagement.tryAdjusting', 'Try adjusting your search or filters')}</p>
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
              {t('plansManagement.previous', 'Previous')}
            </button>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('plansManagement.next', 'Next')}
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className={`text-sm text-gray-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('plansManagement.showing', 'Showing {{start}} to {{end}} of {{total}} results', {
                  start: indexOfFirstPlan + 1,
                  end: Math.min(indexOfLastPlan, filteredPlans.length),
                  total: filteredPlans.length
                })}
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
