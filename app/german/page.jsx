'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'RoamJet eSIM Pläne - Beste Reisedaten für Hostels & Backpacker | Weltweite Abdeckung',
  description: 'Perfekte eSIM-Datenpläne für Backpacker und Hostel-Reisende. Sofortige Aktivierung in über 200 Ländern. Besser als Airalo - keine Roaming-Gebühren, sofortige QR-Aktivierung, günstige Preise.',
  keywords: [
    'eSIM für Backpacker',
    'Hostel WLAN Alternative',
    'Reisedatenpläne',
    'internationales Roaming',
    'RoamJet vs Airalo',
    'günstiges Reiseinternet',
    'Hostel Internet Lösung',
    'Backpacker Mobilfunkdaten',
    'Reise eSIM Pläne',
    'globale Datenkonnektivität',
    'günstiges Reiseinternet',
    'Hostel WLAN Backup',
    'Reisende Mobilfunkpläne',
    'internationale Daten SIM',
    'Backpacking Internet'
  ],
  authors: [{ name: 'RoamJet Team' }],
  creator: 'RoamJet',
  publisher: 'RoamJet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
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
    title: 'RoamJet eSIM Pläne - Beste Reisedaten für Hostels & Backpacker',
    description: 'Perfekte eSIM-Datenpläne für Backpacker und Hostel-Reisende. Sofortige Aktivierung in über 200 Ländern. Besser als Airalo - keine Roaming-Gebühren.',
    siteName: 'RoamJet',
    images: [
      {
        url: '/images/og-backpacker-esim-de.jpg',
        width: 1200,
        height: 630,
        alt: 'RoamJet eSIM Pläne für Backpacker und Hostel-Reisende',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoamJet eSIM Pläne - Beste Reisedaten für Hostels & Backpacker',
    description: 'Perfekte eSIM-Datenpläne für Backpacker und Hostel-Reisende. Sofortige Aktivierung in über 200 Ländern. Besser als Airalo.',
    images: ['/images/twitter-backpacker-esim-de.jpg'],
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

export default function GermanPage() {
  return (
    <div dir="ltr" lang="de">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "RoamJet",
            "description": "Globale eSIM-Datenpläne für Reisende, Backpacker und Hostel-Gäste. Sofortige Aktivierung in über 200 Ländern.",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/german`,
            "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/images/logo.png`,
            "sameAs": [
              "https://twitter.com/roamjet",
              "https://facebook.com/roamjet",
              "https://instagram.com/roamjet"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["German", "English", "Arabic", "French", "Spanish", "Hebrew", "Russian"]
            },
            "offers": {
              "@type": "Offer",
              "description": "eSIM-Datenpläne für über 200 Länder",
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
