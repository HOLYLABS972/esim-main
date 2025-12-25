// Comprehensive country flag and code mapping - matches mobile app logic
// This utility provides flag emojis and country code resolution

// Comprehensive flag mapping - matches mobile app
const flagMap = {
  // Major countries
  'US': '🇺🇸', 'CA': '🇨🇦', 'MX': '🇲🇽', 'BR': '🇧🇷',
  'GB': '🇬🇧', 'IE': '🇮🇪', 'FR': '🇫🇷', 'DE': '🇩🇪',
  'IT': '🇮🇹', 'ES': '🇪🇸', 'PT': '🇵🇹', 'NL': '🇳🇱',
  'BE': '🇧🇪', 'CH': '🇨🇭', 'AT': '🇦🇹', 'DK': '🇩🇰',
  'SE': '🇸🇪', 'NO': '🇳🇴', 'FI': '🇫🇮', 'IS': '🇮🇸',

  // Eastern Europe
  'PL': '🇵🇱', 'CZ': '🇨🇿', 'SK': '🇸🇰', 'HU': '🇭🇺',
  'RO': '🇷🇴', 'BG': '🇧🇬', 'HR': '🇭🇷', 'SI': '🇸🇮',
  'EE': '🇪🇪', 'LV': '🇱🇻', 'LT': '🇱🇹', 'UA': '🇺🇦',
  'RU': '🇷🇺', 'BY': '🇧🇾', 'MD': '🇲🇩',

  // Asia Pacific
  'JP': '🇯🇵', 'KR': '🇰🇷', 'CN': '🇨🇳', 'HK': '🇭🇰',
  'TW': '🇹🇼', 'SG': '🇸🇬', 'MY': '🇲🇾', 'TH': '🇹🇭',
  'VN': '🇻🇳', 'PH': '🇵🇭', 'ID': '🇮🇩', 'IN': '🇮🇳',
  'AU': '🇦🇺', 'NZ': '🇳🇿', 'MO': '🇲🇴',

  // Middle East & Africa
  'AE': '🇦🇪', 'SA': '🇸🇦', 'QA': '🇶🇦', 'KW': '🇰🇼',
  'OM': '🇴🇲', 'BH': '🇧🇭', 'IL': '🇮🇱', 'JO': '🇯🇴',
  'LB': '🇱🇧', 'TR': '🇹🇷', 'EG': '🇪🇬', 'ZA': '🇿🇦',
  'NG': '🇳🇬', 'KE': '🇰🇪', 'MA': '🇲🇦', 'TN': '🇹🇳',

  // Other European
  'GR': '🇬🇷', 'CY': '🇨🇾', 'MT': '🇲🇹', 'LU': '🇱🇺',
  'MC': '🇲🇨', 'AD': '🇦🇩', 'SM': '🇸🇲', 'VA': '🇻🇦',
  'LI': '🇱🇮', 'RS': '🇷🇸', 'ME': '🇲🇪', 'BA': '🇧🇦',
  'MK': '🇲🇰', 'AL': '🇦🇱',

  // Americas
  'AR': '🇦🇷', 'CL': '🇨🇱', 'CO': '🇨🇴', 'PE': '🇵🇪',
  'UY': '🇺🇾', 'EC': '🇪🇨', 'BO': '🇧🇴', 'PY': '🇵🇾',
  'VE': '🇻🇪', 'CR': '🇨🇷', 'PA': '🇵🇦', 'GT': '🇬🇹',
  'SV': '🇸🇻', 'HN': '🇭🇳', 'NI': '🇳🇮', 'BZ': '🇧🇿',
  'JM': '🇯🇲', 'DO': '🇩🇴', 'HT': '🇭🇹', 'TT': '🇹🇹',
  'BB': '🇧🇧', 'GD': '🇬🇩', 'LC': '🇱🇨', 'VC': '🇻🇨',
  'AG': '🇦🇬', 'DM': '🇩🇲', 'KN': '🇰🇳', 'BS': '🇧🇸',

  // Regional/Global
  'GL': '🌍', 'RG': '🗺️', 'GLOBAL': '🌍', 'REGIONAL': '🗺️',
  'EUROPE': '🇪🇺', 'ASIA': '🌏', 'AMERICA': '🌎',
};

