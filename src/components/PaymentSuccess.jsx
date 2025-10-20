'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { processTransactionCommission } from '../services/referralService';
import { apiService } from '../services/apiService';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);
  const hasProcessed = useRef(false);

  // Check if link has been used and mark it as used
  const checkAndMarkLinkUsed = async (orderId, userId) => {
    try {
      const orderRef = doc(db, 'users', userId, 'esims', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (orderDoc.exists()) {
        const orderData = orderDoc.data();
        if (orderData.linkUsed) {
          return { linkUsed: true, message: 'This payment link has already been used.' };
        }
        if (orderData.processingStatus === 'processing') {
          return { alreadyProcessing: true, message: 'Order is already being processed.' };
        }
        if (orderData.processingStatus === 'completed') {
          return { alreadyCompleted: true, message: 'Order already completed.' };
        }
      }
      
      // Mark link as used immediately with atomic operation
      await setDoc(orderRef, {
        linkUsed: true,
        linkUsedAt: serverTimestamp(),
        processingStatus: 'processing',
        processingStartedAt: serverTimestamp(),
        // Add a unique processing key to prevent race conditions
        processingKey: `${userId}_${orderId}_${Date.now()}`
      }, { merge: true });
      
      return { canProcess: true };
    } catch (error) {
      return { error: error.message };
    }
  };

  // Create order record in Firebase and process with RoamJet API
  const createOrderRecord = async (orderData) => {
    try {
      console.log('🛒 Creating RoamJet order...');
      
      // Extract country info from plan name (e.g., "kargi-mobile-7days-1gb" -> "kargi")
      const getCountryFromPlan = (planId) => {
        if (!planId) return { code: "US", name: "United States" };

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
      
      const countryInfo = getCountryFromPlan(orderData.planId);
      const orderRef = doc(db, 'users', currentUser.uid, 'esims', orderData.orderId);
      
      // Step 1: Create order via Python API
      console.log('📞 Creating eSIM order with package ID:', orderData.planId);
      const airaloOrderResult = await apiService.createOrder({
        package_id: orderData.planId,
        quantity: "1",
        to_email: orderData.customerEmail,
        description: `eSIM order for ${orderData.customerEmail}`
      });
      
      console.log('✅ Order created:', airaloOrderResult);

      // Step 2: Save order to Firebase with both order ID reference
      await setDoc(doc(db, 'orders', orderData.orderId), {
        orderId: orderData.orderId,
        airaloOrderId: airaloOrderResult.airaloOrderId,
        userId: currentUser.uid,
        planId: orderData.planId,
        planName: orderData.planName,
        amount: orderData.amount,
        currency: orderData.currency,
        customerEmail: orderData.customerEmail,
        status: 'active',
        createdAt: serverTimestamp(),
        airaloOrderData: airaloOrderResult.orderData
      });

      // Step 3: Create initial eSIM record in user's collection
      const esimData = {
        activationDate: null,
        capacity: 13,
        countryCode: countryInfo.code,
        countryName: countryInfo.name,
        createdAt: serverTimestamp(),
        currency: orderData.currency || "USD",
        errorMessage: null,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        iccid: "",
        
        operator: {
          name: "eSIM Provider",
          slug: "esim_provider"
        },
        
        orderResult: {
          activationCode: "",
          confirmationCode: "",
          createdAt: new Date().toISOString(),
          iccid: "",
          isDemo: false,
          orderId: orderData.orderId,
          planId: orderData.planId,
          planName: orderData.planName,
          provider: "airalo",
          qrCode: "",
          smdpAddress: "",
          status: "active",
          success: true,
          validUntil: null
        },
        
        period: 365,
        planId: orderData.planId,
        planName: orderData.planName,
        price: orderData.amount,
        purchaseDate: serverTimestamp(),
        qrCode: "",
        status: "active",
        updatedAt: serverTimestamp(),
        processingStatus: 'completed',
        completedAt: serverTimestamp(),
        airaloOrderId: airaloOrderResult.airaloOrderId,
        airaloOrderData: airaloOrderResult.orderData,
        // Preserve the existing processing key
        processingKey: `${currentUser.uid}_${orderData.orderId}_${Date.now()}`
      };
      
      await setDoc(orderRef, esimData, { merge: true });

      // Step 4: Try to get QR code immediately via RoamJet API (might not be ready yet)
      try {
        console.log('🔄 Attempting to retrieve QR code for order:', orderData.orderId);
        const qrResult = await apiService.getQrCode(orderData.orderId);
        
        if (qrResult.success && qrResult.qrCode) {
          console.log('✅ QR code retrieved immediately:', qrResult);
          
          // Update the eSIM record with QR code data
          await setDoc(orderRef, {
            status: 'active',
            qrCode: qrResult.qrCode,
            activationCode: qrResult.activationCode,
            iccid: qrResult.iccid,
            directAppleInstallationUrl: qrResult.directAppleInstallationUrl,
            qrCodeUrl: qrResult.qrCodeUrl,
            lpa: qrResult.lpa,
            smdpAddress: qrResult.smdpAddress,
            orderResult: {
              ...esimData.orderResult,
              qrCode: qrResult.qrCode,
              activationCode: qrResult.activationCode,
              iccid: qrResult.iccid,
              status: 'active',
              updatedAt: new Date().toISOString()
            },
            processingStatus: 'completed',
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        } else {
          console.log('⏳ QR code not ready yet, will be available later');
        }
      } catch (qrError) {
        console.log('⏳ QR code not ready yet:', qrError.message);
        // This is expected - QR code might not be ready immediately
      }

      return { success: true, orderId: orderData.orderId, remoteOrderId: airaloOrderResult.airaloOrderId };
      
    } catch (error) {
      console.error('❌ Order creation failed:', error);
      throw error;
    }
  };

  // Process payment success
  const handlePaymentSuccess = useCallback(async () => {
    try {
      const orderParam = searchParams.get('order_id') || searchParams.get('order');
      const planId = searchParams.get('plan_id');
      const email = searchParams.get('email');
      const total = searchParams.get('total');
      const name = searchParams.get('name');
      const currency = searchParams.get('currency');
      // const order_id = searchParams.get('order_id');
      
      if (!orderParam || !email || !total) {
        setError('Missing payment information.');
        return;
      }

      // Check if link already used
      const linkCheck = await checkAndMarkLinkUsed(orderParam, currentUser.uid);
      
      if (linkCheck.error) {
        setError('Error checking payment link.');
        return;
      }
      
      if (linkCheck.linkUsed) {
        setError(linkCheck.message);
        return;
      }
      
      if (linkCheck.alreadyProcessing) {
        setError(linkCheck.message);
        return;
      }
      
      if (linkCheck.alreadyCompleted) {
        setError(linkCheck.message);
        return;
      }

      // Prepare order data - use orderParam as the consistent orderId
      const orderData = {
        planId: planId || orderParam,
        planName: decodeURIComponent(name || 'eSIM Plan'),
        amount: Math.round(parseFloat(total || 0)),
        currency: currency || 'usd',
        customerEmail: email,
        customerId: currentUser.uid,
        orderId: orderParam, // Use the order parameter as the consistent ID
        userId: currentUser.uid
      };

      // Create order record
      const orderResult = await createOrderRecord(orderData);
      
      if (orderResult.success) {
        // Process referral commission (this also updates referral usage stats)
        try {
          console.log('💰 Processing referral commission for user:', currentUser.uid);
          console.log('💰 Commission data:', {
            userId: currentUser.uid,
            amount: orderData.amount,
            transactionId: orderResult.orderId,
            planId: orderData.planId,
            planName: orderData.planName
          });
          console.log('💰 Expected commission percentage from settings should be 1%');
          
          const commissionResult = await processTransactionCommission({
            userId: currentUser.uid,
            amount: orderData.amount,
            transactionId: orderResult.orderId,
            planId: orderData.planId,
            planName: orderData.planName
          });

          console.log('💰 Commission result:', commissionResult);
          console.log('💰 Commission result details:', {
            success: commissionResult.success,
            commission: commissionResult.commission,
            referrerId: commissionResult.referrerId,
            referralCode: commissionResult.referralCode,
            commissionId: commissionResult.commissionId
          });

          if (commissionResult.success && commissionResult.commission > 0) {
            console.log(`✅ Referral commission processed: $${commissionResult.commission.toFixed(2)} for referrer ${commissionResult.referrerId}`);
            console.log('📊 Referral usage stats updated');
            
            // Calculate commission percentage
            const commissionPercentage = ((commissionResult.commission / orderData.amount) * 100).toFixed(1);
            
            // Get referrer's email for better display
            let referrerDisplay = commissionResult.referrerId;
            try {
              const referrerDoc = await getDoc(doc(db, 'users', commissionResult.referrerId));
              if (referrerDoc.exists()) {
                const referrerData = referrerDoc.data();
                referrerDisplay = referrerData.email || commissionResult.referrerId;
              }
            } catch {
              console.log('Could not fetch referrer email, using UID');
            }
            
            // Display detailed commission information in snack notification
            toast.success(
              `💰 Commission: ${commissionPercentage}% ($${commissionResult.commission.toFixed(2)}) credited to ${referrerDisplay} via code ${commissionResult.referralCode || 'unknown'}`,
              {
                duration: 6000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '500',
                  maxWidth: '450px',
                },
              }
            );
          } else if (commissionResult.success) {
            console.log('ℹ️ No referral commission (user did not use referral code)');
            toast.info('ℹ️ No referral code used - no commission earned', {
              duration: 3000,
              style: {
                background: '#3B82F6',
                color: '#fff',
              },
            });
          } else {
            console.error('❌ Referral commission processing failed:', commissionResult.error);
            toast.error(`❌ Commission processing failed: ${commissionResult.error}`, {
              duration: 4000,
              style: {
                background: '#EF4444',
                color: '#fff',
              },
            });
          }
        } catch (commissionError) {
          console.error('❌ Commission processing failed:', commissionError);
          toast.error(`⚠️ Commission processing failed: ${commissionError.message}`, {
            duration: 4000,
            style: {
              background: '#EF4444',
              color: '#fff',
            },
          });
        }

        toast.success('Payment successful! Redirecting to dashboard...');
        
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
      
    } catch (err) {
      console.error('❌ Payment processing failed:', err);
      setError('Error processing payment. Please contact support.');
    } finally {
      setProcessing(false);
    }
  }, [currentUser, searchParams, checkAndMarkLinkUsed, createOrderRecord, router]);

  useEffect(() => {
    if (currentUser && !hasProcessed.current) {
      hasProcessed.current = true;
      handlePaymentSuccess();
    }
  }, [currentUser, handlePaymentSuccess]);

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="text-8xl text-red-500 mb-4">✕</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 text-lg">{error}</p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🎉 Payment Successful!
        </h2>
        <p className="text-gray-600 mb-6">
          Your payment has been processed successfully. Redirecting to dashboard...
        </p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
