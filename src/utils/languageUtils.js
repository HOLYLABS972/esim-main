/**
 * Language utility functions
 */

const supportedLanguages = {
  en: { name: 'English', flag: '🇺🇸', direction: 'ltr' },
  'en-CA': { name: 'English (Canada)', flag: '🇨🇦', direction: 'ltr' },
  es: { name: 'Español', flag: '🇪🇸', direction: 'ltr' },
  'es-ES': { name: 'Español (España)', flag: '🇪🇸', direction: 'ltr' },
  fr: { name: 'Français', flag: '🇫🇷', direction: 'ltr' },
  'fr-CA': { name: 'Français (Canada)', flag: '🇨🇦', direction: 'ltr' },
  'fr-FR': { name: 'Français (France)', flag: '🇫🇷', direction: 'ltr' },
  de: { name: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  'de-DE': { name: 'Deutsch (Deutschland)', flag: '🇩🇪', direction: 'ltr' },
  ar: { name: 'العربية', flag: '🇸🇦', direction: 'rtl' },
  'ar-SA': { name: 'العربية (السعودية)', flag: '🇸🇦', direction: 'rtl' },
  he: { name: 'עברית', flag: '🇮🇱', direction: 'rtl' },
  ru: { name: 'Русский', flag: '🇷🇺', direction: 'ltr' }
};

/**
 * Get language name
 * @param {string} code - Language code
 * @returns {string} - Language name
 */
export function getLanguageName(code) {
  return supportedLanguages[code]?.name || 'English';
}

/**
 * Get language flag emoji
 * @param {string} code - Language code
 * @returns {string} - Flag emoji
 */
export function getLanguageFlag(code) {
  return supportedLanguages[code]?.flag || '🇺🇸';
}

/**
 * Get text direction for a language
 * @param {string} code - Language code
 * @returns {string} - 'rtl' or 'ltr'
 */
export function getLanguageDirection(code) {
  return supportedLanguages[code]?.direction || 'ltr';
}

/**
 * Detect language from URL pathname
 * @param {string} pathname - URL pathname
 * @returns {string|null} - Language code or null
 */
export function detectLanguageFromPath(pathname) {
  if (!pathname) return null;

  const firstSegment = pathname.split('/').filter(Boolean)[0];
  if (!firstSegment) return null;

  const localeToLanguage = {
    en: 'en',
    'en-US': 'en',
    'en-CA': 'en',
    ar: 'ar',
    'ar-SA': 'ar',
    he: 'he',
    ru: 'ru',
    de: 'de',
    'de-DE': 'de',
    fr: 'fr',
    'fr-FR': 'fr',
    'fr-CA': 'fr',
    es: 'es',
    'es-ES': 'es',
    id: 'en',
    ja: 'en',
    'pt-BR': 'en',
    tr: 'en',
    uk: 'en',
    vi: 'en',
    'zh-Hans': 'en',
    hebrew: 'he',
    arabic: 'ar',
    russian: 'ru',
    german: 'de',
    french: 'fr',
    spanish: 'es',
  };

  return localeToLanguage[firstSegment] || null;
}