// Operator slug to country code mapping - matches mobile app logic
export const operatorCountryMap = {
  // Germany
  'hallo-mobil': { code: 'DE', name: 'Germany' },
  'hallo-mobile': { code: 'DE', name: 'Germany' },
  'hallo mobil': { code: 'DE', name: 'Germany' }, // Add space variant for plan name matching

  // Egypt
  'giza-mobile': { code: 'EG', name: 'Egypt' },
  'nile-mobile': { code: 'EG', name: 'Egypt' },

  // UAE
  'roamify': { code: 'AE', name: 'United Arab Emirates' },
  'burj-mobile': { code: 'AE', name: 'United Arab Emirates' },

  // Turkey
  'turk-telecom': { code: 'TR', name: 'Turkey' },
  'merhaba': { code: 'TR', name: 'Turkey' },

  // USA
  'change': { code: 'US', name: 'United States' },

  // Georgia
  'kargi': { code: 'GE', name: 'Georgia' },

  // Add more operators as needed
  'yes-go': { code: 'AU', name: 'Australia' },
  'canada-mobile': { code: 'CA', name: 'Canada' },
  'uki-mobile': { code: 'GB', name: 'United Kingdom' },
  'elan': { code: 'FR', name: 'France' },
  'mamma-mia': { code: 'IT', name: 'Italy' },
  'guay-mobile': { code: 'ES', name: 'Spain' },
  'portugal-mobile': { code: 'PT', name: 'Portugal' },
  'netherlands-mobile': { code: 'NL', name: 'Netherlands' },
  'moshi-moshi': { code: 'JP', name: 'Japan' },
  'jang': { code: 'KR', name: 'South Korea' },
  'connect-lah': { code: 'SG', name: 'Singapore' },
  'ahava': { code: 'IL', name: 'Israel' },
  'red-sand': { code: 'SA', name: 'Saudi Arabia' },
};

// Country name to code mapping - matches mobile app
const nameToCodeMap = {
  'ecuador': 'EC',
  'united states': 'US',
  'usa': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'germany': 'DE',
  'france': 'FR',
  'spain': 'ES',
  'italy': 'IT',
  'canada': 'CA',
  'brazil': 'BR',
  'argentina': 'AR',
  'chile': 'CL',
  'colombia': 'CO',
  'peru': 'PE',
  'uruguay': 'UY',
  'bolivia': 'BO',
  'paraguay': 'PY',
  'venezuela': 'VE',
  'mexico': 'MX',
  'japan': 'JP',
  'south korea': 'KR',
  'korea': 'KR',
  'china': 'CN',
  'india': 'IN',
  'australia': 'AU',
  'new zealand': 'NZ',
  'south africa': 'ZA',
  'egypt': 'EG',
  'israel': 'IL',
  'turkey': 'TR',
  'russia': 'RU',
  'ukraine': 'UA',
};

/**
 * Get country code from operator slug (package_id)
 * Example: "hallo-mobil-7days-1gb" -> "hallo-mobil" -> { code: "DE", name: "Germany" }
 */
export const getCountryFromOperator = (operatorSlug) => {
  if (!operatorSlug) return null;
  
  // Normalize to lowercase for matching
  const normalizedSlug = operatorSlug.toLowerCase().trim();
  
  // Try full match first (handles exact matches like "hallo-mobil")
  if (operatorCountryMap[normalizedSlug]) {
    return operatorCountryMap[normalizedSlug];
  }
  
  // Extract operator from package_id (first two parts before numbers/days)
  // e.g., "hallo-mobil-7days-1gb" -> "hallo-mobil"
  const parts = normalizedSlug.split('-');
  if (parts.length >= 2) {
    const operatorKey = `${parts[0]}-${parts[1]}`;
    if (operatorCountryMap[operatorKey]) {
      return operatorCountryMap[operatorKey];
    }
  }
  
  // Try just the first part (for single-word operators)
  if (parts.length >= 1 && operatorCountryMap[parts[0]]) {
    return operatorCountryMap[parts[0]];
  }
  
  return null;
};

