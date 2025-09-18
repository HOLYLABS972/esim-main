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
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image
                  src="/images/logo_icon/logo.png"
                  alt="RoamJet Plans Logo"
                  width={120}
                  height={32}
                  className="h-8 w-auto"
                />
                <span className="ml-1 text-xl font-bold text-gray-900">RoamJet</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }
  
  // Hide language selector on dashboard page
  if (pathname === '/dashboard') {
    return <Navbar hideLanguageSelector={true} />;
  }
  
  // Hide back button on landing page (root route)
  const isLandingPage = pathname === '/';
  
  return <Navbar hideBackButton={isLandingPage} />;
};

export default ConditionalNavbar;
