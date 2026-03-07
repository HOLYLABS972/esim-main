'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/share-package')) {
    return null;
  }

  // Hide footer on virtual card top-up and payment-success (WebView / Paddle return — no footer)
  if (
    pathname === '/topup' ||
    pathname?.startsWith('/topup/') ||
    pathname === '/payment-success' ||
    pathname?.includes('payment-success')
  ) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
