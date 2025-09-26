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
  Search
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

const PlansManagement = () => {
  const { currentUser } = useAuth();
  const functions = getFunctions();

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
      toast.error(`Error loading plans: ${error.message}`);
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
      
      toast.success(`Price updated to $${newPrice}!`);
      await loadAllPlans();
    } catch (error) {
      console.error('❌ Error updating plan price:', error);
      toast.error(`Error updating price: ${error.message}`);
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

  const deletePlan = async (planId, planName) => {
    if (!window.confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'dataplans', planId));
      toast.success(`Plan "${planName}" deleted successfully!`);
      await loadAllPlans();
    } catch (error) {
      console.error('❌ Error deleting plan:', error);
      toast.error(`Error deleting plan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Search Bar and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex gap-4 items-center">
            <span className="text-sm text-gray-600">
              Countries: {availableCountries.length}
            </span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Countries</option>
              {availableCountries.length > 0 ? (
                availableCountries.map(country => (
                  <option key={country} value={country}>
                    {getFlagEmoji(country)} {country}
                  </option>
                ))
              ) : (
                <option value="" disabled>No countries found</option>
              )}
            </select>
            {selectedCountry && (
              <button
                onClick={() => setSelectedCountry('')}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear Filter
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
                      <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                        {plan.slug || 'No slug'}
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

    </div>
  );
};

export default PlansManagement;
