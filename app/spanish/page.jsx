'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'Planes RoamJet eSIM - Mejores Datos de Viaje para Hostales & Mochileros | Cobertura Global',
  description: 'Planes de datos eSIM perfectos para mochileros y viajeros de hostales. Activación instantánea en más de 200 países. Mejor que Airalo - sin tarifas de roaming, activación QR instantánea, precios económicos.',
  keywords: [
    'eSIM para mochileros',
    'alternativa wifi hostal',
    'planes datos viaje',
    'roaming internacional',
    'RoamJet vs Airalo',
    'internet viaje económico',
    'solución internet hostal',
    'datos móviles mochileros',
    'planes eSIM viaje',
    'conectividad datos global',
    'internet viaje barato',
    'respaldo wifi hostal',
    'planes móviles viajeros',
    'SIM datos internacional',
    'internet mochilero'
  ],
  authors: [{ name: 'Equipo RoamJet' }],
  creator: 'RoamJet',
  publisher: 'RoamJet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/spanish',
    languages: {
      'en': '/',
      'ar': '/arabic',
      'fr': '/french',
      'de': '/german',
      'es': '/spanish',
      'he': '/hebrew',
      'ru': '/russian'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/spanish',
    title: 'Planes RoamJet eSIM - Mejores Datos de Viaje para Hostales & Mochileros',
    description: 'Planes de datos eSIM perfectos para mochileros y viajeros de hostales. Activación instantánea en más de 200 países. Mejor que Airalo - sin tarifas de roaming.',
    siteName: 'RoamJet',
    images: [
      {
        url: '/images/og-backpacker-esim-es.jpg',
        width: 1200,
        height: 630,
        alt: 'Planes RoamJet eSIM para Mochileros y Viajeros de Hostales',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planes RoamJet eSIM - Mejores Datos de Viaje para Hostales & Mochileros',
    description: 'Planes de datos eSIM perfectos para mochileros y viajeros de hostales. Activación instantánea en más de 200 países. Mejor que Airalo.',
    images: ['/images/twitter-backpacker-esim-es.jpg'],
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

export default function SpanishPage() {
  return (
    <div dir="ltr" lang="es">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "RoamJet",
            "description": "Planes de datos eSIM globales para viajeros, mochileros y huéspedes de hostales. Activación instantánea en más de 200 países.",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/spanish`,
            "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/images/logo.png`,
            "sameAs": [
              "https://twitter.com/roamjet",
              "https://facebook.com/roamjet",
              "https://instagram.com/roamjet"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["Spanish", "English", "Arabic", "French", "German", "Hebrew", "Russian"]
            },
            "offers": {
              "@type": "Offer",
              "description": "Planes de datos eSIM para más de 200 países",
              "priceRange": "$5-$50",
              "availability": "https://schema.org/InStock"
            }
          })
        }}
      />
      
      <main className="min-h-screen bg-alice-blue">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Plans Section */}
        <PlansSection />

        {/* How It Works & Mobile Apps Section (Combined) */}
        <ActivationSection />
      </main>
    </div>
  )
}
