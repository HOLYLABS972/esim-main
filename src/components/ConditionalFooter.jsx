'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

const ConditionalFooter = () => {
  const pathname = usePathname();

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/share-package')) {
    return null;
  }
  return <Footer />;
};

export default ConditionalFooter;
