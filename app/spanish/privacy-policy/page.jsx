

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
  title: 'Política de Privacidad - Roam Jet Plans | Protección de tus Datos Personales',
  description: 'Nuestra política de privacidad explica cómo recopilamos, utilizamos y protegemos tu información personal. Transparencia total en la protección de la privacidad.',
  keywords: [
    'política de privacidad', 'protección de privacidad', 'datos personales', 'GDPR', 'protección de datos',
    'privacidad de usuarios', 'seguridad de información', 'protección de datos', 'transparencia de privacidad'
  ],
  authors: [{ name: 'Equipo Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/spanish/privacy-policy',
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
    locale: 'es_ES',
    url: '/spanish/privacy-policy',
    title: 'Política de Privacidad - Roam Jet Plans | Protección de tus Datos Personales',
    description: 'Nuestra política de privacidad explica cómo recopilamos, utilizamos y protegemos tu información personal. Transparencia total en la protección de la privacidad.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/privacy-og-image-es.jpg',
        width: 1200,
        height: 630,
        alt: 'Política de Privacidad - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Privacidad - Roam Jet Plans | Protección de tus Datos Personales',
    description: 'Nuestra política de privacidad explica cómo recopilamos, utilizamos y protegemos tu información personal.',
    images: ['/images/privacy-twitter-image-es.jpg'],
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

export default function SpanishPrivacyPolicyPage() {
  return (
    <RTLWrapper>
      <PrivacyPolicy language="es" />
    </RTLWrapper>
  );
}
