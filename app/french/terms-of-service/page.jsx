

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
  title: 'Conditions d\'Utilisation - Roam Jet Plans | Termes et Conditions',
  description: 'Nos conditions d\'utilisation définissent vos droits et obligations ainsi que ceux de Roam Jet Plans dans l\'utilisation de nos services eSIM.',
  keywords: [
    'conditions d\'utilisation', 'termes et conditions', 'accord de service', 'droits utilisateur', 'obligations utilisateur',
    'restrictions de service', 'annulation de service', 'compensations', 'responsabilité de service'
  ],
  authors: [{ name: 'Équipe Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/french/terms-of-service',
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
    locale: 'fr_FR',
    url: '/french/terms-of-service',
    title: 'Conditions d\'Utilisation - Roam Jet Plans | Termes et Conditions',
    description: 'Nos conditions d\'utilisation définissent vos droits et obligations ainsi que ceux de Roam Jet Plans dans l\'utilisation de nos services eSIM.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/terms-og-image-fr.jpg',
        width: 1200,
        height: 630,
        alt: 'Conditions d\'Utilisation - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Conditions d\'Utilisation - Roam Jet Plans | Termes et Conditions',
    description: 'Nos conditions d\'utilisation définissent vos droits et obligations ainsi que ceux de Roam Jet Plans dans l\'utilisation de nos services eSIM.',
    images: ['/images/terms-twitter-image-fr.jpg'],
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

export default function FrenchTermsOfServicePage() {
  return (
    <RTLWrapper>
      <TermsOfService language="fr" />
    </RTLWrapper>
  );
}
