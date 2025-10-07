'use client';

import { usePathname } from 'next/navigation';
import { I18nProvider } from '../contexts/I18nContext';

const LanguageWrapper = ({ children }) => {
  const pathname = usePathname();
  
  // Only apply i18n to landing page and specific pages that should be translated
  const translatedPages = ['/', '/hebrew', '/arabic', '/russian', '/german', '/french', '/spanish', '/contact', '/privacy-policy', '/terms-of-service', '/cookie-policy'];
  
  // Also apply i18n to blog pages
  const isBlogPage = pathname.startsWith('/blog') || 
                    pathname.startsWith('/hebrew/blog') || 
                    pathname.startsWith('/arabic/blog') || 
                    pathname.startsWith('/russian/blog') || 
                    pathname.startsWith('/german/blog') || 
                    pathname.startsWith('/french/blog') || 
                    pathname.startsWith('/spanish/blog');
  
  // Don't apply i18n to admin or other pages (but include blog pages)
  if (!translatedPages.includes(pathname) && !isBlogPage) {
    return children;
  }
  
  return (
    <I18nProvider>
      {children}
    </I18nProvider>
  );
};

export default LanguageWrapper;
