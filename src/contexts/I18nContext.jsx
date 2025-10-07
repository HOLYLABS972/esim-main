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
      t: (key, fallback) => fallback || key,
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

  // Initialize locale and translations on mount
  useEffect(() => {
    const initializeLocale = async () => {
      console.log('I18nContext: Initializing locale...');
      
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
      
      let initialLocale = 'en';
      
      if (savedLanguage) {
        console.log('I18nContext: Found saved language:', savedLanguage);
        initialLocale = savedLanguage;
      } else {
        // Fallback to pathname detection if no saved language
        if (pathname.startsWith('/he')) initialLocale = 'he';
        else if (pathname.startsWith('/ar')) initialLocale = 'ar';
        else if (pathname.startsWith('/ru')) initialLocale = 'ru';
        else if (pathname.startsWith('/de')) initialLocale = 'de';
        else if (pathname.startsWith('/fr')) initialLocale = 'fr';
        else if (pathname.startsWith('/es')) initialLocale = 'es';
        // Support old language routes for backward compatibility
        else if (pathname.startsWith('/hebrew')) initialLocale = 'he';
        else if (pathname.startsWith('/arabic')) initialLocale = 'ar';
        else if (pathname.startsWith('/russian')) initialLocale = 'ru';
        else if (pathname.startsWith('/german')) initialLocale = 'de';
        else if (pathname.startsWith('/french')) initialLocale = 'fr';
        else if (pathname.startsWith('/spanish')) initialLocale = 'es';
        
        console.log('I18nContext: No saved language, detected from pathname:', initialLocale);
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
      const urlLanguage = pathname.startsWith('/he') ? 'he' :
                         pathname.startsWith('/ar') ? 'ar' :
                         pathname.startsWith('/ru') ? 'ru' :
                         pathname.startsWith('/de') ? 'de' :
                         pathname.startsWith('/fr') ? 'fr' :
                         pathname.startsWith('/es') ? 'es' :
                         pathname.startsWith('/hebrew') ? 'he' :
                         pathname.startsWith('/arabic') ? 'ar' :
                         pathname.startsWith('/russian') ? 'ru' :
                         pathname.startsWith('/german') ? 'de' :
                         pathname.startsWith('/french') ? 'fr' :
                         pathname.startsWith('/spanish') ? 'es' : 'en';
      
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

  const t = (key, fallback = '') => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return fallback || key;
      }
    }
    
    return typeof value === 'string' ? value : fallback || key;
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

