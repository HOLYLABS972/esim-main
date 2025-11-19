'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Globe, 
  Wifi, 
  Clock, 
  Shield, 
  Zap,
  DollarSign,
  CreditCard,
  Coins,
  Loader2,
  Battery
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { paymentService } from '../services/paymentService';
import { coinbaseService } from '../services/coinbaseService';
import toast from 'react-hot-toast';

const TopupPage = ({ iccid, countryCode: urlCountryCode }) => {
  console.log('🚀 [DEBUG] TopupPage component loaded with ICCID:', iccid, 'Country Code:', urlCountryCode);
  
  const { currentUser } = useAuth();
  const router = useRouter();
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availablePackages, setAvailablePackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [acceptedRefund, setAcceptedRefund] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [coinbaseAvailable, setCoinbaseAvailable] = useState(false);
  
  console.log('🚀 [DEBUG] Current user:', currentUser?.uid || 'Not authenticated');

  useEffect(() => {
    console.log('🚀 [DEBUG] useEffect triggered with ICCID:', iccid);
    if (iccid) {
      console.log('🚀 [DEBUG] Starting fetchOrderInfo and checkCoinbaseAvailability');
      fetchOrderInfo();
      checkCoinbaseAvailability();
    } else {
      console.log('🚀 [DEBUG] No ICCID provided');
    }
  }, [iccid]);

  // Fetch packages after order info is loaded OR if country code is in URL
  useEffect(() => {
    // Read country code directly from URL (works on reload)
    const searchParams = new URLSearchParams(window.location.search);
    const countryFromUrl = searchParams.get('country') || searchParams.get('countryCode');
    
    console.log('🚀 [DEBUG] useEffect triggered - orderInfo:', orderInfo, 'urlCountryCode:', urlCountryCode, 'countryFromUrl:', countryFromUrl);
    
    // If country code is in URL, fetch immediately. Otherwise wait for orderInfo
    if (countryFromUrl || urlCountryCode || orderInfo) {
      console.log('🚀 [DEBUG] Starting fetchTopupPackages');
      fetchTopupPackages();
    } else {
      console.log('🚀 [DEBUG] Waiting for orderInfo or country code...');
    }
  }, [orderInfo, urlCountryCode, iccid]); // Include iccid to re-fetch if it changes

  const checkCoinbaseAvailability = async () => {
    try {
      const available = await coinbaseService.initialize();
      console.log('🔍 Coinbase availability check:', available);
      setCoinbaseAvailable(available);
      
      if (!available) {
        console.log('⚠️ Coinbase credentials not found. Please configure in Firestore config/coinbase or environment variables.');
      }
    } catch (err) {
      console.error('❌ Error checking Coinbase availability:', err);
      setCoinbaseAvailable(true); // Still show button even if check fails
    }
  };

  const fetchOrderInfo = async () => {
    console.log('🚀 [DEBUG] fetchOrderInfo started');
    try {
      setLoading(true);
      
      // Helper function to normalize ICCID for comparison
      const normalizeIccid = (iccidValue) => {
        if (!iccidValue) return null;
        return String(iccidValue).trim();
      };
      
      // Helper function to extract ICCID from order data
      const extractIccidFromOrder = (orderData) => {
        const checks = [
          orderData?.iccid,
          orderData?.qrCode?.iccid,
          orderData?.orderResult?.iccid,
          orderData?.esimData?.iccid,
          orderData?.airaloOrderData?.sims?.[0]?.iccid,
          orderData?.orderData?.sims?.[0]?.iccid,
          orderData?.sims?.[0]?.iccid,
        ];
        const found = checks.find(val => val && val !== null && val !== undefined);
        return normalizeIccid(found);
      };
      
      // Search for existing eSIM order by ICCID in Firebase collections
      let orderData = null;
      
      console.log('🔍 [DEBUG] Searching for existing eSIM order by ICCID:', iccid);
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      const normalizedSearchIccid = normalizeIccid(iccid);
      
      // Try user collection first if authenticated
      if (currentUser) {
        console.log('🔍 [DEBUG] Searching user collection for authenticated user');
        const esimsRef = collection(db, 'users', currentUser.uid, 'esims');
        const querySnapshot = await getDocs(esimsRef);
        
        // Search through user's orders to find matching ICCID
        for (const docSnap of querySnapshot.docs) {
          const data = docSnap.data();
          const foundIccid = extractIccidFromOrder(data);
          
          if (foundIccid === normalizedSearchIccid) {
            orderData = data;
            console.log('🔍 [SERVER] Found existing eSIM order:', docSnap.id);
            console.log('🔍 [SERVER] Full order data structure:', JSON.stringify(data, null, 2));
            console.log('🔍 [SERVER] Country fields:', { 
              countryCode: data.countryCode, 
              countryName: data.countryName,
              packageId: data.package_id || data.packageId,
              planId: data.planId,
              airaloPackageId: data.airaloOrderData?.package_id,
              airaloCountryCode: data.airaloOrderData?.country_code
            });
            break;
          }
        }
      }
      
      // If not found in user collection or user not authenticated, search global orders
      if (!orderData) {
        console.log('🔍 [DEBUG] Searching global orders collection');
        const globalOrdersRef = collection(db, 'orders');
        const globalQuerySnapshot = await getDocs(globalOrdersRef);
        
        for (const docSnap of globalQuerySnapshot.docs) {
          const data = docSnap.data();
          const foundIccid = extractIccidFromOrder(data);
          
          if (foundIccid === normalizedSearchIccid) {
            orderData = data;
            console.log('🔍 [DEBUG] Found order in global collection:', docSnap.id);
            console.log('🔍 [DEBUG] Global order data:', JSON.stringify(data, null, 2));
            break;
          }
        }
      }
      
      if (orderData) {
        // Get country code from multiple possible locations
        let countryCode = orderData.countryCode || 
                         orderData.airaloOrderData?.country_code ||
                         orderData.orderResult?.country_code;
        
        let countryName = orderData.countryName || 
                         orderData.airaloOrderData?.country_name ||
                         orderData.orderResult?.country_name;
        
        // Extract country name from airaloOrderData installation text if not found
        if (!countryName && orderData.airaloOrderData?.manual_installation) {
          const coverageMatch = orderData.airaloOrderData.manual_installation.match(/<b>Coverage:\s*<\/b>([^<]+)/);
          if (coverageMatch) {
            countryName = coverageMatch[1].trim();
            console.log('🌍 Extracted country from coverage text:', countryName);
          }
        }
        
        console.log('🔍 [SERVER] Final country info:', { countryCode, countryName });
        
        // Use the found order data with country information
        // Prioritize URL country code if provided
        setOrderInfo({
          iccid: iccid,
          customerEmail: orderData.customerEmail || currentUser?.email || 'customer@example.com',
          countryCode: urlCountryCode || countryCode, // URL parameter takes priority
          countryName: countryName,
          planId: orderData.planId || orderData.packageId,
          planName: orderData.planName || orderData.packageName,
          airaloPackageId: orderData.airaloOrderData?.package_id,
          packageName: orderData.airaloOrderData?.package
        });
      } else {
        console.log('⚠️ No existing order found, creating basic order info');
        // Fallback: create basic order info from ICCID and URL country code if available
        setOrderInfo({
          iccid: iccid,
          customerEmail: currentUser?.email || 'customer@example.com',
          countryCode: urlCountryCode || null // Use URL country code if available
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching order info:', error);
      // Create basic order info even if API fails
      setOrderInfo({
        iccid: iccid,
        customerEmail: currentUser?.email || 'customer@example.com'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTopupPackages = async () => {
    try {
      setLoadingPackages(true);
      
      if (!iccid) {
        console.error('❌ No ICCID provided for topup packages');
        toast.error('ICCID is required to fetch topup packages');
        setAvailablePackages([]);
        return;
      }

      // Get country code from URL search params directly (most reliable - works on reload)
      const searchParams = new URLSearchParams(window.location.search);
      const countryFromUrl = searchParams.get('country') || searchParams.get('countryCode');
      
      console.log('📦 Fetching topup packages from topups collection for ICCID:', iccid);
      console.log('🌍 Country code sources:', { 
        urlSearchParam: countryFromUrl,
        urlSearchParamRaw: window.location.search,
        urlCountryCodeProp: urlCountryCode,
        orderInfoCountryCode: orderInfo?.countryCode, 
        countryName: orderInfo?.countryName,
        airaloPackageId: orderInfo?.airaloPackageId 
      });
      
      // If no country code in URL and no orderInfo, wait
      if (!countryFromUrl && !urlCountryCode && !orderInfo) {
        console.warn('⚠️ No country code in URL and order info not loaded yet, waiting...');
        return;
      }
      
      const { collection, getDocs, query, where, arrayContains } = await import('firebase/firestore');
      const { db } = await import('../firebase/config');
      
      // Get country codes - prioritize URL search param, then prop, then order info
      let esimCountryCodes = [];
      
      // First check URL search parameter (highest priority - most reliable on reload)
      if (countryFromUrl) {
        esimCountryCodes = Array.isArray(countryFromUrl) 
          ? countryFromUrl 
          : [countryFromUrl];
        console.log('🌍 ✅ Using country code from URL search parameter:', esimCountryCodes);
      }
      // Second check URL prop
      else if (urlCountryCode) {
        esimCountryCodes = Array.isArray(urlCountryCode) 
          ? urlCountryCode 
          : [urlCountryCode];
        console.log('🌍 ✅ Using country code from URL prop:', esimCountryCodes);
      }
      // Fallback to order info if no URL parameter
      else if (orderInfo?.countryCode) {
        esimCountryCodes = Array.isArray(orderInfo.countryCode) 
          ? orderInfo.countryCode 
          : [orderInfo.countryCode];
        console.log('🌍 ✅ Using country codes from order info:', esimCountryCodes);
      } else {
        console.warn('⚠️ No country code found from any source - will show all packages');
      }
      
      console.log('🔍 FILTERING: Will filter packages by country codes:', esimCountryCodes);
      
      // Query from topups collection (dedicated collection for topup packages)
      // Fetch ALL packages first, then filter by country codes if needed
      // This ensures we don't miss any packages due to query limitations
      const topupQuery = query(collection(db, 'topups'));
      
      const snapshot = await getDocs(topupQuery);
      console.log('🔍 Firebase query returned', snapshot.size, 'documents from topups collection');
      
      if (snapshot.size === 0) {
        console.warn('⚠️ No documents found in topups collection. Make sure topup packages have been synced.');
        // Try to fetch without any filters as fallback
        const fallbackQuery = query(collection(db, 'topups'));
        const fallbackSnapshot = await getDocs(fallbackQuery);
        console.log('🔍 Fallback query returned', fallbackSnapshot.size, 'documents');
        if (fallbackSnapshot.size === 0) {
          console.error('❌ topups collection is empty. Please sync topup packages from the admin panel.');
        }
      }
      
      const packages = [];
      
      const skippedPackages = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const packageSlug = data.slug || doc.id;
        
        // Skip only if explicitly disabled or missing required fields
        // Don't skip if enabled is undefined (assume enabled by default)
        if (data.enabled === false) {
          skippedPackages.push({ slug: packageSlug, reason: 'enabled === false' });
          return;
        }
        if (!data.slug) {
          skippedPackages.push({ slug: packageSlug, reason: 'missing slug' });
          return;
        }
        if (data.price === undefined || data.price === null || data.price === 0) {
          skippedPackages.push({ slug: packageSlug, reason: `invalid price: ${data.price}` });
          return;
        }
        
        // Skip if status is explicitly 'inactive' or 'disabled', but allow undefined/null/active
        if (data.status === 'inactive' || data.status === 'disabled') {
          skippedPackages.push({ slug: packageSlug, reason: `status: ${data.status}` });
          return;
        }
        
        // Extract country codes from package
        const packageCountryCodes = data.country_codes || [];
        
        // STRICT FILTERING for topup packages - only show country-specific packages when country is specified
        if (esimCountryCodes.length > 0) {
          // If package has no country codes, SKIP it (don't show global/regional packages)
          if (!packageCountryCodes || packageCountryCodes.length === 0) {
            console.log(`❌ Package ${packageSlug} has no country codes - skipping (showing only country-specific packages for ${esimCountryCodes.join(', ')})`);
            skippedPackages.push({ 
              slug: packageSlug, 
              reason: `no country codes - showing only ${esimCountryCodes.join(', ')}-specific packages` 
            });
            return; // Skip packages without country codes when filtering by country
          }
          
          // Check if package has matching country code (exact match preferred)
          let hasMatchingCountry = false;
          if (packageCountryCodes && packageCountryCodes.length > 0) {
            // Package has country codes - check for exact match
            hasMatchingCountry = packageCountryCodes.some(code => 
            esimCountryCodes.some(esimCode => {
              const codeStr = String(code).toUpperCase().trim();
              const esimCodeStr = String(esimCode).toUpperCase().trim();
              const matches = codeStr === esimCodeStr;
              if (matches && packages.length < 5) {
                console.log(`✅ Package ${packageSlug} matches country ${esimCodeStr} (package has: ${codeStr})`);
              }
              return matches; // Exact match only
            })
          );
          
          if (!hasMatchingCountry) {
            // Log first few mismatches for debugging
            if (skippedPackages.length < 5) {
              console.log(`❌ Package ${packageSlug} rejected - package countries: [${packageCountryCodes.join(', ') || 'none'}], eSIM: [${esimCountryCodes.join(', ')}]`);
            }
            skippedPackages.push({ 
              slug: packageSlug, 
              reason: `country mismatch - package: [${packageCountryCodes.join(', ') || 'none'}], eSIM: [${esimCountryCodes.join(', ')}]` 
            });
              return; // Skip this package - STRICT FILTERING for packages with country codes
            }
          } else {
            // Package has no country codes - allow it as universal topup
            hasMatchingCountry = true; // Consider it as matching since it's universal
            console.log(`✅ Package ${packageSlug} allowed as universal topup (no country restrictions)`);
          }
        } else {
          // No country code provided - show all packages (fallback)
          console.warn('⚠️ No country code provided - showing ALL topup packages (no filter applied)');
          console.warn('   This should not happen if URL has ?country= parameter');
        }
        
        // Extract data amount - handle different formats
        // Capacity is usually in MB, need to convert properly
        let dataAmount = 'N/A';
        let dataAmountValue = null;
        let dataUnit = 'GB';
        
        if (data.capacity) {
          dataAmountValue = typeof data.capacity === 'number' ? data.capacity : parseFloat(data.capacity);
          // If capacity is less than 1024, it's likely in GB already, otherwise it's in MB
          if (dataAmountValue && dataAmountValue < 1024) {
            // Likely already in GB
            dataAmount = `${dataAmountValue} GB`;
          } else if (dataAmountValue) {
            // Convert MB to GB
            const gbValue = dataAmountValue / 1024;
            if (gbValue >= 1) {
              dataAmount = `${gbValue.toFixed(gbValue % 1 === 0 ? 0 : 1)} GB`;
            } else {
              dataAmount = `${dataAmountValue} MB`;
            }
          }
        } else if (data.data) {
          dataAmount = String(data.data);
        } else if (data.data_amount) {
          const amount = typeof data.data_amount === 'number' ? data.data_amount : parseFloat(data.data_amount);
          if (amount && amount < 1024) {
            dataAmount = `${amount} GB`;
          } else if (amount) {
            const gbValue = amount / 1024;
            if (gbValue >= 1) {
              dataAmount = `${gbValue.toFixed(gbValue % 1 === 0 ? 0 : 1)} GB`;
            } else {
              dataAmount = `${amount} MB`;
            }
          } else {
            dataAmount = String(data.data_amount);
          }
        } else if (data.amount && typeof data.amount === 'number') {
          if (data.amount < 1024) {
            dataAmount = `${data.amount} GB`;
          } else {
            const gbValue = data.amount / 1024;
            dataAmount = `${gbValue.toFixed(gbValue % 1 === 0 ? 0 : 1)} GB`;
          }
        }
        
        // Extract validity - handle different formats
        let validity = 'N/A';
        if (data.period) {
          validity = typeof data.period === 'number' 
            ? `${data.period} days` 
            : String(data.period);
        } else if (data.days) {
          validity = typeof data.days === 'number' 
            ? `${data.days} days` 
            : String(data.days);
        } else if (data.validity) {
          validity = String(data.validity);
        }
        
        // Extract price
        const price = typeof data.price === 'number' ? data.price : parseFloat(data.price) || 0;
        
        const packageData = {
          id: data.slug,
          airaloSlug: data.slug,
          name: data.name || data.title || `${dataAmount} - ${validity}`,
          data: dataAmount,
          price: price,
          validity: validity,
          period: validity,
          country_codes: packageCountryCodes,
          country_code: packageCountryCodes[0] || null,
          country_name: data.country_name || orderInfo?.countryName || null
        };
        
        packages.push(packageData);
      });
      
      
      // Sort by price
      packages.sort((a, b) => a.price - b.price);
      
      console.log('✅ Found', packages.length, 'topup-compatible packages from topups collection');
      console.log('📦 All package slugs:', packages.map(p => p.airaloSlug || p.id));
      
      // Log detailed info about all packages in collection
      console.log('🔍 DEBUG: Total packages in collection:', snapshot.size);
      console.log('🔍 DEBUG: eSIM Country Codes:', esimCountryCodes);
      
      // Log first 10 packages with their country codes for debugging
      const samplePackages = [];
      snapshot.forEach((doc, idx) => {
        if (idx < 10) {
          const data = doc.data();
          samplePackages.push({
            slug: data.slug || doc.id,
            country_codes: data.country_codes || [],
            enabled: data.enabled,
            price: data.price,
            status: data.status
          });
        }
      });
      console.log('🔍 DEBUG: Sample packages from collection:', samplePackages);
      
      // Log skipped packages for debugging
      if (skippedPackages.length > 0) {
        console.log('⚠️ Skipped', skippedPackages.length, 'packages:');
        skippedPackages.slice(0, 20).forEach(skipped => {
          console.log(`  - ${skipped.slug}: ${skipped.reason}`);
        });
        if (skippedPackages.length > 20) {
          console.log(`  ... and ${skippedPackages.length - 20} more skipped packages`);
        }
      }
      
      // STRICT FILTERING: If country code is provided, only show matching packages
      // Do NOT show all packages as fallback - this ensures proper filtering
      if (packages.length === 0 && esimCountryCodes.length > 0 && snapshot.size > 0) {
        console.error('❌ No packages matched country filter!');
        console.error(`   eSIM Country: ${esimCountryCodes.join(', ')}`);
        console.error(`   Total packages in collection: ${snapshot.size}`);
        console.error('   This means packages either:');
        console.error('   1. Don\'t have country codes set');
        console.error('   2. Have different country codes than the eSIM');
        console.error('   → Packages need to be re-synced with correct country codes');
      }
      
      if (packages.length === 0) {
        console.error('❌ No packages after filtering!');
        console.error('📊 Summary:');
        console.error(`  - Total packages in collection: ${snapshot.size}`);
        console.error(`  - Skipped packages: ${skippedPackages.length}`);
        console.error(`  - eSIM Country Codes: [${esimCountryCodes.join(', ')}]`);
        console.error('  - Check if packages have matching country codes');
        console.error('  - Check if packages are enabled and have valid prices');
        
        // Show sample of what packages exist
        if (snapshot.size > 0) {
          console.error('📦 Sample of packages in collection (first 5):');
          let count = 0;
          snapshot.forEach((doc) => {
            if (count < 5) {
              const data = doc.data();
              console.error(`  ${count + 1}. ${data.slug || doc.id}:`, {
                country_codes: data.country_codes || 'none',
                enabled: data.enabled,
                price: data.price,
                status: data.status
              });
              count++;
            }
          });
        }
      }
      console.log('📦 Packages with details:', packages.map(p => ({ 
        slug: p.airaloSlug || p.id,
        name: p.name, 
        price: p.price, 
        data: p.data, 
        validity: p.validity,
        countries: p.country_codes 
      })));
      
      // Log each package individually for easier debugging
      packages.forEach((pkg, index) => {
        console.log(`📦 Package ${index + 1}:`, {
          slug: pkg.airaloSlug || pkg.id,
          name: pkg.name,
          price: `$${pkg.price}`,
          data: pkg.data,
          validity: pkg.validity,
          country_codes: pkg.country_codes
        });
      });
      
      setAvailablePackages(packages);
      
    } catch (error) {
      console.error('❌ Error fetching topup packages:', error);
      toast.error('Failed to load topup packages');
      setAvailablePackages([]);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handlePurchase = async (paymentMethod = 'stripe') => {
    if (!acceptedRefund) {
      toast.error('Please accept the refund policy to continue');
      return;
    }

    if (!selectedPackage) {
      toast.error('Please select a topup package');
      return;
    }

    if (!iccid) {
      toast.error('No ICCID found. Cannot create topup.');
      return;
    }

    if (isProcessing) {
      return;
    }

      setSelectedPaymentMethod(paymentMethod);
    setIsProcessing(true);

    try {
      // Generate unique topup order ID
      const topupOrderId = `topup-${iccid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create order data for payment - use the real Airalo slug
      const airaloPackageId = selectedPackage.airaloSlug || selectedPackage.id;
      
      const orderData = {
        orderId: topupOrderId,
        planId: airaloPackageId, // Use real Airalo package slug
        planName: selectedPackage.name,
        customerEmail: orderInfo?.customerEmail || currentUser?.email || 'customer@example.com',
        amount: selectedPackage.price,
        currency: 'usd',
        type: 'topup', // Mark as topup
        iccid: iccid,
        packageId: airaloPackageId // Use real Airalo package slug
      };

      console.log('💳 [SERVER] Topup order data for payment:', orderData);
      console.log('🔍 [SERVER] Selected package details:', {
        id: selectedPackage.id,
        airaloSlug: selectedPackage.airaloSlug,
        name: selectedPackage.name,
        finalPackageId: airaloPackageId
      });

      console.log('🚀 INITIATING PAYMENT PROCESS');
      console.log('💳 Payment Method:', paymentMethod);
      console.log('🎯 Target ICCID:', iccid);
      console.log('📦 Package to topup:', airaloPackageId);
      console.log('💰 Amount:', selectedPackage.price);
      console.log('📧 Customer Email:', orderData.customerEmail);
      console.log('🆔 Order ID:', topupOrderId);

      // Store topup info in localStorage for after payment
      const topupStorageData = {
        orderId: topupOrderId,
        iccid: iccid,
        packageId: airaloPackageId, // Use real Airalo package slug
        packageName: selectedPackage.name,
        amount: selectedPackage.price,
        customerEmail: orderData.customerEmail,
        type: 'topup',
        paymentMethod: paymentMethod
      };
      
      console.log('💾 Storing topup order in localStorage:', topupStorageData);
      console.log('📦 Package ID being stored:', airaloPackageId);
      console.log('📦 Package details:', {
        id: selectedPackage.id,
        airaloSlug: selectedPackage.airaloSlug,
        name: selectedPackage.name
      });
      
      localStorage.setItem('pendingTopupOrder', JSON.stringify(topupStorageData));

      // Create payment link based on selected method - immediate redirect, no delays
      if (paymentMethod === 'coinbase') {
        await coinbaseService.createCheckoutSession(orderData);
      } else {
        await paymentService.createCheckoutSession(orderData);
      }
      
    } catch (error) {
      console.error('❌ Payment redirect failed:', error);
      toast.error(error.message || 'Failed to start payment process');
      setIsProcessing(false);
      setSelectedPaymentMethod(null);
    }
  };

  const formatData = (data, unit = 'GB') => {
    if (data === 'Unlimited' || data === -1) {
      return 'Unlimited';
    }
    
    // Handle cases where data might already contain the unit
    if (typeof data === 'string' && data.includes(unit)) {
      return data; // Return as-is if unit is already included
    }
    
    return `${data} ${unit}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading topup information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
              <div className="flex items-center gap-2">
                <Battery className="w-6 h-6 text-green-500" />
                <h1 className="text-xl font-bold text-gray-900">Add Data (Topup)</h1>
              </div>
            </div>
          </div>
        </div>
        </div>

      {/* Content */}
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white shadow-lg overflow-hidden"
        >

            {/* Package Selection */}
          <div className="bg-white px-4 pb-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Select Topup Package</h2>
              {selectedPackage && (
                <button
                  onClick={() => setSelectedPackage(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Change Package
                </button>
              )}
            </div>
              
              {loadingPackages ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading packages...</span>
                </div>
              ) : availablePackages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No topup packages available at the moment.</p>
                  <p className="text-sm mt-2">Please try again later.</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Check browser console (F12) for debugging info.
                    {orderInfo?.countryCode && ` eSIM Country: ${orderInfo.countryCode}`}
                  </p>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePackages
                  .filter(pkg => !selectedPackage || pkg.id === selectedPackage.id)
                  .map((pkg) => (
                  <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPackage?.id === pkg.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                    <h3 className="font-semibold text-gray-900 mb-2">{pkg.name}</h3>
                    
                    {/* Package Slug - Display for debugging */}
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        Slug: {pkg.airaloSlug || pkg.id}
                      </div>
                    </div>
                    
                    {/* Country Info */}
                    {pkg.country_codes && pkg.country_codes.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-gray-600 mb-1">Countries</div>
                        <div className="flex flex-wrap gap-1">
                          {pkg.country_codes.slice(0, 3).map((code, index) => (
                            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {code}
                            </span>
                          ))}
                          {pkg.country_codes.length > 3 && (
                            <span className="text-xs text-gray-500">+{pkg.country_codes.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Wifi className="w-4 h-4 text-gray-600" />
                          <div>
                            <div className="text-xs text-gray-600">Data</div>
                            <div className="font-semibold text-black text-sm">{formatData(pkg.data)}</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-600" />
                          <div>
                            <div className="text-xs text-gray-600">Validity</div>
                            <div className="font-semibold text-black text-sm">{pkg.validity}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        ${pkg.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>

          {/* Package Actions */}
            {selectedPackage && (
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                {/* Get Package Section */}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">Get This Package</h3>
                  <div className="max-w-md mx-auto mb-4 text-left">
                    <label htmlFor="acceptRefund" className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                        id="acceptRefund"
                    type="checkbox"
                    checked={acceptedRefund}
                    onChange={(e) => setAcceptedRefund(e.target.checked)}
                        className={"mt-1 h-4 w-4 rounded border-gray-300 focus:ring-blue-500 " + (acceptedRefund ? 'text-blue-600' : 'checkbox-red')}
                  />
                  <span>
                    I accept the <a href="https://esim.roamjet.net/refund-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Refund Policy</a>
                  </span>
                </label>
              </div>

            {/* Payment Method Buttons */}
                  <div className="space-y-3 max-w-md mx-auto">
                {/* Stripe Payment Button */}
                <button
                      onClick={() => handlePurchase('stripe')}
                      disabled={!acceptedRefund || isProcessing}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg text-white ${
                    selectedPaymentMethod === 'stripe' 
                      ? 'bg-blue-700 ring-2 ring-blue-300' 
                      : 'bg-blue-600 hover:bg-blue-700'
                      } ${!acceptedRefund || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                      {isProcessing && selectedPaymentMethod === 'stripe' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <CreditCard className="w-6 h-6" />
                  )}
                  <span>
                        Purchase Now - Credit/Debit Card
                  </span>
                </button>

                {/* Coinbase Payment Button */}
                <button
                      onClick={() => handlePurchase('coinbase')}
                      disabled={!acceptedRefund || isProcessing}
                  className={`w-full flex items-center justify-center space-x-3 py-4 px-6 rounded-xl transition-all duration-200 font-medium text-lg shadow-lg text-white ${
                    selectedPaymentMethod === 'coinbase' 
                      ? 'bg-gray-900 ring-2 ring-gray-400' 
                      : 'bg-black hover:bg-gray-900'
                      } ${!acceptedRefund || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                      {isProcessing && selectedPaymentMethod === 'coinbase' ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Coins className="w-6 h-6" />
                  )}
                  <span>
                        Purchase Now - Cryptocurrency
                  </span>
                </button>
              </div>
                </div>

                {/* How to Use Section */}
                <div className="text-center">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-6">How to Use</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="bg-yellow-100 p-3 rounded-full mb-3">
                        <Zap className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Instant Activation</h4>
                      <p className="text-sm text-gray-600">Get connected immediately after purchase</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="bg-green-100 p-3 rounded-full mb-3">
                        <Shield className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Secure & Reliable</h4>
                      <p className="text-sm text-gray-600">Trusted by millions of travelers worldwide</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="bg-blue-100 p-3 rounded-full mb-3">
                        <Globe className="w-8 h-8 text-blue-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Global Coverage</h4>
                      <p className="text-sm text-gray-600">Stay connected wherever you go</p>
                    </div>
                  </div>
          </div>
        </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TopupPage;