'use client';

import { usePathname } from 'next/navigation';
import { I18nProvider } from '../contexts/I18nContext';

const LanguageWrapper = ({ children }) => {
  const pathname = usePathname();
  
  // Pages that should have I18n context
  const translatedPages = [
    '/', 
    // New language-code routes
    '/he', '/ar', '/ru', '/de', '/fr', '/es',
    // Old language routes (for backward compatibility)
    '/hebrew', '/arabic', '/russian', '/german', '/french', '/spanish', 
    // Other translated pages
    '/contact', '/login', '/register', '/dashboard', '/esim-plans', '/privacy-policy', '/terms-of-service', '/cookie-policy'
  ];

  // Check for special pages that should always have i18n context
  const isSpecialPage = pathname === '/not-found' || pathname === '/404';
  
  // Check for blog pages (both old and new language routes)
  const isBlogPage = pathname.startsWith('/blog') || 
                    // New language-code blog routes
                    pathname.startsWith('/he/blog') || 
                    pathname.startsWith('/ar/blog') || 
                    pathname.startsWith('/ru/blog') || 
                    pathname.startsWith('/de/blog') || 
                    pathname.startsWith('/fr/blog') || 
                    pathname.startsWith('/es/blog') ||
                    // Old language blog routes (for backward compatibility)
                    pathname.startsWith('/hebrew/blog') || 
                    pathname.startsWith('/arabic/blog') || 
                    pathname.startsWith('/russian/blog') || 
                    pathname.startsWith('/german/blog') || 
                    pathname.startsWith('/french/blog') || 
                    pathname.startsWith('/spanish/blog');

  // Check for language-specific routes (e.g., /he/contact, /ru/login, etc.)
  const isLanguageSpecificPage = pathname.startsWith('/he/') || 
                                pathname.startsWith('/ar/') || 
                                pathname.startsWith('/ru/') || 
                                pathname.startsWith('/de/') || 
                                pathname.startsWith('/fr/') || 
                                pathname.startsWith('/es/') ||
                                // Old language routes (for backward compatibility)
                                pathname.startsWith('/hebrew/') || 
                                pathname.startsWith('/arabic/') || 
                                pathname.startsWith('/russian/') || 
                                pathname.startsWith('/german/') || 
                                pathname.startsWith('/french/') || 
                                pathname.startsWith('/spanish/');
  
  if (!translatedPages.includes(pathname) && !isBlogPage && !isLanguageSpecificPage && !isSpecialPage) {
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