/**
 * Get country code from country name
 */
export const getCountryCodeFromName = (countryName) => {
  if (!countryName) return null;
  
  const normalizedName = countryName.toLowerCase().trim();
  return nameToCodeMap[normalizedName] || null;
};

/**
 * Get flag emoji from country code
 * Matches mobile app logic exactly
 */
export const getFlagEmoji = (countryCode, planName = '', orderSlug = '') => {
  if (!countryCode) return '🌍';
  
  // Normalize country code
  const normalizedCode = countryCode.toUpperCase().trim();
  if (normalizedCode.length === 0) return '🌍';
  
  // Handle special cases like PT-MA, multi-region codes, etc.
  if (normalizedCode.includes('-') || normalizedCode.length > 2) {
    // Check if it's a known multi-region code
    if (flagMap[normalizedCode]) {
      return flagMap[normalizedCode];
    }
    return '🌍';
  }
  
  // Check if plan name or slug indicates global/regional
  const planNameLower = planName.toLowerCase();
  const orderSlugLower = orderSlug.toLowerCase();
  
  // Detect global/regional from plan name or slug if country code doesn't match
  if (!flagMap[normalizedCode]) {
    if (planNameLower.includes('global') || orderSlugLower.includes('global') || 
        planNameLower.includes('discover') || orderSlugLower.includes('discover')) {
      return '🌍'; // Global icon
    } else if (planNameLower.includes('regional') || orderSlugLower.includes('regional')) {
      return '🗺️'; // Regional icon
    }
  }
  
  return flagMap[normalizedCode] || '🌍';
};

/**
 * Extract coverage from HTML text (qrcode_installation or manual_installation)
 */
const extractCoverageFromHTML = (htmlText) => {
  if (!htmlText) return null;
  
  // Match "Coverage: Germany" or similar patterns
  const coverageMatch = htmlText.match(/<b>Coverage:\s*<\/b>([^<]+)/i) || 
                       htmlText.match(/Coverage:\s*([^<\n]+)/i);
  
  if (coverageMatch && coverageMatch[1]) {
    return coverageMatch[1].trim();
  }
  
  return null;
};

/**
 * Extract country info from esimData object
 * Handles various data structures from Firebase
 */
