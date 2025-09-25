

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
  title: 'Términos de Servicio - Roam Jet Plans | Términos y Condiciones',
  description: 'Nuestros términos de servicio definen tus derechos y obligaciones así como los de Roam Jet Plans en el uso de nuestros servicios eSIM.',
  keywords: [
    'términos de servicio', 'términos y condiciones', 'acuerdo de servicio', 'derechos del usuario', 'obligaciones del usuario',
    'restricciones de servicio', 'cancelación de servicio', 'compensaciones', 'responsabilidad del servicio'
  ],
  authors: [{ name: 'Equipo Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/spanish/terms-of-service',
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
    locale: 'es_ES',
    url: '/spanish/terms-of-service',
    title: 'Términos de Servicio - Roam Jet Plans | Términos y Condiciones',
    description: 'Nuestros términos de servicio definen tus derechos y obligaciones así como los de Roam Jet Plans en el uso de nuestros servicios eSIM.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/terms-og-image-es.jpg',
        width: 1200,
        height: 630,
        alt: 'Términos de Servicio - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Términos de Servicio - Roam Jet Plans | Términos y Condiciones',
    description: 'Nuestros términos de servicio definen tus derechos y obligaciones así como los de Roam Jet Plans en el uso de nuestros servicios eSIM.',
    images: ['/images/terms-twitter-image-es.jpg'],
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

export default function SpanishTermsOfServicePage() {
  return (
    <RTLWrapper>
      <TermsOfService language="es" />
    </RTLWrapper>
  );
}
