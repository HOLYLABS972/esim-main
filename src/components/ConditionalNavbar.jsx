'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from './Navbar';

const ConditionalNavbar = () => {
  const pathname = usePathname();
  
  // Hide navbar completely on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }
  
  // Show logo-only navbar on login and signup pages
  if (pathname === '/login' || pathname === '/register') {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm shadow-soft">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <Image
                  src="/images/logo_icon/logo.png"
                  alt="RoamJet Plans Logo"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-xl font-bold text-eerie-black" style={{ fontFamily: 'Open Sans, sans-serif' }}>RoamJet</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  // Hide language selector and back button on dashboard page
  if (pathname === '/dashboard') {
    return <Navbar hideLanguageSelector={true} hideBackButton={true} />;
  }
  
  // Hide back button on landing page (root route) and payment success page
  const isLandingPage = pathname === '/';
  const isPaymentSuccessPage = pathname === '/payment-success';
  
  return <Navbar hideBackButton={isLandingPage || isPaymentSuccessPage} />;
};

export default ConditionalNavbar;
