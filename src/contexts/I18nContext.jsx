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

  // Determine locale from pathname and load translations
  useEffect(() => {
    const initializeTranslations = async () => {
      let detectedLocale = 'en';
      
      if (pathname === '/hebrew') detectedLocale = 'he';
      else if (pathname === '/arabic') detectedLocale = 'ar';
      else if (pathname === '/russian') detectedLocale = 'ru';
      else if (pathname === '/german') detectedLocale = 'de';
      else if (pathname === '/french') detectedLocale = 'fr';
      else if (pathname === '/spanish') detectedLocale = 'es';
      
      setLocale(detectedLocale);
      
      // Load translations immediately
      try {
        setIsLoading(true);
        const response = await fetch(`/locales/${detectedLocale}/common.json`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
        } else {
          console.error('Failed to load translations, response not ok:', response.status);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTranslations();
  }, [pathname]);

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
    setLocale(newLocale);
    
    // Load translations for the new locale
    try {
      setIsLoading(true);
      const response = await fetch(`/locales/${newLocale}/common.json`);
      if (response.ok) {
        const data = await response.json();
        setTranslations(data);
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

