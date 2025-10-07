'use client';

import { usePathname } from 'next/navigation';
import { I18nProvider } from '../contexts/I18nContext';

const LanguageWrapper = ({ children }) => {
  const pathname = usePathname();
  
  // Only apply i18n to landing page and specific pages that should be translated
  const translatedPages = [
    '/', 
    // New language-code routes
    '/he', '/ar', '/ru', '/de', '/fr', '/es',
    // Old language routes (for backward compatibility)
    '/hebrew', '/arabic', '/russian', '/german', '/french', '/spanish', 
    // Other translated pages
    '/contact', '/privacy-policy', '/terms-of-service', '/cookie-policy'
  ];
  
  // Also apply i18n to blog pages (both new and old routes)
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
  
  // Don't apply i18n to admin or other pages (but include blog pages)
  if (!translatedPages.includes(pathname) && !isBlogPage) {
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
