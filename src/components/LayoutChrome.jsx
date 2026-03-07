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
 * When pathname is unknown (e.g. first paint / hydration), we default to chromeless
 * so the topup load screen never shows the navbar.
 */
export default function LayoutChrome({ children }) {
  const pathname = usePathname();
  // Topup route: no navbar, no footer. Also treat unknown pathname as chromeless so load screen has no navbar.
  const isTopup =
    pathname == null ||
    pathname === '' ||
    pathname === '/topup' ||
    pathname.startsWith('/topup/') ||
    pathname.endsWith('/topup') ||
    pathname.includes('/topup');

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