export const extractCountryInfo = (esimData) => {
  if (!esimData) {
    return { countryCode: null, countryName: null, flagEmoji: '🌍' };
  }
  
  let countryCode = esimData?.countryCode || esimData?.orderResult?.countryCode;
  let countryName = esimData?.countryName || esimData?.orderResult?.countryName;
  
  // Get package_id from multiple possible locations (check top level first, then nested)
  // IMPORTANT: Check the actual data structure - package_id might be at root level
  const packageId = esimData?.package_id || 
                   esimData?.planId || 
                   esimData?.esimData?.package_id ||
                   esimData?.airaloOrderData?.package_id ||
                   (esimData?.esimData?.id ? String(esimData.esimData.id) : '') ||
                   '';
  
  // Get plan name from multiple locations
  const planName = esimData?.planName || 
                  esimData?.package || 
                  esimData?.esimData?.package || 
                  '';
  
  console.log('🔍 extractCountryInfo - Input:', {
    hasPackageId: !!packageId,
    packageId: packageId,
    hasPlanName: !!planName,
    planName: planName,
    hasEsimData: !!esimData?.esimData,
    topLevelKeys: Object.keys(esimData || {}).slice(0, 10),
    esimDataKeys: esimData?.esimData ? Object.keys(esimData.esimData).slice(0, 10) : [],
    currentCountryCode: countryCode,
    currentCountryName: countryName
  });
  
  // Try to extract from package_id if country code is missing or invalid
  if (!countryCode || countryCode === 'US' || countryCode === 'Unknown' || countryCode === '') {
    if (packageId && packageId.length > 0) {
      // Extract operator slug from package_id (e.g., "hallo-mobil-7days-1gb" -> "hallo-mobil")
      const parts = packageId.split('-');
      const operatorSlug = parts.length >= 2 ? `${parts[0]}-${parts[1]}` : parts[0];
      console.log('🔍 Extracting from package_id:', packageId, '-> operator:', operatorSlug, 'parts:', parts);
      const countryInfo = getCountryFromOperator(operatorSlug);
      
      if (countryInfo) {
        countryCode = countryInfo.code;
        countryName = countryInfo.name;
        console.log('✅ Found country from operator:', countryInfo);
      } else {
        console.log('⚠️ No country found for operator:', operatorSlug, 'Available operators:', Object.keys(operatorCountryMap).slice(0, 10));
      }
    } else {
      console.log('⚠️ No package_id found in data');
    }
  }
  
  // Try to extract from coverage in esimData.esimData (nested structure)
  if (!countryCode && esimData?.esimData) {
    // Try direct coverage field
    let coverage = esimData.esimData.coverage;
    
    // Try to extract from HTML installation guides
    if (!coverage) {
      coverage = extractCoverageFromHTML(esimData.esimData.qrcode_installation) ||
                 extractCoverageFromHTML(esimData.esimData.manual_installation);
      console.log('🔍 Extracted coverage from HTML:', coverage);
    }
    
    // Try from package field in esimData
    if (!coverage && esimData.esimData.package) {
      // Package might be "Hallo! Mobil-1 GB - 7 Days" - try to extract country
      const packageName = esimData.esimData.package;
      // Try to match operator from package name
      const packageNameLower = packageName.toLowerCase().replace(/[!.,]/g, ''); // Remove punctuation
      // Check if package name contains known operator names
      for (const [operator, countryInfo] of Object.entries(operatorCountryMap)) {
        const operatorNormalized = operator.replace(/-/g, ' '); // "hallo-mobil" -> "hallo mobil"
        const operatorHyphen = operator; // "hallo-mobil"
        
        // Check if package name includes operator (with space or hyphen)
        if (packageNameLower.includes(operatorNormalized) || 
            packageNameLower.includes(operatorHyphen) ||
            packageNameLower.startsWith(operatorNormalized.split(' ')[0])) { // "hallo"
          countryCode = countryInfo.code;
          countryName = countryInfo.name;
          console.log('✅ Found country from package name:', { packageName, operator, countryInfo });
          break;
        }
      }
    }
    
    if (coverage && !countryCode) {
      const coverageCode = getCountryCodeFromName(coverage.trim());
      if (coverageCode) {
        countryCode = coverageCode;
        countryName = coverage.trim();
        console.log('✅ Found country from coverage:', { code: coverageCode, name: coverage.trim() });
      }
    }
  }
  
  // Try to derive from country name if we have name but no code
  if (!countryCode && countryName) {
    countryCode = getCountryCodeFromName(countryName);
    if (countryCode) {
      console.log('✅ Derived code from name:', countryName, '->', countryCode);
    }
  }
  
  const result = {
    countryCode: countryCode || null,
    countryName: countryName || null,
    flagEmoji: getFlagEmoji(countryCode, planName, packageId)
  };
  
  console.log('🔍 extractCountryInfo - Result:', result);
  
  return result;
};

/**
 * Get flag emoji for an order/esim object
 * This is the main function to use in components
 */
export const getOrderFlag = (order) => {
  const countryInfo = extractCountryInfo(order);
  return countryInfo.flagEmoji || '🌍';
};

/**
 * Get country code for an order/esim object
 */
export const getOrderCountryCode = (order) => {
  const countryInfo = extractCountryInfo(order);
  return countryInfo.countryCode || null;
};

/**
 * Get country name for an order/esim object
 */
export const getOrderCountryName = (order) => {
  const countryInfo = extractCountryInfo(order);
  return countryInfo.countryName || null;
};

