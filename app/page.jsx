'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../src/components/sections';

export const metadata = {
  title: 'RoamJet eSIM Plans - Best Travel Data for Hostels & Backpackers | Global Coverage',
  description: 'Perfect eSIM data plans for backpackers and hostel travelers. Instant activation in 200+ countries. Better than Airalo, Roamless, Saily, and eSIMo - no roaming fees, instant QR activation, budget-friendly rates.',
  keywords: [
    'eSIM for backpackers',
    'hostel wifi alternative',
    'travel data plans',
    'international roaming',
    'RoamJet vs Airalo',
    'RoamJet vs Roamless',
    'RoamJet vs Saily',
    'RoamJet vs eSIMo',
    'better than Airalo',
    'better than Roamless',
    'better than Saily',
    'better than eSIMo',
    'budget travel internet',
    'hostel internet solution',
    'backpacker mobile data',
    'travel eSIM plans',
    'global data connectivity',
    'cheap travel internet',
    'hostel wifi backup',
    'traveler mobile plans',
    'international data SIM',
    'backpacking internet',
    'eSIM comparison',
    'travel data comparison'
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
    canonical: '/',
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
    locale: 'en_US',
    url: '/',
    title: 'RoamJet eSIM Plans - Best Travel Data for Hostels & Backpackers',
    description: 'Perfect eSIM data plans for backpackers and hostel travelers. Instant activation in 200+ countries. Better than Airalo, Roamless, Saily, and eSIMo - no roaming fees, instant QR activation.',
    siteName: 'RoamJet',
    images: [
      {
        url: '/images/og-backpacker-esim.jpg',
        width: 1200,
        height: 630,
        alt: 'RoamJet eSIM Plans for Backpackers and Hostel Travelers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RoamJet eSIM Plans - Best Travel Data for Hostels & Backpackers',
    description: 'Perfect eSIM data plans for backpackers and hostel travelers. Instant activation in 200+ countries. Better than Airalo.',
    images: ['/images/twitter-backpacker-esim.jpg'],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
}

export default function HomePage() {
  return (
    <div dir="ltr" lang="en">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "RoamJet",
            "description": "Global eSIM data plans for travelers, backpackers, and hostel guests. Instant activation in 200+ countries.",
            "url": process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com',
            "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/images/logo.png`,
            "sameAs": [
              "https://twitter.com/roamjet",
              "https://facebook.com/roamjet",
              "https://instagram.com/roamjet"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["English", "Arabic", "French", "German", "Spanish", "Hebrew", "Russian"]
            },
            "offers": {
              "@type": "Offer",
              "description": "eSIM data plans for 200+ countries",
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