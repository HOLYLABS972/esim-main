/**
 * Language utility functions
 */

const supportedLanguages = {
  en: { name: 'English', flag: '🇺🇸', direction: 'ltr' },
  es: { name: 'Español', flag: '🇪🇸', direction: 'ltr' },
  fr: { name: 'Français', flag: '🇫🇷', direction: 'ltr' },
  de: { name: 'Deutsch', flag: '🇩🇪', direction: 'ltr' },
  ar: { name: 'العربية', flag: '🇸🇦', direction: 'rtl' },
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

  const languageCodes = ['ar', 'he', 'ru', 'de', 'fr', 'es'];

  for (const code of languageCodes) {
    if (pathname.startsWith(`/${code}/`) || pathname === `/${code}`) {
      return code;
    }
  }

  return null;
}
