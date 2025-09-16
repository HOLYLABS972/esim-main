'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getLanguageDirection } from '../utils/languageUtils';

const I18nContext = createContext();

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const I18nProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [translations, setTranslations] = useState({});

  // Initialize locale from localStorage or default to 'en'
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') || 'en';
    setLocale(savedLocale);
    
    // Set document direction and language
    const direction = getLanguageDirection(savedLocale);
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', savedLocale);
  }, []);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${locale}/common.json`);
        if (response.ok) {
          const data = await response.json();
          setTranslations(data);
        }
      } catch (error) {
        console.error('Failed to load translations:', error);
      }
    };

    loadTranslations();
  }, [locale]);

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

  const changeLocale = (newLocale) => {
    setLocale(newLocale);
    localStorage.setItem('locale', newLocale);
    
    // Set document direction and language
    const direction = getLanguageDirection(newLocale);
    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', newLocale);
  };

  const value = {
    locale,
    t,
    translations,
    changeLocale,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};
