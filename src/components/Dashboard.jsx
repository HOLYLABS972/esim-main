'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs, doc, setDoc, getDoc, deleteDoc, serverTimestamp, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { motion } from 'framer-motion';
import { User, Globe, Settings, QrCode, Eye, Download, Trash2, MoreVertical, Smartphone, Shield, AlertTriangle, Wallet, Flame, Gift } from 'lucide-react';
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
import { useRouter, useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { esimService } from '../services/esimService';
import { getReferralStats, createReferralCode } from '../services/referralService';
import ReferralBottomSheet from './ReferralBottomSheet';

// Generate actual QR code from LPA data using qrcode library
const generateLPAQRCode = async (lpaData) => {
  try {
    if (!lpaData) return null;
    
    // Generate QR code as data URL
    const qrDataUrl = await QRCode.toDataURL(lpaData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating LPA QR code:', error);
    return null;
  }
};

// LPA QR Code Display Component for Dashboard
const LPAQRCodeDisplay = ({ lpaData }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        setIsGenerating(true);
        const qrUrl = await generateLPAQRCode(lpaData);
        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    if (lpaData) {
      generateQR();
    }
  }, [lpaData]);

  if (isGenerating) {
    return (
      <div className="text-center">
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">Generating QR Code...</p>
      </div>
    );
  }

  if (qrCodeUrl) {
    return (
      <div className="text-center">
        <img 
          src={qrCodeUrl} 
          alt="eSIM LPA QR Code" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-full h-full flex items-center justify-center">
        <QrCode className="w-32 h-32 text-gray-400" />
      </div>
      <p className="text-sm text-gray-500 mt-2">QR generation failed</p>
    </div>
  );
};

const Dashboard = () => {
  const { currentUser, userProfile, loadUserProfile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [generatedQRCode, setGeneratedQRCode] = useState(null);
  const [esimDetails, setEsimDetails] = useState(null);
  const [loadingEsimDetails, setLoadingEsimDetails] = useState(false);
  const [esimUsage, setEsimUsage] = useState(null);
  const [loadingEsimUsage, setLoadingEsimUsage] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReferralSheet, setShowReferralSheet] = useState(false);
  
  // Affiliate data
  const [referralStats, setReferralStats] = useState({
    referralCode: null,
    usageCount: 0,
    totalEarnings: 0,
    isActive: false
  });
  const [loadingReferralStats, setLoadingReferralStats] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.dropdown-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Load referral stats
  const loadReferralStats = async () => {
    if (!currentUser) return;
    
    try {
      setLoadingReferralStats(true);
      const stats = await getReferralStats(currentUser.uid);
      
      if (stats.referralCode) {
        setReferralStats(stats);
      } else {
        // Create referral code if user doesn't have one
        const result = await createReferralCode(currentUser.uid, currentUser.email);
        if (result.success) {
          // Reload stats after creating code
          const newStats = await getReferralStats(currentUser.uid);
          setReferralStats(newStats);
        }
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoadingReferralStats(false);
    }
  };

  // Check for access denied error
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'access_denied') {
      // Show access denied message
      console.log('Access denied: User tried to access admin panel without permission');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) {
        console.log('❌ No current user, skipping data fetch');
        return;
      }

      try {
        // Load referral stats
        await loadReferralStats();
        console.log('🔍 Current user:', currentUser.email);
        console.log('🔍 Firebase db:', db);
        
        // Fetch eSIMs from mobile app collection structure (users/{userId}/esims)
        console.log('📱 Fetching eSIMs from mobile app collection...');
        const esimsQuery = query(
          collection(db, 'users', currentUser.uid, 'esims')
        );
        
        console.log('📝 eSIMs query created');
        const esimsSnapshot = await getDocs(esimsQuery);
        console.log('📝 eSIMs snapshot received:', esimsSnapshot.size, 'documents');
        
        const ordersData = esimsSnapshot.docs.map(doc => {
          try {
            const data = doc.data();
                          return {
                id: doc.id,
                ...data,
                // Map mobile app fields to web app expected fields
                orderId: data.orderResult?.orderId || data.order_id || data.id,
                planName: data.planName || data.orderResult?.planName || 'Unknown Plan',
                amount: data.price || data.orderResult?.price || 0,
                status: data.status || data.orderResult?.status || 'unknown',
                customerEmail: data.customerEmail || currentUser.email,
                createdAt: data.createdAt || data.created_at,
                updatedAt: data.updatedAt || data.updated_at,
                // Map country information
                countryCode: data.countryCode || data.orderResult?.countryCode,
                countryName: data.countryName || data.orderResult?.countryName,
                // Map QR code data
                qrCode: {
                  qrCode: data.qrCode || data.orderResult?.qrCode,
                  qrCodeUrl: data.qrCodeUrl || data.orderResult?.qrCodeUrl,
                  directAppleInstallationUrl: data.directAppleInstallationUrl || data.orderResult?.directAppleInstallationUrl,
                  iccid: data.iccid || data.orderResult?.iccid,
                  lpa: data.lpa || data.orderResult?.lpa,
                  matchingId: data.matchingId || data.orderResult?.matchingId
                }
              };
          } catch (docError) {
            console.error('❌ Error processing document:', doc.id, docError);
            return null;
          }
        }).filter(Boolean); // Remove null entries
        
        setOrders(ordersData);
        console.log('📊 Fetched eSIMs:', ordersData.length);
        console.log('📊 eSIMs data:', ordersData);
      } catch (error) {
        console.error('❌ Error fetching eSIMs:', error);
        console.error('❌ Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        // Set empty orders array on error
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    const ensureUserProfile = async () => {
      if (!currentUser) return;

      try {
        console.log('Checking user profile for:', currentUser.uid);
        // Check if user profile exists
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (!userDoc.exists()) {
          console.log('User profile does not exist, creating...');
          // Create user profile if it doesn't exist
          await setDoc(doc(db, 'users', currentUser.uid), {
            email: currentUser.email,
            displayName: currentUser.displayName || 'Unknown User',
            createdAt: new Date(),
            role: 'customer'
          });
          console.log('✅ Created missing user profile');
          // Reload user profile after creating it
          await loadUserProfile();
        } else {
          console.log('✅ User profile exists:', userDoc.data());
          // Force reload profile in case it wasn't loaded
          await loadUserProfile();
        }
      } catch (error) {
        console.error('❌ Error ensuring user profile:', error);
      }
    };

    ensureUserProfile();
    fetchData();
  }, [currentUser, loadUserProfile]);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push('/login');
    }
  }, [authLoading, currentUser, router]);

  // Show loading spinner while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!currentUser) {
    return null;
  }

  const activeOrders = orders.filter(order => order && order.status === 'active');


  const handleViewQRCode = async (order) => {
    try {
      setSelectedOrder(order);
      setShowQRModal(true);
      
      // Check if we already have QR code data in the order (multiple formats for compatibility)
      const hasQrCode = order.qrCode && (
        (typeof order.qrCode === 'string' && order.qrCode.length > 0) ||
        (typeof order.qrCode === 'object' && (order.qrCode.qrCode || order.qrCode.qrCodeUrl || order.qrCode.directAppleInstallationUrl))
      );
      
      const hasOtherQrData = order.directAppleInstallationUrl || order.qrCodeUrl || order.iccid;
      
      if (hasQrCode || hasOtherQrData) {
        console.log('✅ Using existing QR code data from order');
        let qrCodeData;
        
        if (typeof order.qrCode === 'object') {
          qrCodeData = order.qrCode;
        } else {
          qrCodeData = {
            qrCode: order.qrCode || order.directAppleInstallationUrl,
            qrCodeUrl: order.qrCodeUrl,
            directAppleInstallationUrl: order.directAppleInstallationUrl,
            iccid: order.iccid,
            lpa: order.lpa,
            matchingId: order.matchingId,
            activationCode: order.activationCode,
            isReal: true
          };
        }
        
        setSelectedOrder(prev => ({ ...prev, qrCode: qrCodeData }));
      } else {
        console.log('⚠️ No existing QR code data, retrieving from API...');
        // Retrieve QR code from API (this will now allow multiple retrievals)
        const qrResult = await generateQRCode(order.orderId || order.id, order.planName);
        setSelectedOrder(prev => ({ ...prev, qrCode: qrResult }));
      }
    } catch (error) {
      console.error('Error opening QR modal:', error);
    }
  };

  const generateQRCode = async (orderId, planName, retryCount = 0) => {
    try {
      // Try to get real QR code from Airalo API
      console.log(`📱 Attempting to get real QR code for order: ${orderId} (attempt ${retryCount + 1})`);
      
      const qrCodeResult = await esimService.getEsimQrCode(orderId);
      
      if (qrCodeResult.success && qrCodeResult.qrCode) {
        console.log('✅ Real QR code received:', qrCodeResult);
        return {
          qrCode: qrCodeResult.qrCode,
          qrCodeUrl: qrCodeResult.qrCodeUrl,
          directAppleInstallationUrl: qrCodeResult.directAppleInstallationUrl,
          iccid: qrCodeResult.iccid,
          lpa: qrCodeResult.lpa,
          matchingId: qrCodeResult.matchingId,
          activationCode: qrCodeResult.activationCode,
          smdpAddress: qrCodeResult.smdpAddress,
          orderDetails: qrCodeResult.orderDetails,
          simDetails: qrCodeResult.simDetails,
          fromCache: qrCodeResult.fromCache || false,
          canRetrieveMultipleTimes: qrCodeResult.canRetrieveMultipleTimes || false,
          isReal: true
        };
      } else {
        throw new Error('No QR code data received');
      }
    } catch (error) {
      console.log(`⚠️ Real QR code failed (attempt ${retryCount + 1}):`, error.message);
      
      // If this is a "not ready yet" error and we haven't retried too many times, retry
      if (error.message.includes('not available yet') && retryCount < 3) {
        console.log('⏳ QR code not ready, retrying in 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        return generateQRCode(orderId, planName, retryCount + 1);
      }
      
      // Fallback to simple data string
      const qrData = `eSIM:${orderId || 'unknown'}|Plan:${planName || 'unknown'}|Status:Active`;
      return {
        qrCode: qrData,
        isReal: false,
        fallbackReason: error.message,
        canRetry: true
      };
    }
  };

  // Update Firebase order with correct country information
  const updateOrderCountryInfo = async (order, esimDetails) => {
    try {
      console.log('🔄 Updating country info for order:', order.id);
      
        // Extract country info from plan ID using the same logic as PaymentSuccess
        const getCountryFromPlan = (planId) => {
          if (!planId) return null;

          const countryMap = {
            // Comprehensive country mapping from cleaned countries.txt
            'sohbat-mobile': { code: "AF", name: "Afghanistan" },
            'hej-telecom': { code: "AL", name: "Albania" },
            'algecom': { code: "DZ", name: "Algeria" },
            'handi': { code: "AD", name: "Andorra" },
            'dolphin-mobile': { code: "AI", name: "Anguilla" },
            '17-miles': { code: "AG", name: "Antigua And Barbuda" },
            '17miles': { code: "AG", name: "Antigua And Barbuda" },
            'saba-mobile': { code: "AN", name: "Antilles" },
            'abrazo': { code: "AR", name: "Argentina" },
            'arpi-telecom': { code: "AM", name: "Armenia" },
            'noord-communications-in': { code: "AW", name: "Aruba" },
            'yes-go': { code: "AU", name: "Australia" },
            'viennetz-mobil': { code: "AT", name: "Austria" },
            'yaxsi-mobile': { code: "AZ", name: "Azerbaijan" },
            'pico': { code: "PT", name: "Azores" },
            'jitney-mobile': { code: "BS", name: "Bahamas" },
            'saar-mobile': { code: "BH", name: "Bahrain" },
            'fatafati-in': { code: "BD", name: "Bangladesh" },
            'barbnet': { code: "BB", name: "Barbados" },
            'norach-telecom': { code: "BY", name: "Belarus" },
            'belganet': { code: "BE", name: "Belgium" },
            'cho': { code: "BZ", name: "Belize" },
            'cotton-mobile': { code: "BJ", name: "Benin" },
            'bermy-mobile': { code: "BM", name: "Bermuda" },
            'paro': { code: "BT", name: "Bhutan" },
            'wa-mobile': { code: "BO", name: "Bolivia" },
            'hatonet': { code: "BQ", name: "Bonaire" },
            'bosher': { code: "BA", name: "Bosnia and Herzegovina" },
            'maun-telecom': { code: "BW", name: "Botswana" },
            'joia': { code: "BR", name: "Brazil" },
            'muara-mobile': { code: "BN", name: "Brunei" },
            'bultel': { code: "BG", name: "Bulgaria" },
            'volta': { code: "BF", name: "Burkina Faso" },
            'connect-cambodia': { code: "KH", name: "Cambodia" },
            'kamtok-telecom': { code: "CM", name: "Cameroon" },
            'canada-mobile': { code: "CA", name: "Canada" },
            'mansetel': { code: "ES", name: "Canary Islands" },
            'fogotel': { code: "CV", name: "Cape Verde" },
            'atlantis-telecom': { code: "KY", name: "Cayman Islands" },
            'chinko': { code: "CF", name: "Central African Republic" },
            'first-well': { code: "TD", name: "Chad" },
            'altoque': { code: "CL", name: "Chile" },
            'chinacom': { code: "CN", name: "China" },
            'hartonet': { code: "CO", name: "Colombia" },
            'hot-telecom': { code: "CR", name: "Costa Rica" },
            'nouchi-mobile': { code: "CI", name: "Côte d'Ivoire" },
            'cronet': { code: "HR", name: "Croatia" },
            'dushi-mobile': { code: "CW", name: "Curaçao" },
            'dekanet': { code: "CY", name: "Cyprus" },
            'prosim': { code: "CZ", name: "Czech Republic" },
            'hygge-mobile': { code: "DK", name: "Denmark" },
            'djibnet': { code: "DJ", name: "Djibouti" },
            'nature-mobile': { code: "DM", name: "Dominica" },
            'caribe-mobile': { code: "DO", name: "Dominican Republic" },
            'mitad-mobile': { code: "EC", name: "Ecuador" },
            'nile-mobile': { code: "EG", name: "Egypt" },
            'chivo': { code: "SV", name: "El Salvador" },
            'malabo-mobile': { code: "GQ", name: "Equatorial Guinea" },
            'eritcom': { code: "ER", name: "Eritrea" },
            'estonia-mobile': { code: "EE", name: "Estonia" },
            'eswatini-communications': { code: "SZ", name: "Eswatini" },
            'habesha-mobile': { code: "ET", name: "Ethiopia" },
            'bula-mobile': { code: "FJ", name: "Fiji" },
            'suomi-mobile': { code: "FI", name: "Finland" },
            'elan': { code: "FR", name: "France" },
            'okoume-mobile': { code: "GA", name: "Gabon" },
            'teranga-mobile': { code: "GM", name: "Gambia" },
            'kargi': { code: "GE", name: "Georgia" },
            'hallo-mobil': { code: "DE", name: "Germany" },
            'akwaaba-mobile': { code: "GH", name: "Ghana" },
            'meraki-mobile': { code: "GR", name: "Greece" },
            'spice-mobile': { code: "GD", name: "Grenada" },
            'chapin-mobile': { code: "GT", name: "Guatemala" },
            'guinee-mobile': { code: "GN", name: "Guinea" },
            'guinea-bissau-mobile': { code: "GW", name: "Guinea-Bissau" },
            'guyana-mobile': { code: "GY", name: "Guyana" },
            'ayiti-mobile': { code: "HT", name: "Haiti" },
            'catracho-mobile': { code: "HN", name: "Honduras" },
            'hkmobile': { code: "HK", name: "Hong Kong" },
            'magyar-mobile': { code: "HU", name: "Hungary" },
            'island-mobile': { code: "IS", name: "Iceland" },
            'kallur-digital': { code: "IN", name: "India" },
            'indonesia-mobile': { code: "ID", name: "Indonesia" },
            'iran-mobile': { code: "IR", name: "Iran" },
            'iraq-mobile': { code: "IQ", name: "Iraq" },
            'eire-mobile': { code: "IE", name: "Ireland" },
            'isle-of-man-mobile': { code: "IM", name: "Isle of Man" },
            'ahava': { code: "IL", name: "Israel" },
            'mamma-mia': { code: "IT", name: "Italy" },
            'jamaica-mobile': { code: "JM", name: "Jamaica" },
            'moshi-moshi': { code: "JP", name: "Japan" },
            'jersey-mobile': { code: "JE", name: "Jersey" },
            'jordan-mobile': { code: "JO", name: "Jordan" },
            'kazakhstan-mobile': { code: "KZ", name: "Kazakhstan" },
            'kenya-mobile': { code: "KE", name: "Kenya" },
            'kiribati-mobile': { code: "KI", name: "Kiribati" },
            'plisi': { code: "XK", name: "Kosovo" },
            'kuwait-mobile': { code: "KW", name: "Kuwait" },
            'kyrgyzstan-mobile': { code: "KG", name: "Kyrgyzstan" },
            'laos-mobile': { code: "LA", name: "Laos" },
            'latvia-mobile': { code: "LV", name: "Latvia" },
            'lebanon-mobile': { code: "LB", name: "Lebanon" },
            'lesotho-mobile': { code: "LS", name: "Lesotho" },
            'liberia-mobile': { code: "LR", name: "Liberia" },
            'libya-mobile': { code: "LY", name: "Libya" },
            'liechtenstein-mobile': { code: "LI", name: "Liechtenstein" },
            'lithuania-mobile': { code: "LT", name: "Lithuania" },
            'luxembourg-mobile': { code: "LU", name: "Luxembourg" },
            'macau-mobile': { code: "MO", name: "Macau" },
            'madagascar-mobile': { code: "MG", name: "Madagascar" },
            'porto': { code: "PT", name: "Madeira" },
            'malawi-mobile': { code: "MW", name: "Malawi" },
            'sambungkan': { code: "MY", name: "Malaysia" },
            'maldives-mobile': { code: "MV", name: "Maldives" },
            'mali-mobile': { code: "ML", name: "Mali" },
            'malta-mobile': { code: "MT", name: "Malta" },
            'marshall-mobile': { code: "MH", name: "Marshall Islands" },
            'mauritania-mobile': { code: "MR", name: "Mauritania" },
            'mauritius-mobile': { code: "MU", name: "Mauritius" },
            'chido': { code: "MX", name: "Mexico" },
            'micronesia-mobile': { code: "FM", name: "Micronesia" },
            'moldova-mobile': { code: "MD", name: "Moldova" },
            'monaco-mobile': { code: "MC", name: "Monaco" },
            'mongolia-mobile': { code: "MN", name: "Mongolia" },
            'montenegro-mobile': { code: "ME", name: "Montenegro" },
            'morocco-mobile': { code: "MA", name: "Morocco" },
            'mozambique-mobile': { code: "MZ", name: "Mozambique" },
            'myanmar-mobile': { code: "MM", name: "Myanmar" },
            'namibia-mobile': { code: "NA", name: "Namibia" },
            'nauru-mobile': { code: "NR", name: "Nauru" },
            'nepal-mobile': { code: "NP", name: "Nepal" },
            'netherlands-mobile': { code: "NL", name: "Netherlands" },
            'new-zealand-mobile': { code: "NZ", name: "New Zealand" },
            'nicaragua-mobile': { code: "NI", name: "Nicaragua" },
            'niger-mobile': { code: "NE", name: "Niger" },
            'nigeria-mobile': { code: "NG", name: "Nigeria" },
            'north-korea-mobile': { code: "KP", name: "North Korea" },
            'north-macedonia-mobile': { code: "MK", name: "North Macedonia" },
            'adanet': { code: "CY", name: "Northern Cyprus" },
            'norway-mobile': { code: "NO", name: "Norway" },
            'oman-mobile': { code: "OM", name: "Oman" },
            'pakistan-mobile': { code: "PK", name: "Pakistan" },
            'palau-mobile': { code: "PW", name: "Palau" },
            'palestine-mobile': { code: "PS", name: "Palestine" },
            'panama-mobile': { code: "PA", name: "Panama" },
            'papua-new-guinea-mobile': { code: "PG", name: "Papua New Guinea" },
            'paraguay-mobile': { code: "PY", name: "Paraguay" },
            'peru-mobile': { code: "PE", name: "Peru" },
            'philippines-mobile': { code: "PH", name: "Philippines" },
            'poland-mobile': { code: "PL", name: "Poland" },
            'portugal-mobile': { code: "PT", name: "Portugal" },
            'boricua-in-mobile': { code: "PR", name: "Puerto Rico" },
            'qatar-mobile': { code: "QA", name: "Qatar" },
            'romania-mobile': { code: "RO", name: "Romania" },
            'russia-mobile': { code: "RU", name: "Russia" },
            'rwanda-mobile': { code: "RW", name: "Rwanda" },
            'saint-kitts-mobile': { code: "KN", name: "Saint Kitts and Nevis" },
            'saint-lucia-mobile': { code: "LC", name: "Saint Lucia" },
            'tobago': { code: "VC", name: "Saint Vincent and the Grenadines" },
            'faaf-mobile': { code: "WS", name: "Samoa" },
            'san-marino-mobile': { code: "SM", name: "San Marino" },
            'sao-tome-mobile': { code: "ST", name: "Sao Tome and Principe" },
            'red-sand': { code: "SA", name: "Saudi Arabia" },
            'nessietel': { code: "GB", name: "Scotland" },
            'retba-mobile': { code: "SN", name: "Senegal" },
            'serbia-mobile': { code: "RS", name: "Serbia" },
            'laziocom': { code: "SC", name: "Seychelles" },
            'buncenet': { code: "SL", name: "Sierra Leone" },
            'connect-lah': { code: "SG", name: "Singapore" },
            'dobry-den': { code: "SK", name: "Slovakia" },
            'zivjo': { code: "SI", name: "Slovenia" },
            'solomon-mobile': { code: "SB", name: "Solomon Islands" },
            'somalia-mobile': { code: "SO", name: "Somalia" },
            'cellsa': { code: "ZA", name: "South Africa" },
            'jang': { code: "KR", name: "South Korea" },
            'south-sudan-mobile': { code: "SS", name: "South Sudan" },
            'guay-mobile': { code: "ES", name: "Spain" },
            'sri-lanka-mobile': { code: "LK", name: "Sri Lanka" },
            'sudan-mobile': { code: "SD", name: "Sudan" },
            'pondocom': { code: "SR", name: "Suriname" },
            'van': { code: "SE", name: "Sweden" },
            'switzerland-mobile': { code: "CH", name: "Switzerland" },
            'syria-mobile': { code: "SY", name: "Syria" },
            'xie-xie-unlimited': { code: "TW", name: "Taiwan" },
            'sarez-telecom': { code: "TJ", name: "Tajikistan" },
            'tanzacomm': { code: "TZ", name: "Tanzania" },
            'maew': { code: "TH", name: "Thailand" },
            'jaco-mobile': { code: "TL", name: "Timor - Leste" },
            'atakora-mobile': { code: "TG", name: "Togo" },
            'tofua-mobile': { code: "TO", name: "Tonga" },
            'tritocom': { code: "TT", name: "Trinidad and Tobago" },
            'el-jem-communications': { code: "TN", name: "Tunisia" },
            'merhaba': { code: "TR", name: "Turkey" },
            'turkmenistan-mobile': { code: "TM", name: "Turkmenistan" },
            'tuca-mobile': { code: "TC", name: "Turks and Caicos Islands" },
            'tuvalu-mobile': { code: "TV", name: "Tuvalu" },
            'ugish': { code: "UG", name: "Uganda" },
            'ukraine-mobile': { code: "UA", name: "Ukraine" },
            'burj-mobile': { code: "AE", name: "United Arab Emirates" },
            'uki-mobile': { code: "GB", name: "United Kingdom" },
            'change': { code: "US", name: "United States" },
            'ballena': { code: "UY", name: "Uruguay" },
            'uzbeknet': { code: "UZ", name: "Uzbekistan" },
            'efate': { code: "VU", name: "Vanuatu" },
            'ager-in': { code: "VA", name: "Vatican City" },
            'aragua-mobile': { code: "VE", name: "Venezuela" },
            'xin-chao-in': { code: "VN", name: "Vietnam" },
            'magens-mobile-in': { code: "VI", name: "Virgin Islands (U.S.)" },
            'yemen-mobile': { code: "YE", name: "Yemen" },
            'kafue-mobile': { code: "ZM", name: "Zambia" },
            'zimcom': { code: "ZW", name: "Zimbabwe" },
            
            'default': { code: "US", name: "United States" }
          };

          const countryKey = Object.keys(countryMap).find(key => planId.includes(key));
          return countryMap[countryKey] || countryMap.default;
        };
      
      // Get country info from plan ID
      const countryInfo = getCountryFromPlan(order.planId || order.id);
      
      if (!countryInfo) {
        console.log('⚠️ Could not determine country from plan ID:', order.planId);
        return;
      }
      
      // Check if country info needs updating
      const currentCountryCode = order.countryCode;
      const currentCountryName = order.countryName;
      
      if (currentCountryCode === countryInfo.code && currentCountryName === countryInfo.name) {
        console.log('✅ Country info is already correct, no update needed');
        return;
      }
      
      console.log('🔄 Updating country info:', {
        from: { code: currentCountryCode, name: currentCountryName },
        to: { code: countryInfo.code, name: countryInfo.name }
      });
      
      // Update the order in Firebase
      const orderRef = doc(db, 'users', currentUser.uid, 'esims', order.id);
      await updateDoc(orderRef, {
        countryCode: countryInfo.code,
        countryName: countryInfo.name,
        updatedAt: serverTimestamp(),
        countryUpdatedAt: serverTimestamp(),
        countryUpdateReason: 'Corrected from eSIM details check'
      });
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === order.id 
            ? { ...o, countryCode: countryInfo.code, countryName: countryInfo.name }
            : o
        )
      );
      
      console.log('✅ Country info updated successfully');
      toast.success(`Country info updated: ${countryInfo.name} (${countryInfo.code})`, {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
      
    } catch (error) {
      console.error('❌ Error updating country info:', error);
      toast.error(`Failed to update country info: ${error.message}`, {
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    }
  };


  const handleCheckEsimUsage = async () => {
    if (!selectedOrder || loadingEsimUsage) return;
    
    try {
      setLoadingEsimUsage(true);
      console.log('📊 Checking eSIM usage for order:', selectedOrder);
      
      // Get ICCID from the order
      const iccid = selectedOrder.qrCode?.iccid || selectedOrder.iccid;
      
      if (!iccid) {
        console.log('❌ No ICCID found in order');
        alert('No ICCID found in this order. Cannot check eSIM usage.');
        return;
      }
      
      console.log('📊 Checking eSIM usage for ICCID:', iccid);
      const result = await esimService.getEsimUsageByIccid(iccid);
      
      if (result.success) {
        setEsimUsage(result.data);
        console.log('✅ eSIM usage retrieved:', result.data);
      } else {
        console.log('❌ Failed to get eSIM usage:', result.error);
        alert(`Failed to get eSIM usage: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error checking eSIM usage:', error);
      alert(`Error checking eSIM usage: ${error.message}`);
    } finally {
      setLoadingEsimUsage(false);
    }
  };

  const handleDeleteOrder = async () => {
    console.log('🔴 Delete button clicked!');
    console.log('🔴 selectedOrder:', selectedOrder);
    console.log('🔴 isRetrying:', isRetrying);
    
    if (!selectedOrder || isRetrying) {
      console.log('🔴 Early return - no selectedOrder or isRetrying');
      return;
    }
    
    try {
      setIsRetrying(true);
      console.log('🗑️ Deleting eSIM order from Firestore...');
      console.log('🗑️ Selected order data:', selectedOrder);
      
      // Get the ICCID and package info before deleting
      const iccid = selectedOrder.esimData?.iccid;
      const packageId = selectedOrder.package_id;
      const orderId = selectedOrder.orderId || selectedOrder.id;
      
      console.log('🗑️ Order details:', { iccid, packageId, orderId });
      
      // Delete the order from Firestore (users/{userId}/esims collection)
      const orderRef = doc(db, 'users', currentUser.uid, 'esims', orderId);
      console.log('🗑️ Deleting document at path:', `users/${currentUser.uid}/esims/${orderId}`);
      await deleteDoc(orderRef);
      console.log('✅ Order deleted from Firestore');
      
      // SIM tracking (optional - don't fail if this doesn't work)
      if (iccid && packageId) {
        try {
          console.log('🔄 Marking SIM as available again:', { iccid, packageId });
          
          // Create or update available SIMs collection
          const availableSimRef = doc(db, 'available_sims', iccid);
          await setDoc(availableSimRef, {
            iccid: iccid,
            package_id: packageId,
            status: 'available',
            released_at: serverTimestamp(),
            released_from_order: selectedOrder.orderId || selectedOrder.id
          }, { merge: true });
          
          console.log('✅ SIM marked as available again');
        } catch (simError) {
          console.error('⚠️ Failed to mark SIM as available:', simError);
          // Don't fail the delete operation if SIM tracking fails
        }
      } else {
        console.log('⚠️ No ICCID or packageId found, skipping SIM tracking');
      }
      
      // Remove from local state
      setOrders(prev => prev.filter(order => order.id !== selectedOrder.id));
      setSelectedOrder(null);
      setShowQRModal(false);
      
      console.log('✅ eSIM order deleted from Firestore successfully');
    } catch (error) {
      console.error('❌ Error deleting eSIM order:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      // Show user-friendly error message
      alert(`Failed to delete order: ${error.message}`);
    } finally {
      setIsRetrying(false);
    }
  };


  return (
    <div className="min-h-screen bg-white py-24">
      {/* Access Denied Alert */}
      {searchParams.get('error') === 'access_denied' && (
        <section className="bg-white">
          <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8 mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute inset-px rounded-xl bg-red-50"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                <div className="px-8 pt-6 pb-6">
                  <div className="flex items-center">
                    <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
                      <p className="text-sm text-red-700 mt-1">
                        You don't have permission to access the admin panel. Only administrators can access this area.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-red-200"></div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Header Section */}
      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative"
          >
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-tufts-blue/10 p-3 rounded-full">
                      <User className="w-8 h-8 text-tufts-blue" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-medium tracking-tight text-eerie-black">
                        Welcome back, {currentUser.displayName || currentUser.email}!
                      </h1>
                      <p className="text-cool-black mt-2">
                        Manage your eSIM orders and account settings
                      </p>
                    </div>
                  </div>
                  {!userProfile?.referralCodeUsed && (
                    <button
                      onClick={() => setShowReferralSheet(true)}
                      className="btn-primary flex items-center space-x-2"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Apply Referral</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </motion.div>
        </div>
      </section>


      {/* Stats Cards */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="absolute inset-px rounded-xl bg-white"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                <div className="px-8 pt-8 pb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-cool-black">Total Orders</p>
                      <p className="text-3xl font-bold text-eerie-black mt-2">{orders.length}</p>
                    </div>
                    <div className="bg-tufts-blue/10 p-3 rounded-full">
                      <Globe className="w-6 h-6 text-tufts-blue" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute inset-px rounded-xl bg-white"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                <div className="px-8 pt-8 pb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-cool-black">Active eSIMs</p>
                      <p className="text-3xl font-bold text-green-600 mt-2">{activeOrders.length}</p>
                    </div>
                    <div className="bg-green-500/10 p-3 rounded-full">
                      <QrCode className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="relative cursor-pointer group"
              onClick={() => router.push('/affiliate-program')}
            >
              <div className="absolute inset-px rounded-xl bg-white group-hover:bg-gray-50 transition-colors"></div>
              <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
                <div className="px-8 pt-8 pb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-cool-black">Your Performance</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <div>
                          <p className="text-3xl font-bold text-purple-600">${referralStats.totalEarnings.toFixed(2)}</p>
                          <p className="text-xs text-cool-black">Total Earnings</p>
                        </div>
                        {(referralStats.usageCount || 0) > 0 && (
                          <div className="border-l border-gray-200 pl-4">
                            <p className="text-3xl font-bold text-green-600">{Math.floor(referralStats.usageCount || 0)}</p>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-purple-600 mt-2 font-medium">Tap to join affiliate program →</p>
                    </div>
                    <div className="bg-purple-500/10 p-3 rounded-full">
                      <Wallet className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5 group-hover:ring-gray-300 transition-colors"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Recent Orders */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-medium tracking-tight text-eerie-black">Recent Orders</h2>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tufts-blue"></div>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Globe className="w-12 h-12 text-cool-black/40 mx-auto mb-4" />
                    <p className="text-cool-black">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      order && (
                        <div
                          key={order.id || order.orderId || Math.random()}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">
                              {getFlagEmoji(order.countryCode)}
                            </div>
                            <div>
                              <p className="font-medium text-eerie-black">{order.planName || 'Unknown Plan'}</p>
                              <p className="text-sm text-cool-black">Order #{order.orderId || order.id || 'Unknown'}</p>
                              <p className="text-xs text-cool-black/60">
                                {order.countryName || order.countryCode || 'Unknown Country'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium text-eerie-black">${Math.round(order.amount || 0)}</p>
                              <div className="flex items-center justify-end space-x-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  order.status === 'active' ? 'bg-green-500' :
                                  order.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                                }`}></div>
                                <p className="text-sm text-cool-black capitalize">{order.status || 'unknown'}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewQRCode(order)}
                              className="flex items-center space-x-2 px-3 py-2 bg-tufts-blue/10 text-tufts-blue rounded-lg hover:bg-tufts-blue/20 transition-colors duration-200"
                            >
                              <QrCode className="w-4 h-4" />
                              <span className="text-sm">View QR</span>
                            </button>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </motion.div>
        </div>
      </section>



      {/* Account Settings */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center space-x-3 mb-6">
                  <Settings className="w-6 h-6 text-tufts-blue" />
                  <h2 className="text-2xl font-medium tracking-tight text-eerie-black">Account Settings</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-cool-black">Email</label>
                      <p className="mt-1 text-eerie-black">{currentUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cool-black">Name</label>
                      <p className="mt-1 text-eerie-black">{currentUser.displayName || 'Not set'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-cool-black">Account Created</label>
                      <p className="mt-1 text-eerie-black">
                        {userProfile?.createdAt ? 
                          (userProfile.createdAt.toDate ? 
                            new Date(userProfile.createdAt.toDate()).toLocaleDateString() :
                            new Date(userProfile.createdAt).toLocaleDateString()
                          ) : 
                          'Unknown'
                        }
                      </p>
                      {!userProfile?.createdAt && (
                        <button 
                          onClick={async () => {
                            console.log('Manual refresh triggered');
                            await loadUserProfile();
                          }}
                          className="mt-2 text-sm text-tufts-blue hover:text-cobalt-blue underline transition-colors"
                        >
                          Refresh Profile
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-cool-black">Role</label>
                      <p className="mt-1 text-eerie-black capitalize">{userProfile?.role || 'customer'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </motion.div>
        </div>
      </section>

      {/* Spacing after dashboard */}
      <div className="h-20"></div>

      {/* QR Code Modal */}
      {showQRModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-md w-full mx-4"
          >
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="text-center">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-eerie-black">eSIM QR Code</h3>
                    <button
                      onClick={() => setShowQRModal(false)}
                      className="text-cool-black hover:text-eerie-black transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
              
                  <div className="mb-6">
                    <h4 className="font-medium text-eerie-black mb-2">{selectedOrder.planName || 'Unknown Plan'}</h4>
                    <p className="text-sm text-cool-black">Order #{selectedOrder.orderId || selectedOrder.id || 'Unknown'}</p>
                    <p className="text-sm text-cool-black">${Math.round(selectedOrder.amount || 0)}</p>
                  </div>

              {/* QR Code Display - Clean and Simple */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6">
                {console.log('🔍 QR Code data for display:', selectedOrder.qrCode)}
                {console.log('🔍 Full selectedOrder:', selectedOrder)}
                {selectedOrder.qrCode && selectedOrder.qrCode.qrCode ? (
                  // Show the actual QR code from LPA data (contains "Add Cellular Plan")
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-green-300 shadow-sm">
                      <LPAQRCodeDisplay lpaData={selectedOrder.qrCode.qrCode} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ Real QR Code from Airalo (Add Cellular Plan)</p>
                    <p className="text-xs text-gray-400 mt-1 break-all">QR Data: {selectedOrder.qrCode.qrCode?.substring(0, 50)}...</p>
                  </div>
                ) : selectedOrder.qrCode && selectedOrder.qrCode.qrCodeUrl ? (
                  // Fallback: Show QR code image from URL
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-blue-300 shadow-sm">
                      <img 
                        src={selectedOrder.qrCode.qrCodeUrl} 
                        alt="eSIM QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ QR Code Image from Airalo</p>
                  </div>
                ) : selectedOrder.qrCode && selectedOrder.qrCode.directAppleInstallationUrl ? (
                  // Show Apple installation link
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-purple-300 shadow-sm flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">📱</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Apple eSIM Installation</p>
                        <a 
                          href={selectedOrder.qrCode.directAppleInstallationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-purple-500 text-white text-sm rounded hover:bg-purple-600"
                        >
                          Install eSIM
                        </a>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">✅ Direct Apple Installation Link</p>
                  </div>
                ) : (
                  // Fallback - no QR code available
                  <div className="text-center">
                    <div className="w-64 h-64 mx-auto bg-white p-4 rounded-lg border-2 border-gray-300 shadow-sm">
                      <div className="w-full h-full flex items-center justify-center">
                        <QrCode className="w-32 h-32 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {selectedOrder.qrCode?.fallbackReason?.includes('not available yet') 
                          ? 'QR code is being generated...' 
                          : selectedOrder.qrCode?.fallbackReason || 'No QR code available'}
                      </p>
                      {selectedOrder.qrCode?.canRetry && (
                        <p className="text-xs text-blue-600 mt-1">Click "Generate QR Code" to try again</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Actions Dropdown Menu */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                  >
                    <MoreVertical className="w-4 h-4 mr-2" />
                    Actions
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      {/* Check eSIM Details */}
                      {(selectedOrder.qrCode?.iccid || selectedOrder.iccid) && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleCheckEsimDetails();
                          }}
                          disabled={loadingEsimDetails}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loadingEsimDetails ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-3"></div>
                              <span className="text-green-600">Checking eSIM Details...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-3 text-green-600" />
                              <span className="text-gray-700">Check eSIM Details in API</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Check eSIM Usage */}
                      {(selectedOrder.qrCode?.iccid || selectedOrder.iccid) && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleCheckEsimUsage();
                          }}
                          disabled={loadingEsimUsage}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {loadingEsimUsage ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-3"></div>
                              <span className="text-purple-600">Checking Usage...</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-3 text-purple-600" />
                              <span className="text-gray-700">Check Usage & Status</span>
                            </>
                          )}
                        </button>
                      )}

                      {/* Open in Apple eSIM */}
                      {selectedOrder.qrCode && selectedOrder.qrCode.directAppleInstallationUrl && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            window.open(selectedOrder.qrCode.directAppleInstallationUrl, '_blank', 'noopener,noreferrer');
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <Smartphone className="w-4 h-4 mr-3 text-orange-600" />
                          <span className="text-gray-700">Open in Apple eSIM</span>
                        </button>
                      )}

                      {/* Download QR Code */}
                      {selectedOrder.qrCode && selectedOrder.qrCode.qrCodeUrl && (
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            const link = document.createElement('a');
                            link.href = selectedOrder.qrCode.qrCodeUrl;
                            link.download = `esim-qr-${selectedOrder.orderId || selectedOrder.id}.png`;
                            link.click();
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center"
                        >
                          <Download className="w-4 h-4 mr-3 text-blue-600" />
                          <span className="text-gray-700">Download QR Code</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </motion.div>
        </div>
      )}

      {/* eSIM Details Modal */}
      {esimDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium text-eerie-black">eSIM Details from Airalo API</h3>
                  <button
                    onClick={() => setEsimDetails(null)}
                    className="text-cool-black hover:text-eerie-black transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
            
            <div className="space-y-6">
              {/* Basic eSIM Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">ICCID:</span>
                    <p className="text-gray-900 font-mono">{esimDetails.iccid}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Matching ID:</span>
                    <p className="text-gray-900">{esimDetails.matching_id}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Created At:</span>
                    <p className="text-gray-900">{esimDetails.created_at}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Recycled:</span>
                    <p className="text-gray-900">{esimDetails.recycled ? 'Yes' : 'No'}</p>
                  </div>
                  {esimDetails.recycled_at && (
                    <div>
                      <span className="font-medium text-gray-600">Recycled At:</span>
                      <p className="text-gray-900">{esimDetails.recycled_at}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">QR Code Information</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">QR Code Data:</span>
                    <p className="text-gray-900 font-mono break-all bg-white p-2 rounded border">
                      {esimDetails.qrcode}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">QR Code URL:</span>
                    <p className="text-blue-600 break-all">
                      <a href={esimDetails.qrcode_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {esimDetails.qrcode_url}
                      </a>
                    </p>
                  </div>
                  {esimDetails.direct_apple_installation_url && (
                    <div>
                      <span className="font-medium text-gray-600">Apple Installation URL:</span>
                      <p className="text-blue-600 break-all">
                        <a href={esimDetails.direct_apple_installation_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {esimDetails.direct_apple_installation_url}
                        </a>
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Package Information */}
              {esimDetails.simable && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Package Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Package:</span>
                      <p className="text-gray-900">{esimDetails.simable.package}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Data:</span>
                      <p className="text-gray-900">{esimDetails.simable.data}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Validity:</span>
                      <p className="text-gray-900">{esimDetails.simable.validity} days</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Price:</span>
                      <p className="text-gray-900">{esimDetails.simable.currency} {esimDetails.simable.price}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <p className="text-gray-900">{esimDetails.simable.status?.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">eSIM Type:</span>
                      <p className="text-gray-900">{esimDetails.simable.esim_type}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Information */}
              {esimDetails.simable?.user && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Name:</span>
                      <p className="text-gray-900">{esimDetails.simable.user.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Email:</span>
                      <p className="text-gray-900">{esimDetails.simable.user.email}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Company:</span>
                      <p className="text-gray-900">{esimDetails.simable.user.company}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Created At:</span>
                      <p className="text-gray-900">{esimDetails.simable.user.created_at}</p>
                    </div>
                  </div>
                </div>
              )}

                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </motion.div>
        </div>
      )}

      {/* eSIM Usage Modal */}
      {esimUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="absolute inset-px rounded-xl bg-white"></div>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl">
              <div className="px-8 pt-8 pb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-medium text-eerie-black">eSIM Usage & Status</h3>
                  <button
                    onClick={() => setEsimUsage(null)}
                    className="text-cool-black hover:text-eerie-black transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
            
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Status Overview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <p className={`text-gray-900 font-semibold ${
                      esimUsage.status === 'ACTIVE' ? 'text-green-600' :
                      esimUsage.status === 'EXPIRED' ? 'text-red-600' :
                      esimUsage.status === 'FINISHED' ? 'text-orange-600' :
                      'text-gray-600'
                    }`}>
                      {esimUsage.status}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Unlimited:</span>
                    <p className="text-gray-900">{esimUsage.is_unlimited ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Expires At:</span>
                    <p className="text-gray-900">{esimUsage.expired_at}</p>
                  </div>
                </div>
              </div>

              {/* Data Usage */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Data Usage</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Data:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {esimUsage.is_unlimited ? 'Unlimited' : `${esimUsage.total} MB`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Remaining Data:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {esimUsage.is_unlimited ? 'Unlimited' : `${esimUsage.remaining} MB`}
                    </span>
                  </div>
                  {!esimUsage.is_unlimited && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((esimUsage.total - esimUsage.remaining) / esimUsage.total) * 100}%` 
                        }}
                      ></div>
                    </div>
                  )}
                  {!esimUsage.is_unlimited && (
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((esimUsage.total - esimUsage.remaining) / esimUsage.total) * 100)}% used
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Usage */}
              {esimUsage.total_voice > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Voice Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Voice:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.total_voice} minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Remaining Voice:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.remaining_voice} minutes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((esimUsage.total_voice - esimUsage.remaining_voice) / esimUsage.total_voice) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((esimUsage.total_voice - esimUsage.remaining_voice) / esimUsage.total_voice) * 100)}% used
                    </div>
                  </div>
                </div>
              )}

              {/* Text Usage */}
              {esimUsage.total_text > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Text Usage</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Total Text:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.total_text} SMS</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Remaining Text:</span>
                      <span className="text-sm font-semibold text-gray-900">{esimUsage.remaining_text} SMS</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((esimUsage.total_text - esimUsage.remaining_text) / esimUsage.total_text) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      {Math.round(((esimUsage.total_text - esimUsage.remaining_text) / esimUsage.total_text) * 100)}% used
                    </div>
                  </div>
                </div>
              )}

                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-px rounded-xl shadow-sm ring-1 ring-black/5"></div>
          </motion.div>
        </div>
      )}

      {/* Referral Bottom Sheet */}
      <ReferralBottomSheet 
        isOpen={showReferralSheet} 
        onClose={() => setShowReferralSheet(false)} 
      />
    </div>
  );
};

export default Dashboard;
