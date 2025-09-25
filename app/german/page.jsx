'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'eSIM Deutschland - Roam Jet Pläne für Deutsche Reisende | Globale Datenpläne',
  description: 'eSIM für Deutschland: Günstigere Alternative zu Airalo, Roamless, Saily & Esimo. Datenpläne für deutsche Reisende in über 200 Ländern. Sofortige Aktivierung, kein Roaming. Perfekt für Deutschland nach USA, Spanien, Asien. Ab 5€. Deutsche Kundenbetreuung.',
  keywords: [
    'eSIM Deutschland', 'eSIM für Deutsche', 'Datenpläne Deutschland', 'Deutsche Reisende eSIM', 
    'eSIM Deutschland USA', 'eSIM Deutschland Spanien', 'eSIM Deutschland Asien', 'eSIM Deutschland Europa',
    'günstige eSIM Deutschland', 'eSIM Aktivierung Deutschland', 'Deutsche eSIM Anbieter', 'eSIM ohne Roaming',
    'internationale Datenpläne Deutschland', 'eSIM für Geschäftsreisen Deutschland', 'eSIM Urlaub Deutschland',
    'eSIM Studenten Deutschland', 'eSIM Backpacker Deutschland', 'eSIM Geschäftsreisen Deutschland',
    'eSIM Deutschland Frankreich', 'eSIM Deutschland Italien', 'eSIM Deutschland Österreich', 'eSIM Deutschland Schweiz',
    'eSIM Deutschland Türkei', 'eSIM Deutschland Griechenland', 'eSIM Deutschland Portugal', 'eSIM Deutschland Kroatien',
    'eSIM Deutschland Thailand', 'eSIM Deutschland Japan', 'eSIM Deutschland Australien', 'eSIM Deutschland Kanada',
    'eSIM Deutschland Brasilien', 'eSIM Deutschland Mexiko', 'eSIM Deutschland Dubai', 'eSIM Deutschland Singapur',
    'Airalo Deutschland', 'Airalo Alternative', 'Roamless Deutschland', 'Roamless Alternative',
    'Saily Deutschland', 'Saily Alternative', 'Esimo Deutschland', 'Esimo Alternative',
    'eSIM Vergleich Deutschland', 'beste eSIM Deutschland', 'günstigste eSIM Deutschland',
    'Airalo vs Roam Jet', 'Roamless vs Roam Jet', 'Saily vs Roam Jet', 'Esimo vs Roam Jet',
    'eSIM Anbieter Vergleich', 'eSIM Test Deutschland', 'eSIM Bewertung Deutschland'
  ],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/german',
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
    locale: 'de_DE',
    url: '/german',
    title: 'eSIM Deutschland - Roam Jet Pläne für Deutsche Reisende | Globale Datenpläne',
    description: 'eSIM für Deutschland: Günstigere Alternative zu Airalo, Roamless, Saily & Esimo. Datenpläne für deutsche Reisende in über 200 Ländern. Sofortige Aktivierung, kein Roaming.',
    siteName: 'Roam Jet Plans Deutschland',
    images: [
      {
        url: '/images/og-image-de.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM Deutschland - Roam Jet Pläne für Deutsche Reisende',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Deutschland - Roam Jet Pläne für Deutsche Reisende | Globale Datenpläne',
    description: 'eSIM für Deutschland: Günstigere Alternative zu Airalo, Roamless, Saily & Esimo. Datenpläne für deutsche Reisende in über 200 Ländern. Sofortige Aktivierung.',
    images: ['/images/twitter-image-de.jpg'],
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

export default function GermanPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Roam Jet Plans",
    "description": "Günstigere Alternative zu Airalo, Roamless, Saily & Esimo. Globale eSIM-Datenpläne für deutsche Reisende in über 200 Ländern. Sofortige Aktivierung, keine physische SIM-Karte erforderlich.",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/german`,
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
      "availableLanguage": ["German", "English", "Arabic", "French", "Spanish", "Hebrew", "Russian"]
    },
    "offers": {
      "@type": "Offer",
      "name": "eSIM-Datenpläne",
      "description": "Günstigere eSIM-Datenpläne als Airalo, Roamless, Saily & Esimo für internationale Reisen von Deutschland",
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
      
      <div dir="ltr" lang="de">
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
