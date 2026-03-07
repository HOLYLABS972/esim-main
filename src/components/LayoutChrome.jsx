'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import ConditionalNavbar from './ConditionalNavbar';
import ConditionalFooter from './ConditionalFooter';
import ConditionalMain from './ConditionalMain';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Renders navbar + main + footer only when NOT on the topup route.
 * For /topup (and /topup/*), renders only the page content — no header, no footer.
 * This avoids the navbar showing from Suspense fallback or pathname delay.
 */
export default function LayoutChrome({ children }) {
  const pathname = usePathname();
  // Topup route: no navbar, no footer (/topup, /topup/*, or locale e.g. /en/topup)
  const isTopup =
    pathname === '/topup' ||
    (pathname != null && (pathname.startsWith('/topup/') || pathname.endsWith('/topup')));

  if (isTopup) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <Suspense fallback={<Navbar />}>
        <ConditionalNavbar />
      </Suspense>
      <ConditionalMain>
        {children}
      </ConditionalMain>
      <Suspense fallback={<Footer />}>
        <ConditionalFooter />
      </Suspense>
    </>
  );
}
