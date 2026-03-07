'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/share-package')) {
    return null;
  }

  // Hide footer on virtual card top-up (from app WebView: /topup?cardId=...&amount=...)
  if (pathname === '/topup' && searchParams?.get('cardId')) {
    return null;
  }

  return <Footer />;
};

export default ConditionalFooter;
