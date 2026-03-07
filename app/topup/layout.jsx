'use client';

/**
 * Topup route layout: no navbar, no footer — only the page content.
 * Navbar/footer are hidden by ConditionalNavbar/ConditionalFooter when pathname is /topup.
 */
export default function TopupLayout({ children }) {
  return <>{children}</>;
}
