'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import ConditionalNavbar from './ConditionalNavbar';
import ConditionalFooter from './ConditionalFooter';
import ConditionalMain from './ConditionalMain';
import Navbar from './Navbar';
import Footer from './Footer';

/**
 * Renders navbar + main + footer only when NOT on a chromeless route.
 * Chromeless: /topup, /payment-success — no header, no footer (e.g. WebView / Paddle return).
 * When pathname is unknown (e.g. first paint / hydration), we default to chromeless
 * so those load screens never show the navbar.
 */
export default function LayoutChrome({ children }) {
  const pathname = usePathname();
  const isChromeless =
    pathname == null ||
    pathname === '' ||
    pathname === '/topup' ||
    pathname.startsWith('/topup/') ||
    pathname.endsWith('/topup') ||
    pathname.includes('/topup') ||
    pathname === '/payment-success' ||
    pathname.includes('payment-success');

  if (isChromeless) {
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
