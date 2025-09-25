

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
  title: 'Política de Cookies - Roam Jet Plans | Uso de Cookies',
  description: 'Nuestra política de cookies explica cómo utilizamos cookies y tecnologías similares para proporcionar nuestros servicios y mejorar tu experiencia.',
  keywords: [
    'política de cookies', 'cookies', 'cookies dirigidos', 'cookies funcionales', 'cookies analíticos',
    'cookies de marketing', 'cookies esenciales', 'configuración de cookies', 'gestión de cookies'
  ],
  authors: [{ name: 'Equipo Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/spanish/cookie-policy',
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
    locale: 'es_ES',
    url: '/spanish/cookie-policy',
    title: 'Política de Cookies - Roam Jet Plans | Uso de Cookies',
    description: 'Nuestra política de cookies explica cómo utilizamos cookies y tecnologías similares para proporcionar nuestros servicios y mejorar tu experiencia.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/cookie-og-image-es.jpg',
        width: 1200,
        height: 630,
        alt: 'Política de Cookies - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Política de Cookies - Roam Jet Plans | Uso de Cookies',
    description: 'Nuestra política de cookies explica cómo utilizamos cookies y tecnologías similares para proporcionar nuestros servicios y mejorar tu experiencia.',
    images: ['/images/cookie-twitter-image-es.jpg'],
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

export default function SpanishCookiePolicyPage() {
  return (
    <RTLWrapper>
      <CookiePolicy language="es" />
    </RTLWrapper>
  );
}
