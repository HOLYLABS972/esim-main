export const RTL_LANGUAGES = ['ar', 'he'];

export const isRTL = (locale) => {
  return RTL_LANGUAGES.includes(locale);
};

export const getLanguageDirection = (locale) => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};

export const getLanguageName = (locale) => {
  const languageNames = {
    en: 'English',
    he: 'עברית',
    ru: 'Русский',
    ar: 'العربية',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español'
  };
  
  return languageNames[locale] || 'English';
};

export const getLanguageFlag = (locale) => {
  const flags = {
    en: '🇺🇸',
    he: '🇮🇱',
    ru: '🇷🇺',
    ar: '🇸🇦',
    de: '🇩🇪',
    fr: '🇫🇷',
    es: '🇪🇸'
  };
  
  return flags[locale] || '🇺🇸';
};
