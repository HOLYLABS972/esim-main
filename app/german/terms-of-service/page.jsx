

import dynamic from 'next/dynamic';
import RTLWrapper from '../../../src/components/RTLWrapper';

const TermsOfService = dynamic(() => import('../../../src/components/TermsOfService'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export const metadata = {
  title: 'Nutzungsbedingungen - Roam Jet Plans | Allgemeine Geschäftsbedingungen',
  description: 'Unsere Nutzungsbedingungen definieren Ihre Rechte und Pflichten sowie die von Roam Jet Plans bei der Nutzung unserer eSIM-Dienste.',
  keywords: [
    'Nutzungsbedingungen', 'Allgemeine Geschäftsbedingungen', 'Servicevereinbarung', 'Benutzerrechte', 'Benutzerpflichten',
    'Servicebeschränkungen', 'Servicekündigung', 'Entschädigungen', 'Serviceverantwortung'
  ],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/german/terms-of-service',
    languages: {
      'en': '/terms-of-service',
      'ar': '/arabic/terms-of-service',
      'fr': '/french/terms-of-service', 
      'de': '/german/terms-of-service',
      'es': '/spanish/terms-of-service',
      'he': '/hebrew/terms-of-service',
      'ru': '/russian/terms-of-service'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: '/german/terms-of-service',
    title: 'Nutzungsbedingungen - Roam Jet Plans | Allgemeine Geschäftsbedingungen',
    description: 'Unsere Nutzungsbedingungen definieren Ihre Rechte und Pflichten sowie die von Roam Jet Plans bei der Nutzung unserer eSIM-Dienste.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/terms-og-image-de.jpg',
        width: 1200,
        height: 630,
        alt: 'Nutzungsbedingungen - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nutzungsbedingungen - Roam Jet Plans | Allgemeine Geschäftsbedingungen',
    description: 'Unsere Nutzungsbedingungen definieren Ihre Rechte und Pflichten sowie die von Roam Jet Plans bei der Nutzung unserer eSIM-Dienste.',
    images: ['/images/terms-twitter-image-de.jpg'],
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

export default function GermanTermsOfServicePage() {
  return (
    <RTLWrapper>
      <TermsOfService language="de" />
    </RTLWrapper>
  );
}
