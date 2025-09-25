import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'eSIM France - Plans Roam Jet pour Voyageurs Français | Alternative moins chère qu\'Airalo',
  description: 'eSIM pour France: Alternative moins chère qu\'Airalo, Roamless, Saily & Esimo. Plans de données pour voyageurs français dans plus de 200 pays. Activation instantanée, sans roaming. Parfait pour France vers USA, Allemagne, Asie. À partir de 5€. Support client français.',
  keywords: [
    'eSIM France', 'eSIM pour Français', 'plans de données France', 'voyageurs français eSIM', 
    'eSIM France USA', 'eSIM France Allemagne', 'eSIM France Asie', 'eSIM France Europe',
    'eSIM France Canada', 'eSIM France Japon', 'eSIM France Thaïlande', 'eSIM France Australie',
    'eSIM pas cher France', 'activation eSIM France', 'fournisseurs eSIM France', 'eSIM sans roaming',
    'plans de données internationaux France', 'eSIM pour voyages d\'affaires France', 'eSIM vacances France',
    'eSIM étudiants France', 'eSIM backpackers France', 'eSIM voyages d\'affaires France',
    'eSIM France Espagne', 'eSIM France Italie', 'eSIM France Portugal', 'eSIM France Suisse',
    'eSIM France Belgique', 'eSIM France Luxembourg', 'eSIM France Monaco', 'eSIM France Maroc',
    'eSIM France Tunisie', 'eSIM France Algérie', 'eSIM France Sénégal', 'eSIM France Côte d\'Ivoire',
    'Airalo France', 'alternative Airalo', 'Roamless France', 'alternative Roamless',
    'Saily France', 'alternative Saily', 'Esimo France', 'alternative Esimo',
    'comparaison eSIM France', 'meilleur eSIM France', 'eSIM moins cher France',
    'Airalo vs Roam Jet', 'Roamless vs Roam Jet', 'Saily vs Roam Jet', 'Esimo vs Roam Jet',
    'comparaison fournisseurs eSIM', 'test eSIM France', 'avis eSIM France'
  ],
  authors: [{ name: 'Équipe Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/french',
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
    locale: 'fr_FR',
    url: '/french',
    title: 'eSIM France - Plans Roam Jet pour Voyageurs Français | Alternative moins chère qu\'Airalo',
    description: 'eSIM pour France: Alternative moins chère qu\'Airalo, Roamless, Saily & Esimo. Plans de données pour voyageurs français dans plus de 200 pays. Activation instantanée, sans roaming.',
    siteName: 'Roam Jet Plans France',
    images: [
      {
        url: '/images/og-image-fr.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM France - Plans Roam Jet pour Voyageurs Français',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM France - Plans Roam Jet pour Voyageurs Français | Alternative moins chère qu\'Airalo',
    description: 'eSIM pour France: Alternative moins chère qu\'Airalo, Roamless, Saily & Esimo. Plans de données pour voyageurs français dans plus de 200 pays.',
    images: ['/images/twitter-image-fr.jpg'],
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

export default function FrenchPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Roam Jet Plans",
    "description": "Alternative moins chère qu'Airalo, Roamless, Saily & Esimo. Plans de données eSIM mondiaux pour voyageurs français dans plus de 200 pays. Activation instantanée, pas besoin de carte SIM physique.",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/french`,
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
      "availableLanguage": ["French", "English", "Arabic", "German", "Spanish", "Hebrew", "Russian"]
    },
    "offers": {
      "@type": "Offer",
      "name": "Plans de données eSIM",
      "description": "Plans de données eSIM moins chers qu'Airalo, Roamless, Saily & Esimo pour voyages internationaux depuis la France",
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
      
      <div dir="ltr" lang="fr">
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
