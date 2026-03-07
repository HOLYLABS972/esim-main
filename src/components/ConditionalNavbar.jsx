'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from './Navbar';

const ConditionalNavbar = () => {
  const pathname = usePathname();

  // Hide navbar on admin and share-package pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/share-package')) {
    return null;
  }

  // Hide navbar on virtual card top-up and payment-success (WebView / Paddle return — no header)
  if (
    pathname === '/topup' ||
    pathname?.startsWith('/topup/') ||
    pathname === '/payment-success' ||
    pathname?.includes('payment-success')
  ) {
    return null;
  }

  // Show full navbar on login and register pages (same as other pages)
  if (pathname === '/login' || pathname === '/register') {
    return <Navbar />;
  }

  // Hide back button on dashboard page (but keep language selector)
  if (pathname === '/dashboard' || pathname?.match(/^\/[a-z]{2}\/dashboard$/)) {
    return <Navbar hideBackButton={true} />;
  }

  // Hide back button on landing page (root route)
  const isLandingPage = pathname === '/';
  return <Navbar hideBackButton={isLandingPage} />;
};

export default ConditionalNavbar;
