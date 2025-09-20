'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, writeBatch, addDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, 
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

const CountriesManagement = () => {
  const { currentUser } = useAuth();
  const functions = getFunctions();

  // State Management
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load countries on component mount
  useEffect(() => {
    if (currentUser) {
      loadCountriesFromFirestore();
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

  const deleteCountryFromFirestore = async (countryCode) => {
    if (!window.confirm(`Delete ${countryCode}? This will also delete all associated plans.`)) return;

    try {
      setLoading(true);
      // Delete country and its plans
      const countrySnapshot = await getDocs(query(collection(db, 'countries'), where('code', '==', countryCode)));
      const plansSnapshot = await getDocs(query(collection(db, 'plans'), where('country_codes', 'array-contains', countryCode)));
      
      const batch = writeBatch(db);
      countrySnapshot.forEach(doc => batch.delete(doc.ref));
      plansSnapshot.forEach(doc => batch.delete(doc.ref));
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






  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
            {filteredCountries.map((country) => (
              <div key={country.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{country.flagEmoji}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{country.name}</h3>
                      <p className="text-xs text-gray-600">{country.code}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => deleteCountryFromFirestore(country.code)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete country"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CountriesManagement;
