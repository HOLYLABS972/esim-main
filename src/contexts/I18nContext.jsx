'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const I18nContext = createContext();

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    // Return a fallback context instead of throwing an error
    return {
      locale: 'en',
      t: (key, fallback, variables) => {
        let result = fallback || key;
        // Handle interpolation even in fallback
        if (typeof result === 'string' && variables && typeof variables === 'object') {
          Object.keys(variables).forEach(varKey => {
            const placeholder = `{{${varKey}}}`;
            result = result.replace(new RegExp(placeholder, 'g'), variables[varKey]);
          });
        }
        return result;
      },
      translations: {},
      isLoading: false,
      changeLanguage: async () => {}, // Add fallback changeLanguage function
    };
  }
  return context;
};

export const I18nProvider = ({ children }) => {
  const pathname = usePathname();
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const localeAliasToBase = {
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

  const detectLocaleFromPath = (currentPath) => {
    const firstSegment = currentPath?.split('/').filter(Boolean)[0];
    if (!firstSegment) return 'en';
    return localeAliasToBase[firstSegment] || 'en';
  };

  const normalizeLocale = (value) => localeAliasToBase[value] || 'en';

  // Initialize locale and translations on mount
  useEffect(() => {
    const initializeLocale = async () => {
      console.log('I18nContext: Initializing locale...');
      
      // Get domain-based language detection
      const detectDomainLanguage = () => {
        if (typeof window === 'undefined') return null;
        const hostname = window.location.hostname;
        
        const domainLanguageMap = {
          'ru.roamjet.net': 'ru',
          'esim.roamjet.net': 'en',
          'www.roamjet.net': 'en',
          'roamjet.net': 'en',
          'ar.roamjet.net': 'ar',
          'he.roamjet.net': 'he',
          'de.roamjet.net': 'de',
          'fr.roamjet.net': 'fr',
          'es.roamjet.net': 'es',
        };
        
        // Check direct match
        if (domainLanguageMap[hostname]) {
          return domainLanguageMap[hostname];
        }
        
        // Check without www.
        const cleanHostname = hostname.replace(/^www\./, '');
        if (domainLanguageMap[cleanHostname]) {
          return domainLanguageMap[cleanHostname];
        }
        
        // Extract subdomain
        const subdomain = hostname.split('.')[0];
        const supportedLanguageCodes = ['en', 'es', 'fr', 'de', 'ar', 'he', 'ru'];
        if (supportedLanguageCodes.includes(subdomain)) {
          return subdomain;
        }
        
        return null;
      };
      
      const domainLanguage = detectDomainLanguage();
      console.log('I18nContext: Domain language detected:', domainLanguage);
      
      // First, check for saved language in localStorage, then cookies
      let savedLanguage = localStorage.getItem('roamjet-language');
      
      // If not in localStorage, check cookies as backup
      if (!savedLanguage && typeof window !== 'undefined' && window.getLanguageFromCookie) {
        savedLanguage = window.getLanguageFromCookie();
        if (savedLanguage) {
          // Sync back to localStorage
          localStorage.setItem('roamjet-language', savedLanguage);
        }
      }
      
      const pathLocale = detectLocaleFromPath(pathname);
      let initialLocale = 'en';

      if (pathLocale && pathLocale !== 'en') {
        console.log('I18nContext: Using pathname locale:', pathLocale);
        initialLocale = pathLocale;
      } else if (savedLanguage) {
        const normalizedSavedLanguage = normalizeLocale(savedLanguage);
        console.log('I18nContext: Found saved language:', savedLanguage);
        initialLocale = normalizedSavedLanguage;
      } else if (domainLanguage) {
        console.log('I18nContext: Using domain language:', domainLanguage);
        initialLocale = normalizeLocale(domainLanguage);
      } else {
        initialLocale = pathLocale || 'en';
        console.log('I18nContext: Falling back to pathname/default locale:', initialLocale);
      }
      
      // Set the locale
      setLocale(initialLocale);
      
      // Load translations for the determined locale
      try {
        setIsLoading(true);
        console.log('I18nContext: Loading translations for', initialLocale);
        const response = await fetch(`/locales/${initialLocale}/common.json`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
          console.log('I18nContext: Translations loaded successfully for', initialLocale);
        } else {
          console.error('Failed to load translations, response not ok:', response.status);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    if (!isInitialized) {
      initializeLocale();
    }
  }, [pathname, isInitialized]);

  // Sync locale with URL changes (for when user navigates via URL)
  useEffect(() => {
    if (isInitialized) {
      const urlLanguage = detectLocaleFromPath(pathname);
      
      if (urlLanguage !== locale) {
        console.log('I18nContext: URL language changed from', locale, 'to', urlLanguage, '- updating context only');
        // Update locale and translations without saving to localStorage (to avoid loops)
        setLocale(urlLanguage);
        
        // Load translations for the new locale
        const loadTranslations = async () => {
          try {
            setIsLoading(true);
            const response = await fetch(`/locales/${urlLanguage}/common.json`);
            if (response.ok) {
              const data = await response.json();
              setTranslations(data);
              console.log('I18nContext: Translations loaded for URL language:', urlLanguage);
            }
          } catch (error) {
            console.error('Failed to load translations for URL language:', error);
          } finally {
            setIsLoading(false);
          }
        };
        
        loadTranslations();
      }
    }
  }, [pathname, isInitialized]); // Remove locale from dependencies to avoid loops

  const t = (key, fallback = '', variables = {}) => {
    const keys = key.split('.');
    let value = translations;
    let found = true;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        found = false;
        break;
      }
    }
    
    let result = found && typeof value === 'string' ? value : (fallback || key);
    
    // Handle interpolation with variables like {{name}}, {{number}}, etc.
    if (typeof result === 'string' && variables && typeof variables === 'object') {
      Object.keys(variables).forEach(varKey => {
        const placeholder = `{{${varKey}}}`;
        result = result.replace(new RegExp(placeholder, 'g'), variables[varKey]);
      });
    }
    
    return result;
  };

  const changeLanguage = async (newLocale) => {
    console.log('I18nContext: changeLanguage called with', newLocale);
    
    // Save to localStorage for persistence
    localStorage.setItem('roamjet-language', newLocale);
    console.log('I18nContext: Saved language to localStorage:', newLocale);
    
    // Also save to cookies as backup
    if (typeof window !== 'undefined' && window.saveLanguageToCookie) {
      window.saveLanguageToCookie(newLocale);
    }
    
    // Update locale state
    setLocale(newLocale);
    
    // Load translations for the new locale
    try {
      setIsLoading(true);
      console.log('I18nContext: Loading translations for', newLocale);
      const response = await fetch(`/locales/${newLocale}/common.json`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
        console.log('I18nContext: Translations loaded successfully for', newLocale);
      } else {
        console.error('Failed to load translations, response not ok:', response.status);
      }
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    locale,
    t,
    translations,
    isLoading,
    changeLanguage,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};
