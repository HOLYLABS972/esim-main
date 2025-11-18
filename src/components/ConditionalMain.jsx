'use client';

import { usePathname } from 'next/navigation';

const ConditionalMain = ({ children }) => {
  const pathname = usePathname();
  
  // Store pages and auth pages don't need top padding (they have their own layout)
  const storePages = ['/store', '/dashboard', '/checkout', '/cart', '/login', '/register', '/payment-success', '/forgot-password', '/verify-email', '/esim-plans', '/share-package'];
  const isStorePage = storePages.some(page => 
    pathname === page || 
    pathname.startsWith(page + '/') ||
    pathname.match(/^\/[a-z]{2}\/(store|dashboard|checkout|cart|login|register|esim-plans|share-package)/)
  );
  
  if (isStorePage) {
    return <main className="pt-[50px]">{children}</main>;
  }
  
  return <main className="pt-16">{children}</main>;
};

export default ConditionalMain;
