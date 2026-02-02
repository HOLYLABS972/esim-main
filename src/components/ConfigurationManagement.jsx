'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc, writeBatch, addDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getRemoteConfig, fetchAndActivate, getValue } from 'firebase/remote-config';
import app, { db } from '../firebase/config';
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
  Save,
  CreditCard,
  Brain,
  Bell,
  Clock,
  Play
} from 'lucide-react';
import toast from 'react-hot-toast';

const ConfigurationManagement = () => {
  const { currentUser } = useAuth();
  const functions = getFunctions();

  // Remote Config instance
  const [remoteConfig, setRemoteConfig] = useState(null);
  const [remoteConfigLoading, setRemoteConfigLoading] = useState(false);

  // State Management
  const [currentEnvironment, setCurrentEnvironment] = useState('production');
  const [loading, setLoading] = useState(false);

  // Price Configuration
  const [markupPercentage, setMarkupPercentage] = useState(17);
  const [regularDiscountPercentage, setRegularDiscountPercentage] = useState(10);
  const [transactionCommissionPercentage, setTransactionCommissionPercentage] = useState(5);

  // Stripe Configuration
  const [stripeConfig, setStripeConfig] = useState({
    livePublishableKey: ''
  });
  const [savingStripe, setSavingStripe] = useState(false);

  // Version Configuration
  const [versionConfig, setVersionConfig] = useState({
    min_required_version: '1.0.0'
  });
  const [savingVersion, setSavingVersion] = useState(false);

  // OpenRouter Configuration
  const [openRouterConfig, setOpenRouterConfig] = useState({
    api_key: '',
    model: 'openai/gpt-3.5-turbo',
    max_tokens: 150,
    temperature: 0.7,
    site_name: 'RoamJet',
    site_url: 'https://esim.roamjet.net'
  });
  const [savingOpenRouter, setSavingOpenRouter] = useState(false);

  // Telegram Configuration
  const [telegramConfig, setTelegramConfig] = useState({
    bot_token: '',
    admin_chat_id: ''
  });
  const [savingTelegram, setSavingTelegram] = useState(false);

  // Unsplash Configuration
  const [unsplashConfig, setUnsplashConfig] = useState({
    access_key: ''
  });
  const [savingUnsplash, setSavingUnsplash] = useState(false);

  // Auto-Sync Configuration
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [savingAutoSync, setSavingAutoSync] = useState(false);

  // Missing state variables
  const [isDeleting, setIsDeleting] = useState(false);
  const [airaloClientId, setAiraloClientId] = useState('');
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('');
  const [plansLoading, setPlansLoading] = useState(false);

  // Initialize Remote Config (client-side only, use app from config)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const initRemoteConfig = async () => {
      try {
        const rc = getRemoteConfig(app);
        rc.settings = {
          fetchTimeoutMillis: 60000,
          minimumFetchIntervalMillis: 3600000, // 1 hour
        };
        setRemoteConfig(rc);
        await loadRemoteConfigValues(rc);
      } catch (error) {
        console.error('Error initializing Remote Config:', error);
        toast.error('Failed to initialize Remote Config');
      }
    };

    initRemoteConfig();
  }, []);

  // Load configuration on component mount
  useEffect(() => {
    if (currentUser) {
      loadSavedConfig();
      loadMarkupPercentage();
      loadVersionConfig();
      loadStripeConfig();
      loadOpenRouterConfig();
      loadTelegramConfig();
      loadAutoSyncConfig();
    }
  }, [currentUser]);

  // Load Remote Config values
  const loadRemoteConfigValues = async (rc) => {
    try {
      setRemoteConfigLoading(true);
      await fetchAndActivate(rc);

      // Load Airalo Client ID from Remote Config
      const airaloClientId = getValue(rc, 'airalo_client_id').asString();
      if (airaloClientId) {
        setAiraloClientId(airaloClientId);
        console.log('✅ Airalo Client ID loaded from Remote Config');
      }

      // Load Stripe config from Remote Config
      const stripeLiveKey = getValue(rc, 'stripe_live_publishable_key').asString();
      if (stripeLiveKey) {
        setStripeConfig(prev => ({ ...prev, livePublishableKey: stripeLiveKey }));
        console.log('✅ Stripe Live Key loaded from Remote Config');
      }

      // Load OpenRouter config from Remote Config
      const openRouterApiKey = getValue(rc, 'openrouter_api_key').asString();
      if (openRouterApiKey) {
        setOpenRouterConfig(prev => ({ ...prev, api_key: openRouterApiKey }));
        console.log('✅ OpenRouter API Key loaded from Remote Config');
      }

      // Load Telegram config from Remote Config
      const telegramBotToken = getValue(rc, 'telegram_bot_token').asString();
      const telegramAdminChatId = getValue(rc, 'telegram_admin_chat_id').asString();
      if (telegramBotToken || telegramAdminChatId) {
        setTelegramConfig(prev => ({
          ...prev,
          bot_token: telegramBotToken,
          admin_chat_id: telegramAdminChatId
        }));
        console.log('✅ Telegram config loaded from Remote Config');
      }

      // Load Version config from Remote Config
      const minRequiredVersion = getValue(rc, 'min_required_version').asString();
      if (minRequiredVersion) {
        setVersionConfig(prev => ({ ...prev, min_required_version: minRequiredVersion }));
        console.log('✅ Version config loaded from Remote Config');
      }

      // Load Pricing config from Remote Config
      const referralDiscount = getValue(rc, 'referral_discount_percentage').asNumber();
      const regularDiscount = getValue(rc, 'regular_discount_percentage').asNumber();
      const transactionCommission = getValue(rc, 'transaction_commission_percentage').asNumber();

      if (referralDiscount > 0) setMarkupPercentage(referralDiscount);
      if (regularDiscount > 0) setRegularDiscountPercentage(regularDiscount);
      if (transactionCommission > 0) setTransactionCommissionPercentage(transactionCommission);

      console.log('✅ Pricing config loaded from Remote Config');

    } catch (error) {
      console.error('Error loading Remote Config values:', error);
      toast.error('Failed to load Remote Config values');
    } finally {
      setRemoteConfigLoading(false);
    }
  };

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
      setCountriesLoading(true);
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
      setCountriesLoading(false);
    }
  };

  const syncAllDataFromAiralo = async () => {
    try {
      setPlansLoading(true);
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
      setPlansLoading(false);
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

  // Stripe Configuration Functions
  const loadStripeConfig = async () => {
    try {
      const stripeConfigRef = doc(db, 'config', 'stripe');
      const stripeConfigDoc = await getDoc(stripeConfigRef);

      if (stripeConfigDoc.exists()) {
        const data = stripeConfigDoc.data();
        setStripeConfig(prev => ({
          ...prev,
          livePublishableKey: data.livePublishableKey || data.live_publishable_key || ''
        }));
        console.log('✅ Loaded Stripe configuration from Firebase');
      } else {
        console.log('📝 No Stripe configuration found in Firebase');
      }
    } catch (error) {
      console.error('❌ Error loading Stripe configuration:', error);
      toast.error(`Error loading Stripe configuration: ${error.message}`);
    }
  };

  const saveStripeConfig = async () => {
    try {
      setSavingStripe(true);

      // Validate key
      if (!stripeConfig.livePublishableKey.trim()) {
        toast.error('Please enter the live publishable key');
        return;
      }

      if (!stripeConfig.livePublishableKey.startsWith('pk_live_')) {
        toast.error('Live publishable key must start with pk_live_');
        return;
      }

      const configData = {
        livePublishableKey: stripeConfig.livePublishableKey.trim(),
        updated_at: serverTimestamp(),
        updated_by: currentUser?.uid || 'admin'
      };

      await setDoc(doc(db, 'config', 'stripe'), configData, { merge: true });

      toast.success('Stripe configuration saved successfully!');
      console.log('✅ Stripe configuration saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving Stripe configuration:', error);
      toast.error(`Error saving Stripe configuration: ${error.message}`);
    } finally {
      setSavingStripe(false);
    }
  };

  const handleStripeConfigChange = (field, value) => {
    setStripeConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-Sync Configuration Functions
  const loadAutoSyncConfig = async () => {
    try {
      const autoSyncConfigRef = doc(db, 'config', 'auto_sync');
      const autoSyncConfigDoc = await getDoc(autoSyncConfigRef);

      if (autoSyncConfigDoc.exists()) {
        const data = autoSyncConfigDoc.data();
        setAutoSyncEnabled(data.enabled === true);
        console.log('✅ Loaded auto-sync configuration from Firebase:', data.enabled);
      } else {
        console.log('📝 No auto-sync configuration found in Firebase, defaulting to disabled');
        setAutoSyncEnabled(false);
      }
    } catch (error) {
      console.error('❌ Error loading auto-sync configuration:', error);
      toast.error(`Error loading auto-sync configuration: ${error.message}`);
    }
  };

  const saveAutoSyncConfig = async () => {
    try {
      setSavingAutoSync(true);

      const configData = {
        enabled: autoSyncEnabled,
        updated_at: serverTimestamp(),
        updated_by: currentUser?.uid || 'admin'
      };

      await setDoc(doc(db, 'config', 'auto_sync'), configData, { merge: true });

      toast.success(`Auto-sync ${autoSyncEnabled ? 'enabled' : 'disabled'} successfully!`);
      console.log(`✅ Auto-sync configuration saved: ${autoSyncEnabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('❌ Error saving auto-sync configuration:', error);
      toast.error(`Error saving auto-sync configuration: ${error.message}`);
    } finally {
      setSavingAutoSync(false);
    }
  };

  // OpenRouter Configuration Functions
  const loadOpenRouterConfig = async () => {
    try {
      const openRouterConfigRef = doc(db, 'config', 'openrouter');
      const openRouterConfigDoc = await getDoc(openRouterConfigRef);

      if (openRouterConfigDoc.exists()) {
        const data = openRouterConfigDoc.data();
        setOpenRouterConfig(prev => ({
          ...prev,
          api_key: data.api_key || '',
          model: data.model || 'openai/gpt-3.5-turbo',
          max_tokens: data.max_tokens || 150,
          temperature: data.temperature || 0.7,
          site_name: data.site_name || 'RoamJet',
          site_url: data.site_url || 'https://esim.roamjet.net'
        }));
        console.log('✅ Loaded OpenRouter configuration from Firebase');
      } else {
        console.log('📝 No OpenRouter configuration found in Firebase');
      }
    } catch (error) {
      console.error('❌ Error loading OpenRouter configuration:', error);
      toast.error(`Error loading OpenRouter configuration: ${error.message}`);
    }
  };

  const saveOpenRouterConfig = async () => {
    try {
      setSavingOpenRouter(true);

      // Validate API key
      if (!openRouterConfig.api_key.trim()) {
        toast.error('Please enter your OpenRouter API key');
        return;
      }

      if (!openRouterConfig.api_key.startsWith('sk-or-v1-')) {
        toast.error('OpenRouter API key should start with sk-or-v1-');
        return;
      }

      const configData = {
        api_key: openRouterConfig.api_key.trim(),
        model: openRouterConfig.model,
        max_tokens: parseInt(openRouterConfig.max_tokens) || 150,
        temperature: parseFloat(openRouterConfig.temperature) || 0.7,
        site_name: openRouterConfig.site_name || 'RoamJet',
        site_url: openRouterConfig.site_url || 'https://esim.roamjet.net',
        updated_at: serverTimestamp(),
        updated_by: currentUser?.uid || 'admin'
      };

      await setDoc(doc(db, 'config', 'openrouter'), configData, { merge: true });

      toast.success('OpenRouter configuration saved successfully!');
      console.log('✅ OpenRouter configuration saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving OpenRouter configuration:', error);
      toast.error(`Error saving OpenRouter configuration: ${error.message}`);
    } finally {
      setSavingOpenRouter(false);
    }
  };

  const handleOpenRouterConfigChange = (field, value) => {
    setOpenRouterConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Telegram Configuration Functions
  const loadTelegramConfig = async () => {
    try {
      const telegramConfigRef = doc(db, 'config', 'telegram');
      const telegramConfigDoc = await getDoc(telegramConfigRef);

      if (telegramConfigDoc.exists()) {
        const data = telegramConfigDoc.data();
        setTelegramConfig({
          bot_token: data.bot_token || '',
          admin_chat_id: data.admin_chat_id || ''
        });
        console.log('✅ Loaded Telegram configuration from Firebase');
      } else {
        console.log('📝 No Telegram configuration found in Firebase');
      }
    } catch (error) {
      console.error('❌ Error loading Telegram configuration:', error);
      toast.error(`Error loading Telegram configuration: ${error.message}`);
    }
  };

  const saveTelegramConfig = async () => {
    try {
      setSavingTelegram(true);

      // Validate bot token
      if (!telegramConfig.bot_token.trim()) {
        toast.error('Please enter your Telegram bot token');
        return;
      }

      if (!telegramConfig.admin_chat_id.trim()) {
        toast.error('Please enter your Telegram admin chat ID');
        return;
      }

      const configData = {
        bot_token: telegramConfig.bot_token.trim(),
        admin_chat_id: telegramConfig.admin_chat_id.trim(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'config', 'telegram'), configData, { merge: true });

      toast.success('Telegram configuration saved successfully!');
      console.log('✅ Telegram configuration saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving Telegram configuration:', error);
      toast.error(`Error saving Telegram configuration: ${error.message}`);
    } finally {
      setSavingTelegram(false);
    }
  };

  const handleTelegramConfigChange = (field, value) => {
    setTelegramConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Unsplash Configuration Functions
  const loadUnsplashConfig = async () => {
    try {
      const unsplashConfigRef = doc(db, 'config', 'unsplash');
      const unsplashConfigDoc = await getDoc(unsplashConfigRef);

      if (unsplashConfigDoc.exists()) {
        const data = unsplashConfigDoc.data();
        setUnsplashConfig({
          access_key: data.access_key || ''
        });
        console.log('✅ Loaded Unsplash configuration from Firebase');
      } else {
        console.log('📝 No Unsplash configuration found in Firebase');
      }
    } catch (error) {
      console.error('❌ Error loading Unsplash configuration:', error);
      toast.error(`Error loading Unsplash configuration: ${error.message}`);
    }
  };

  const saveUnsplashConfig = async () => {
    try {
      setSavingUnsplash(true);

      // Validate access key (optional)
      if (unsplashConfig.access_key.trim() && !unsplashConfig.access_key.startsWith('_')) {
        toast.error('Unsplash access key should start with an underscore (_)');
        return;
      }

      const configData = {
        access_key: unsplashConfig.access_key.trim(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'config', 'unsplash'), configData, { merge: true });

      toast.success('Unsplash configuration saved successfully!');
      console.log('✅ Unsplash configuration saved to Firebase');
    } catch (error) {
      console.error('❌ Error saving Unsplash configuration:', error);
      toast.error(`Error saving Unsplash configuration: ${error.message}`);
    } finally {
      setSavingUnsplash(false);
    }
  };

  const handleUnsplashConfigChange = (field, value) => {
    setUnsplashConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Refresh Remote Config
  const refreshRemoteConfig = async () => {
    if (remoteConfig) {
      try {
        setRemoteConfigLoading(true);
        await loadRemoteConfigValues(remoteConfig);
        toast.success('Remote Config refreshed!');
      } catch (error) {
        console.error('Error refreshing Remote Config:', error);
        toast.error('Failed to refresh Remote Config');
      } finally {
        setRemoteConfigLoading(false);
      }
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Data Sync Info */}
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
          <div className="text-sm text-gray-600">
            <p className="mb-2">📝 <strong>Note:</strong> Sync functionality has been moved to individual tabs:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Sync Countries → Countries Management tab</li>
              <li>Sync Plans → Plans Management tab</li>
            </ul>
          </div>
        </div>


        {/* Stripe Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="text-green-600 mr-2" />
            Stripe Configuration
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Live Publishable Key
              </label>
              <input
                type="text"
                value={stripeConfig.livePublishableKey}
                onChange={(e) => handleStripeConfigChange('livePublishableKey', e.target.value)}
                placeholder="pk_live_..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your Stripe live publishable key (starts with pk_live_)
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={saveStripeConfig}
                disabled={savingStripe}
                className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
              >
                {savingStripe ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savingStripe ? 'Saving...' : 'Save Stripe Key'}
              </button>
            </div>
          </div>
        </div>

        {/* OpenRouter AI & Automated Notifications */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Brain className="text-purple-600 mr-2" />
            AI Notifications (OpenRouter)
          </h2>

          <div className="space-y-4">
            {/* API Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                OpenRouter API Key
              </label>
              <input
                type="text"
                value={openRouterConfig.api_key}
                onChange={(e) => handleOpenRouterConfigChange('api_key', e.target.value)}
                placeholder="sk-or-v1-..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get your free API key at{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline font-medium"
                >
                  openrouter.ai/keys
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveOpenRouterConfig}
                disabled={savingOpenRouter || !openRouterConfig.api_key.trim()}
                className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
              >
                {savingOpenRouter ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savingOpenRouter ? 'Saving...' : 'Save Configuration'}
              </button>

            </div>


            {/* Quick Setup Instructions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                ⚙️ Cron Setup
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                <strong>Vercel:</strong> Auto-enabled via vercel.json (deploy to activate)
              </p>
              <p className="text-xs text-gray-600 mb-2">
                <strong>Other platforms:</strong> Schedule daily POST to:
              </p>
              <code className="block bg-white p-2 rounded text-xs break-all border">
                https://admin.roamjet.net/api/cron/daily-notification
              </code>
              <p className="text-xs text-gray-500 mt-2">
                💡 <strong>Tip:</strong> You can test the campaign manually from the Notifications tab
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Use <a href="https://cron-job.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">cron-job.org</a> (free) or GitHub Actions
              </p>
            </div>
          </div>
        </div>

        {/* Telegram Bot Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Bell className="text-blue-500 mr-2" />
            Telegram Bot Configuration
          </h2>

          <div className="space-y-4">
            {/* Bot Token Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Telegram Bot Token
              </label>
              <input
                type="password"
                value={telegramConfig.bot_token}
                onChange={(e) => handleTelegramConfigChange('bot_token', e.target.value)}
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Create a bot via{' '}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  @BotFather
                </a>
                {' '}on Telegram and get your bot token
              </p>
            </div>

            {/* Admin Chat ID Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Chat ID
              </label>
              <input
                type="text"
                value={telegramConfig.admin_chat_id}
                onChange={(e) => handleTelegramConfigChange('admin_chat_id', e.target.value)}
                placeholder="123456789 or -987654321"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Telegram user ID or group chat ID. Get it from{' '}
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  @userinfobot
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveTelegramConfig}
                disabled={savingTelegram || !telegramConfig.bot_token.trim() || !telegramConfig.admin_chat_id.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
              >
                {savingTelegram ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savingTelegram ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            {/* Quick Setup Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                📱 How to Set Up:
              </h3>
              <ol className="text-xs text-gray-600 space-y-2 list-decimal list-inside">
                <li>Open Telegram and search for <strong>@BotFather</strong></li>
                <li>Send <code className="bg-white px-1 rounded">/newbot</code> to create a new bot</li>
                <li>Follow the instructions and copy your bot token</li>
                <li>Search for <strong>@userinfobot</strong> and send any message</li>
                <li>Copy your user ID or add bot to a group and get group chat ID</li>
                <li>Paste both values above and save configuration</li>
              </ol>
              <p className="text-xs text-gray-500 mt-3">
                💡 <strong>Tip:</strong> The bot will send you notifications for blog post approvals
              </p>
            </div>
          </div>
        </div>

        {/* Unsplash API Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Globe className="text-orange-500 mr-2" />
            Unsplash API Configuration
          </h2>

          <div className="space-y-4">
            {/* Access Key Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unsplash Access Key (Optional)
              </label>
              <input
                type="password"
                value={unsplashConfig.access_key}
                onChange={(e) => handleUnsplashConfigChange('access_key', e.target.value)}
                placeholder="_your-unsplash-access-key..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get a free API key at{' '}
                <a
                  href="https://unsplash.com/developers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline font-medium"
                >
                  unsplash.com/developers
                </a>
                {' '}for better image quality
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveUnsplashConfig}
                disabled={savingUnsplash}
                className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
              >
                {savingUnsplash ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savingUnsplash ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>

            {/* Quick Setup Instructions */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                🖼️ Image Generation:
              </h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
                <li><strong>With API key:</strong> High-quality, relevant images from Unsplash</li>
                <li><strong>Without API key:</strong> Curated fallback images (still works!)</li>
                <li>API key is optional but recommended for better image variety</li>
                <li>Free tier: 50 requests/hour, 5,000/month</li>
              </ul>
              <p className="text-xs text-gray-500 mt-3">
                💡 <strong>Tip:</strong> Blog posts will use fallback images if API key is not provided
              </p>
            </div>
          </div>
        </div>

        {/* Auto-Sync Configuration */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <RefreshCw className="text-green-500 mr-2" />
            Automatic Plans Sync
          </h2>

          <div className="space-y-4">
            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Daily Auto-Sync
                </h3>
                <p className="text-sm text-gray-600">
                  Automatically sync plans from Airalo every day at 2 AM UTC via Vercel Cron
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            {/* Status Info */}
            <div className={`border rounded-lg p-4 ${autoSyncEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-start">
                {autoSyncEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-gray-400 mr-2 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`text-sm font-medium ${autoSyncEnabled ? 'text-green-800' : 'text-gray-600'}`}>
                    {autoSyncEnabled ? 'Auto-sync is enabled' : 'Auto-sync is disabled'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {autoSyncEnabled
                      ? 'Plans will be automatically synced daily at 2 AM UTC. You can still manually sync anytime.'
                      : 'Enable auto-sync to automatically keep your plans up to date every day.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveAutoSyncConfig}
                disabled={savingAutoSync}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors text-sm"
              >
                {savingAutoSync ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {savingAutoSync ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                ⚙️ How It Works:
              </h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc list-inside">
                <li>When enabled, Vercel Cron will call the sync endpoint daily at 2 AM UTC</li>
                <li>The sync will only run if this toggle is enabled</li>
                <li>You can still manually sync plans anytime from the Plans tab</li>
                <li>Sync logs will be available in Vercel deployment logs</li>
                <li>Cron schedule: <code className="bg-white px-1 rounded">0 2 * * *</code> (daily at 2 AM UTC)</li>
              </ul>
            </div>

            {/* Telegram Notification Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">
                📱 Telegram Notifications:
              </h3>
              <p className="text-xs text-gray-600 mb-2">
                To receive Telegram notifications when sync completes, add these environment variables in Vercel:
              </p>
              <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside mb-2">
                <li><code className="bg-white px-1 rounded">TELEGRAM_BOT_TOKEN</code> - Your Telegram bot token</li>
                <li><code className="bg-white px-1 rounded">TELEGRAM_CHAT_ID</code> - Your Telegram chat ID</li>
              </ul>
              <p className="text-xs text-gray-500">
                💡 Get your bot token from <strong>@BotFather</strong> and chat ID from <strong>@userinfobot</strong> on Telegram
              </p>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ If not configured, sync will still work but no notifications will be sent
              </p>
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
              <br />
              <strong className="text-purple-600">This also affects the "Spent" calculation in the Orders dashboard:</strong> Spent = Revenue × (100 - Commission%) / 100
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
                <br />
                <span className="text-purple-600">Spent amount: ${(10 * (100 - transactionCommissionPercentage) / 100).toFixed(2)}</span>
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
