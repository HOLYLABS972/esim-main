'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, writeBatch, addDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Globe, 
  RefreshCw, 
  Trash2, 
  Download,
  Database,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  Info,
  Save
} from 'lucide-react';
import toast from 'react-hot-toast';

const ConfigurationManagement = () => {
  const { currentUser } = useAuth();
  const functions = getFunctions();

  // State Management
  const [currentEnvironment, setCurrentEnvironment] = useState('production');
  const [airaloClientId, setAiraloClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Ready to sync data from Airalo API');
  
  // Price Configuration
  const [markupPercentage, setMarkupPercentage] = useState(17);
  const [regularDiscountPercentage, setRegularDiscountPercentage] = useState(10);
  const [transactionCommissionPercentage, setTransactionCommissionPercentage] = useState(5);

  // Version Configuration
  const [versionConfig, setVersionConfig] = useState({
    min_required_version: '1.0.0'
  });
  const [savingVersion, setSavingVersion] = useState(false);

  // Load configuration on component mount
  useEffect(() => {
    if (currentUser) {
      loadSavedConfig();
      loadAiraloApiKey();
      loadMarkupPercentage();
      loadVersionConfig();
    }
  }, [currentUser]);

  // Configuration Functions
  const loadSavedConfig = async () => {
    try {
      const configDoc = await getDocs(collection(db, 'admin_config'));
      if (!configDoc.empty) {
        const config = configDoc.docs[0].data();
        setCurrentEnvironment(config.environment || 'production');
      }
    } catch (error) {
      console.error('Error loading config:', error);
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

  const syncCountriesFromAiralo = async () => {
    try {
      setLoading(true);
      setSyncStatus('Syncing countries from Airalo API...');

      // Call the same API as plans but with countries_only parameter
      const response = await fetch('/api/sync-airalo?countries_only=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      
      if (result.success) {
        const count = result.details?.countries_synced || 0;
        console.log(`✅ Successfully synced ${count} countries via Next.js API`);
        setSyncStatus(`Successfully synced ${count} countries from Airalo API`);
        toast.success(`Successfully synced ${count} countries from Airalo API`);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('❌ Error syncing countries from Airalo:', error);
      setSyncStatus(`Error: ${error.message}`);
      toast.error(`Error syncing countries: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const syncAllDataFromAiralo = async () => {
    try {
      setLoading(true);
      setSyncStatus('Syncing plans from Airalo API...');

      // Call the Next.js API endpoint instead of Firebase function
      const response = await fetch('/api/sync-airalo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (result.success) {
        console.log(`✅ Successfully synced plans via Next.js API`);
        toast.success(`Successfully synced plans: ${result.total_synced} items`);
        setSyncStatus(`Successfully synced ${result.total_synced} plans from Airalo API`);
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('❌ Error syncing data from Airalo:', error);
      setSyncStatus(`Error: ${error.message}`);
      toast.error(`Error syncing data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteAllCountries = async () => {
    if (!window.confirm('Are you sure you want to delete ALL countries and plans? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      
      // Delete all countries
      const countriesSnapshot = await getDocs(collection(db, 'countries'));
      const batch = writeBatch(db);
      countriesSnapshot.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      // Delete all plans
      const plansSnapshot = await getDocs(collection(db, 'dataplans'));
      const plansBatch = writeBatch(db);
      plansSnapshot.forEach(doc => plansBatch.delete(doc.ref));
      await plansBatch.commit();

      toast.success('All data has been reset successfully!');
    } catch (error) {
      console.error('❌ Error deleting all data:', error);
      toast.error(`Error resetting data: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Version Configuration Functions
  const loadVersionConfig = async () => {
    try {
      const versionDoc = await getDoc(doc(db, 'app_config', 'version'));
      
      if (versionDoc.exists()) {
        const data = versionDoc.data();
        setVersionConfig(prev => ({
          ...prev,
          ...data
        }));
        console.log('✅ Loaded version config:', data);
      } else {
        console.log('📝 No version config found, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading version config:', error);
      toast.error(`Error loading version config: ${error.message}`);
    }
  };

  const saveVersionConfig = async () => {
    try {
      setSavingVersion(true);
      
      // Validate version format
      if (!isValidVersion(versionConfig.min_required_version)) {
        toast.error('Invalid version format (use numbers like 1, 1.0, or 1.0.0)');
        return;
      }

      const configData = {
        min_required_version: versionConfig.min_required_version,
        last_updated: new Date(),
        last_updated_by: currentUser?.email || 'admin'
      };

      await setDoc(doc(db, 'app_config', 'version'), configData, { merge: true });
      
      toast.success('Version configuration saved successfully!');
      console.log('✅ Saved version config:', configData);
    } catch (error) {
      console.error('❌ Error saving version config:', error);
      toast.error(`Error saving version config: ${error.message}`);
    } finally {
      setSavingVersion(false);
    }
  };

  // Validate version format (allow simple numbers like "1" or "1.0" or "1.0.0")
  const isValidVersion = (version) => {
    const versionRegex = /^\d+(\.\d+)*$/;
    return versionRegex.test(version);
  };

  // Handle version input changes
  const handleVersionInputChange = (field, value) => {
    setVersionConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={syncCountriesFromAiralo}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
              >
                {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Globe className="w-5 h-5 mr-2" />}
                Sync Countries Only
              </button>
              
              <button
                onClick={syncAllDataFromAiralo}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center"
              >
                {loading ? <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> : <Download className="w-5 h-5 mr-2" />}
                Sync Plans Only
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

      {/* Version Management */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Smartphone className="text-blue-600 mr-2" />
          App Version Management
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Control app version requirements and update notifications for the Flutter mobile app.
        </p>
        
        <div className="max-w-md">
          {/* Minimum Required Version */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <AlertTriangle className="w-4 h-4 inline mr-1 text-red-500" />
              Minimum Required Version
            </label>
            <input
              type="text"
              value={versionConfig.min_required_version}
              onChange={(e) => handleVersionInputChange('min_required_version', e.target.value)}
              placeholder="1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Apps below this version will be blocked (format: 1, 1.0, or 1.0.0)
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={saveVersionConfig}
            disabled={savingVersion}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingVersion ? 'Saving...' : 'Save Version Configuration'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfigurationManagement;
