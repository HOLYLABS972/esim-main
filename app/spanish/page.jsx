import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'eSIM España - Planes Roam Jet para Viajeros Españoles | Alternativa a Airalo',
  description: 'eSIM para España: Alternativa más barata que Airalo, Roamless, Saily & Esimo. Planes de datos para viajeros españoles en más de 200 países. Activación instantánea, sin roaming. Perfecto para España a USA, Alemania, Asia. Desde 5€. Atención al cliente en español.',
  keywords: [
    'eSIM España', 'eSIM para españoles', 'planes de datos España', 'viajeros españoles eSIM', 
    'eSIM España USA', 'eSIM España Alemania', 'eSIM España Asia', 'eSIM España Europa',
    'eSIM barato España', 'activación eSIM España', 'proveedores eSIM España', 'eSIM sin roaming',
    'planes de datos internacionales España', 'eSIM para viajes de negocios España', 'eSIM vacaciones España',
    'eSIM estudiantes España', 'eSIM mochileros España', 'eSIM viajes de negocios España',
    'eSIM España Francia', 'eSIM España Italia', 'eSIM España Portugal', 'eSIM España Marruecos',
    'eSIM España Turquía', 'eSIM España Grecia', 'eSIM España Croacia', 'eSIM España Malta',
    'eSIM España Tailandia', 'eSIM España Japón', 'eSIM España Australia', 'eSIM España Canadá',
    'eSIM España Brasil', 'eSIM España México', 'eSIM España Dubai', 'eSIM España Singapur',
    'Airalo España', 'Airalo alternativa', 'Roamless España', 'Roamless alternativa',
    'Saily España', 'Saily alternativa', 'Esimo España', 'Esimo alternativa',
    'eSIM comparación España', 'mejor eSIM España', 'eSIM más barato España',
    'Airalo vs Roam Jet', 'Roamless vs Roam Jet', 'Saily vs Roam Jet', 'Esimo vs Roam Jet',
    'comparación proveedores eSIM', 'test eSIM España', 'reseñas eSIM España'
  ],
  authors: [{ name: 'Equipo Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
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
    title: 'eSIM España - Planes Roam Jet para Viajeros Españoles | Alternativa a Airalo',
    description: 'eSIM para España: Alternativa más barata que Airalo, Roamless, Saily & Esimo. Planes de datos para viajeros españoles en más de 200 países. Activación instantánea, sin roaming.',
    siteName: 'Roam Jet Plans España',
    images: [
      {
        url: '/images/og-image-es.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM España - Planes Roam Jet para Viajeros Españoles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM España - Planes Roam Jet para Viajeros Españoles | Alternativa a Airalo',
    description: 'eSIM para España: Alternativa más barata que Airalo, Roamless, Saily & Esimo. Planes de datos para viajeros españoles en más de 200 países.',
    images: ['/images/twitter-image-es.jpg'],
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
};

export default function SpanishPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Roam Jet Plans",
    "description": "Alternativa más barata que Airalo, Roamless, Saily & Esimo. Planes de datos eSIM globales para viajeros españoles en más de 200 países. Activación instantánea, no necesitas SIM física.",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/spanish`,
    "logo": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/images/logo.png`,
    "sameAs": [
      "https://twitter.com/roamjetplans",
      "https://facebook.com/roamjetplans",
      "https://linkedin.com/company/roamjetplans"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-555-ROAM-JET",
      "contactType": "customer service",
      "availableLanguage": ["Spanish", "English", "Arabic", "French", "German", "Hebrew", "Russian"]
    },
    "offers": {
      "@type": "Offer",
      "name": "Planes de datos eSIM",
      "description": "Planes de datos eSIM más baratos que Airalo, Roamless, Saily & Esimo para viajes internacionales desde España",
      "price": "5.00",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "serviceArea": {
      "@type": "GeoCircle",
      "geoMidpoint": {
        "@type": "GeoCoordinates",
        "latitude": "0",
        "longitude": "0"
      },
      "geoRadius": "20000000"
    }
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      <div dir="ltr" lang="es">
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
    </>
  )
}
