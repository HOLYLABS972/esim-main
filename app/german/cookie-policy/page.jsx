

import dynamic from 'next/dynamic';
import RTLWrapper from '../../../src/components/RTLWrapper';

const CookiePolicy = dynamic(() => import('../../../src/components/CookiePolicy'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export const metadata = {
  title: 'Cookie-Richtlinie - Roam Jet Plans | Verwendung von Cookies',
  description: 'Unsere Cookie-Richtlinie erklärt, wie wir Cookies und ähnliche Technologien verwenden, um unsere Dienstleistungen bereitzustellen und Ihre Erfahrung zu verbessern.',
  keywords: [
    'Cookie-Richtlinie', 'Cookies', 'gezielte Cookies', 'funktionale Cookies', 'analytische Cookies',
    'Marketing-Cookies', 'essenzielle Cookies', 'Cookie-Einstellungen', 'Cookie-Verwaltung'
  ],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/german/cookie-policy',
    languages: {
      'en': '/cookie-policy',
      'ar': '/arabic/cookie-policy',
      'fr': '/french/cookie-policy', 
      'de': '/german/cookie-policy',
      'es': '/spanish/cookie-policy',
      'he': '/hebrew/cookie-policy',
      'ru': '/russian/cookie-policy'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: '/german/cookie-policy',
    title: 'Cookie-Richtlinie - Roam Jet Plans | Verwendung von Cookies',
    description: 'Unsere Cookie-Richtlinie erklärt, wie wir Cookies und ähnliche Technologien verwenden, um unsere Dienstleistungen bereitzustellen und Ihre Erfahrung zu verbessern.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/cookie-og-image-de.jpg',
        width: 1200,
        height: 630,
        alt: 'Cookie-Richtlinie - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cookie-Richtlinie - Roam Jet Plans | Verwendung von Cookies',
    description: 'Unsere Cookie-Richtlinie erklärt, wie wir Cookies und ähnliche Technologien verwenden, um unsere Dienstleistungen bereitzustellen und Ihre Erfahrung zu verbessern.',
    images: ['/images/cookie-twitter-image-de.jpg'],
    creator: '@roamjetplans',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function GermanCookiePolicyPage() {
  return (
    <RTLWrapper>
      <CookiePolicy language="de" />
    </RTLWrapper>
  );
}
