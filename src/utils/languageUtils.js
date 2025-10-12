// Language detection and utilities for blog localization

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' }
];

export const supportedLanguageCodes = supportedLanguages.map(lang => lang.code);

/**
 * Domain to language mapping
 * Maps domains to their default language
 */
export const domainLanguageMap = {
  'ru.roamjet.net': 'ru',
  'esim.roamjet.net': 'en',
  'www.roamjet.net': 'en',
  'roamjet.net': 'en',
  // Add more domains as needed
  'ar.roamjet.net': 'ar',
  'he.roamjet.net': 'he',
  'de.roamjet.net': 'de',
  'fr.roamjet.net': 'fr',
  'es.roamjet.net': 'es',
};

/**
 * Detect language from domain
 * @param {string} hostname - Domain hostname (e.g., 'ru.roamjet.net')
 * @returns {string|null} - Language code or null if not found
 */
export const detectLanguageFromDomain = (hostname) => {
  if (!hostname) return null;
  
  // Remove www. prefix if present for matching
  const cleanHostname = hostname.replace(/^www\./, '');
  
  // Check direct match first
  if (domainLanguageMap[hostname]) {
    return domainLanguageMap[hostname];
  }
  
  // Check cleaned hostname
  if (domainLanguageMap[cleanHostname]) {
    return domainLanguageMap[cleanHostname];
  }
  
  // Extract subdomain and check if it's a language code
  const subdomain = hostname.split('.')[0];
  if (supportedLanguageCodes.includes(subdomain)) {
    return subdomain;
  }
  
  return null;
};

/**
 * Language to domain mapping (reverse of domainLanguageMap)
 */
export const languageToDomainMap = {
  'en': 'esim.roamjet.net',
  'ru': 'ru.roamjet.net',
  'ar': 'ar.roamjet.net',
  'he': 'he.roamjet.net',
  'de': 'de.roamjet.net',
  'fr': 'fr.roamjet.net',
  'es': 'es.roamjet.net'
};

/**
 * Get domain for a language code
 * @param {string} languageCode - Language code (e.g., 'ru', 'en')
 * @returns {string} - Domain for that language
 */
export const getDomainForLanguage = (languageCode) => {
  return languageToDomainMap[languageCode] || languageToDomainMap['en'];
};

/**
 * Build cross-domain URL for language switch
 * @param {string} languageCode - Target language code
 * @param {string} currentPath - Current path (will be cleaned of language prefixes)
 * @param {string} protocol - Protocol (http: or https:), defaults to https:
 * @returns {string} - Full URL with domain and path
 */
export const buildLanguageDomainUrl = (languageCode, currentPath = '/', protocol = 'https:') => {
  const targetDomain = getDomainForLanguage(languageCode);
  
  // Clean the path - remove language prefixes
  let cleanPath = currentPath;
  const languagePrefixes = ['/he', '/ar', '/ru', '/de', '/fr', '/es', '/hebrew', '/arabic', '/russian', '/german', '/french', '/spanish'];
  
  for (const prefix of languagePrefixes) {
    if (cleanPath.startsWith(prefix)) {
      cleanPath = cleanPath.substring(prefix.length) || '/';
      break;
    }
  }
  
  // Ensure cleanPath starts with /
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }
  
  return `${protocol}//${targetDomain}${cleanPath}`;
};

/**
 * Detect current language from URL path
 * @param {string} pathname - Current pathname (e.g., '/es/blog', '/blog', '/fr/blog/post-slug')
 * @returns {string} - Language code (e.g., 'es', 'en', 'fr')
 */
export const detectLanguageFromPath = (pathname) => {
  if (!pathname) return 'en';
  
  // Remove leading slash and split path
  const pathSegments = pathname.replace(/^\//, '').split('/');
  const firstSegment = pathSegments[0];
  
  // Check if first segment matches a language code directly
  if (supportedLanguageCodes.includes(firstSegment)) {
    return firstSegment;
  }
  
  // Check if first segment matches old language route names (for backward compatibility)
  const languageRoutes = {
    'spanish': 'es',
    'french': 'fr', 
    'german': 'de',
    'arabic': 'ar',
    'hebrew': 'he',
    'russian': 'ru'
  };
  
  return languageRoutes[firstSegment] || 'en';
};

/**
 * Get language name from code
 * @param {string} code - Language code
 * @returns {string} - Language name
 */
export const getLanguageName = (code) => {
  const language = supportedLanguages.find(lang => lang.code === code);
  return language ? language.name : 'English';
};

/**
 * Get language flag from code
 * @param {string} code - Language code
 * @returns {string} - Language flag emoji
 */
export const getLanguageFlag = (code) => {
  const language = supportedLanguages.find(lang => lang.code === code);
  return language ? language.flag : '🇺🇸';
};

/**
 * Get text direction for language
 * @param {string} code - Language code
 * @returns {string} - 'rtl' or 'ltr'
 */
export const getLanguageDirection = (code) => {
  const rtlLanguages = ['ar', 'he']; // Arabic and Hebrew are RTL
  return rtlLanguages.includes(code) ? 'rtl' : 'ltr';
};

/**
 * Generate localized blog URL
 * @param {string} slug - Blog post slug
 * @param {string} language - Language code
 * @returns {string} - Localized URL
 */
export const getLocalizedBlogUrl = (slug, language = 'en') => {
  if (language === 'en') {
    return `/blog/${slug}`;
  }
  
  // Use language codes directly in URLs
  if (supportedLanguageCodes.includes(language)) {
    return `/${language}/blog/${slug}`;
  }
  
  return `/blog/${slug}`;
};

/**
 * Generate localized blog list URL
 * @param {string} language - Language code
 * @returns {string} - Localized blog list URL
 */
export const getLocalizedBlogListUrl = (language = 'en') => {
  if (language === 'en') {
    return '/blog';
  }
  
  // Use language codes directly in URLs
  if (supportedLanguageCodes.includes(language)) {
    return `/${language}/blog`;
  }
  
  return '/blog';
};