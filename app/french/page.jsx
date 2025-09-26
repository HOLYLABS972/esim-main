'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'Plans RoamJet eSIM - Meilleures Données Voyage pour Auberges & Routards | Couverture Mondiale',
  description: 'Plans de données eSIM parfaits pour les routards et voyageurs d\'auberges. Activation instantanée dans plus de 200 pays. Mieux qu\'Airalo - pas de frais d\'itinérance, activation QR instantanée, tarifs économiques.',
  keywords: [
    'eSIM pour routards',
    'alternative wifi auberge',
    'plans données voyage',
    'itinérance internationale',
    'RoamJet vs Airalo',
    'internet voyage économique',
    'solution internet auberge',
    'données mobiles routards',
    'plans eSIM voyage',
    'connectivité données mondiale',
    'internet voyage pas cher',
    'sauvegarde wifi auberge',
    'plans mobiles voyageurs',
    'SIM données international',
    'internet routard'
  ],
  authors: [{ name: 'Équipe RoamJet' }],
  creator: 'RoamJet',
  publisher: 'RoamJet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
    title: 'Plans RoamJet eSIM - Meilleures Données Voyage pour Auberges & Routards',
    description: 'Plans de données eSIM parfaits pour les routards et voyageurs d\'auberges. Activation instantanée dans plus de 200 pays. Mieux qu\'Airalo - pas de frais d\'itinérance.',
    siteName: 'RoamJet',
    images: [
      {
        url: '/images/og-backpacker-esim-fr.jpg',
        width: 1200,
        height: 630,
        alt: 'Plans RoamJet eSIM pour Routards et Voyageurs d\'Auberges',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plans RoamJet eSIM - Meilleures Données Voyage pour Auberges & Routards',
    description: 'Plans de données eSIM parfaits pour les routards et voyageurs d\'auberges. Activation instantanée dans plus de 200 pays. Mieux qu\'Airalo.',
    images: ['/images/twitter-backpacker-esim-fr.jpg'],
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

export default function FrenchPage() {
  return (
    <div dir="ltr" lang="fr">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "RoamJet",
            "description": "Plans de données eSIM mondiaux pour voyageurs, routards et clients d'auberges. Activation instantanée dans plus de 200 pays.",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/french`,
            "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/images/logo.png`,
            "sameAs": [
              "https://twitter.com/roamjet",
              "https://facebook.com/roamjet",
              "https://instagram.com/roamjet"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["French", "English", "Arabic", "German", "Spanish", "Hebrew", "Russian"]
            },
            "offers": {
              "@type": "Offer",
              "description": "Plans de données eSIM pour plus de 200 pays",
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
