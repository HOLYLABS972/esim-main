'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
                <img
                  src="/images/logo_icon/logo.png"
                  alt="RoamJet Plans Logo"
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
  
  return <Navbar />;
};

export default ConditionalNavbar;
