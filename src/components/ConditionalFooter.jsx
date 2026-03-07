'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/share-package')) {
    return null;
  }

  // Hide footer on virtual card top-up (from app WebView: /topup — no footer)
  if (pathname === '/topup') {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
