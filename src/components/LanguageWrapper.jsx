'use client';

import { usePathname } from 'next/navigation';
import { I18nProvider } from '../contexts/I18nContext';

const LanguageWrapper = ({ children }) => {
  const pathname = usePathname();
  const languagePrefixes = [
    'en', 'en-US', 'en-CA',
    'he', 'ar', 'ru', 'de', 'fr', 'es',
    'fr-CA', 'id', 'ja', 'pt-BR', 'tr', 'uk', 'vi', 'zh-Hans',
    'hebrew', 'arabic', 'russian', 'german', 'french', 'spanish'
  ];
  
  // Pages that should have I18n context
  const translatedPages = [
    '/', 
    ...languagePrefixes.map((prefix) => `/${prefix}`),
    // Other translated pages
    '/contact', '/login', '/register', '/dashboard', '/esim-plans', '/privacy-policy', '/terms-of-service', '/cookie-policy'
  ];

  // Check for special pages that should always have i18n context
  const isSpecialPage = pathname === '/not-found' || pathname === '/404';

  // Check for language-specific routes (e.g., /he/contact, /fr-CA/login, etc.)
  const isLanguageSpecificPage = languagePrefixes.some((prefix) => pathname.startsWith(`/${prefix}/`));
  
  if (!translatedPages.includes(pathname) && !isLanguageSpecificPage && !isSpecialPage) {
    console.log('LanguageWrapper: No I18n context for pathname:', pathname);
    return children;
  }
  
  console.log('LanguageWrapper: Providing I18n context for pathname:', pathname);
  
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  );
};

export default LanguageWrapper;
