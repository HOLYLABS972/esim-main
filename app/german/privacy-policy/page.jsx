

import dynamic from 'next/dynamic';
import RTLWrapper from '../../../src/components/RTLWrapper';

const PrivacyPolicy = dynamic(() => import('../../../src/components/PrivacyPolicy'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export const metadata = {
  title: 'Datenschutzrichtlinie - Roam Jet Plans | Schutz Ihrer Persönlichen Daten',
  description: 'Unsere Datenschutzrichtlinie erklärt, wie wir Ihre persönlichen Informationen sammeln, verwenden und schützen. Vollständige Transparenz beim Datenschutz.',
  keywords: [
    'Datenschutzrichtlinie', 'Datenschutz', 'persönliche Daten', 'GDPR', 'Datenschutz',
    'Benutzerdatenschutz', 'Informationssicherheit', 'Datenschutz', 'Datenschutztransparenz'
  ],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/german/privacy-policy',
    languages: {
      'en': '/privacy-policy',
      'ar': '/arabic/privacy-policy',
      'fr': '/french/privacy-policy', 
      'de': '/german/privacy-policy',
      'es': '/spanish/privacy-policy',
      'he': '/hebrew/privacy-policy',
      'ru': '/russian/privacy-policy'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    url: '/german/privacy-policy',
    title: 'Datenschutzrichtlinie - Roam Jet Plans | Schutz Ihrer Persönlichen Daten',
    description: 'Unsere Datenschutzrichtlinie erklärt, wie wir Ihre persönlichen Informationen sammeln, verwenden und schützen. Vollständige Transparenz beim Datenschutz.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/privacy-og-image-de.jpg',
        width: 1200,
        height: 630,
        alt: 'Datenschutzrichtlinie - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Datenschutzrichtlinie - Roam Jet Plans | Schutz Ihrer Persönlichen Daten',
    description: 'Unsere Datenschutzrichtlinie erklärt, wie wir Ihre persönlichen Informationen sammeln, verwenden und schützen.',
    images: ['/images/privacy-twitter-image-de.jpg'],
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

export default function GermanPrivacyPolicyPage() {
  return (
    <RTLWrapper>
      <PrivacyPolicy language="de" />
    </RTLWrapper>
  );
}
