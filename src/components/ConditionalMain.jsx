'use client';

import { usePathname } from 'next/navigation';

const ConditionalMain = ({ children }) => {
  const pathname = usePathname();
  
  // Remove padding on iframe pages
  const iframePages = [
    '/codecanyon',
    '/store'
  ];
  
  // Check if current path is an iframe page or starts with language prefix + iframe page
  const isIframePage = iframePages.some(page => 
    pathname === page || 
    pathname.startsWith(page + '/') ||
    // Check for language-specific iframe pages (e.g., /fr/store, /de/store, etc.)
    iframePages.some(iframePage => pathname.includes(iframePage))
  );
  
  if (isIframePage) {
    return <main>{children}</main>;
  }
  
  return <main className="pt-16">{children}</main>;
};

export default ConditionalMain;
