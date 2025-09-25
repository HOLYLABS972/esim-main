

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
  title: 'Politique de Confidentialité - Roam Jet Plans | Protection de vos Données Personnelles',
  description: 'Notre politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles. Transparence totale dans la protection de la vie privée.',
  keywords: [
    'politique de confidentialité', 'protection de la vie privée', 'données personnelles', 'GDPR', 'protection des données',
    'confidentialité des utilisateurs', 'sécurité des informations', 'protection des données', 'transparence de la confidentialité'
  ],
  authors: [{ name: 'Équipe Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/french/privacy-policy',
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
    locale: 'fr_FR',
    url: '/french/privacy-policy',
    title: 'Politique de Confidentialité - Roam Jet Plans | Protection de vos Données Personnelles',
    description: 'Notre politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles. Transparence totale dans la protection de la vie privée.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/privacy-og-image-fr.jpg',
        width: 1200,
        height: 630,
        alt: 'Politique de Confidentialité - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique de Confidentialité - Roam Jet Plans | Protection de vos Données Personnelles',
    description: 'Notre politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles.',
    images: ['/images/privacy-twitter-image-fr.jpg'],
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

export default function FrenchPrivacyPolicyPage() {
  return (
    <RTLWrapper>
      <PrivacyPolicy language="fr" />
    </RTLWrapper>
  );
}
