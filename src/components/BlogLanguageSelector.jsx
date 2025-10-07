'use client';

import React, { useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { getLanguageName, getLanguageFlag } from '../utils/languageUtils';

const BlogLanguageSelector = () => {
  const { locale, changeLanguage } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: getLanguageName('en'), flag: getLanguageFlag('en') },
    { code: 'he', name: getLanguageName('he'), flag: getLanguageFlag('he') },
    { code: 'ru', name: getLanguageName('ru'), flag: getLanguageFlag('ru') },
    { code: 'ar', name: getLanguageName('ar'), flag: getLanguageFlag('ar') },
    { code: 'de', name: getLanguageName('de'), flag: getLanguageFlag('de') },
    { code: 'fr', name: getLanguageName('fr'), flag: getLanguageFlag('fr') },
    { code: 'es', name: getLanguageName('es'), flag: getLanguageFlag('es') }
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  const handleLanguageChange = async (languageCode) => {
    setIsOpen(false);
    await changeLanguage(languageCode);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-tufts-blue transition-colors rounded-md hover:bg-gray-100 bg-white border border-gray-200"
        aria-label="Select Language"
      >
        <span>{currentLanguage.flag}</span>
        <span className="text-xs">{currentLanguage.code.toUpperCase()}</span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors flex items-center space-x-3 ${
                  language.code === locale ? 'bg-tufts-blue text-white hover:bg-tufts-blue' : 'text-gray-700'
                }`}
              >
                <span className="text-lg">{language.flag}</span>
                <span>{language.name}</span>
                {language.code === locale && (
                  <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogLanguageSelector;
