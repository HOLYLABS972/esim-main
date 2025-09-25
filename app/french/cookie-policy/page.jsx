

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
  title: 'Politique des Cookies - Roam Jet Plans | Utilisation des Cookies',
  description: 'Notre politique des cookies explique comment nous utilisons les cookies et technologies similaires pour fournir nos services et améliorer votre expérience.',
  keywords: [
    'politique des cookies', 'cookies', 'cookies ciblés', 'cookies fonctionnels', 'cookies analytiques',
    'cookies marketing', 'cookies essentiels', 'paramètres des cookies', 'gestion des cookies'
  ],
  authors: [{ name: 'Équipe Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/french/cookie-policy',
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
    locale: 'fr_FR',
    url: '/french/cookie-policy',
    title: 'Politique des Cookies - Roam Jet Plans | Utilisation des Cookies',
    description: 'Notre politique des cookies explique comment nous utilisons les cookies et technologies similaires pour fournir nos services et améliorer votre expérience.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/cookie-og-image-fr.jpg',
        width: 1200,
        height: 630,
        alt: 'Politique des Cookies - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique des Cookies - Roam Jet Plans | Utilisation des Cookies',
    description: 'Notre politique des cookies explique comment nous utilisons les cookies et technologies similaires pour fournir nos services et améliorer votre expérience.',
    images: ['/images/cookie-twitter-image-fr.jpg'],
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

export default function FrenchCookiePolicyPage() {
  return (
    <RTLWrapper>
      <CookiePolicy language="fr" />
    </RTLWrapper>
  );
}
