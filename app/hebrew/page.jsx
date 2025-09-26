'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'תוכניות RoamJet eSIM - נתוני נסיעות הטובים ביותר למלונות זולים ותרמילאים | כיסוי עולמי',
  description: 'תוכניות נתונים eSIM מושלמות לתרמילאים ומטיילים במלונות זולים. הפעלה מיידית ביותר מ-200 מדינות. טוב יותר מ-Airalo - ללא עמלות נדידה, הפעלת QR מיידית, מחירים זולים.',
  keywords: [
    'eSIM לתרמילאים',
    'חלופה ל-WiFi מלון זול',
    'תוכניות נתוני נסיעות',
    'נדידה בינלאומית',
    'RoamJet מול Airalo',
    'אינטרנט נסיעות זול',
    'פתרון אינטרנט מלון זול',
    'נתונים ניידים לתרמילאים',
    'תוכניות eSIM נסיעות',
    'קישוריות נתונים גלובלית',
    'אינטרנט נסיעות זול',
    'גיבוי WiFi מלון זול',
    'תוכניות נייד למטיילים',
    'SIM נתונים בינלאומי',
    'אינטרנט תרמילאים'
  ],
  authors: [{ name: 'צוות RoamJet' }],
  creator: 'RoamJet',
  publisher: 'RoamJet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/hebrew',
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
    locale: 'he_IL',
    url: '/hebrew',
    title: 'תוכניות RoamJet eSIM - נתוני נסיעות הטובים ביותר למלונות זולים ותרמילאים',
    description: 'תוכניות נתונים eSIM מושלמות לתרמילאים ומטיילים במלונות זולים. הפעלה מיידית ביותר מ-200 מדינות. טוב יותר מ-Airalo.',
    siteName: 'RoamJet',
    images: [
      {
        url: '/images/og-backpacker-esim-he.jpg',
        width: 1200,
        height: 630,
        alt: 'תוכניות RoamJet eSIM לתרמילאים ומטיילים במלונות זולים',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'תוכניות RoamJet eSIM - נתוני נסיעות הטובים ביותר למלונות זולים ותרמילאים',
    description: 'תוכניות נתונים eSIM מושלמות לתרמילאים ומטיילים במלונות זולים. הפעלה מיידית ביותר מ-200 מדינות. טוב יותר מ-Airalo.',
    images: ['/images/twitter-backpacker-esim-he.jpg'],
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

export default function HebrewPage() {
  return (
    <div dir="rtl" lang="he">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "RoamJet",
            "description": "תוכניות נתונים eSIM גלובליות למטיילים, תרמילאים ואורחי מלונות זולים. הפעלה מיידית ביותר מ-200 מדינות.",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/hebrew`,
            "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/images/logo.png`,
            "sameAs": [
              "https://twitter.com/roamjet",
              "https://facebook.com/roamjet",
              "https://instagram.com/roamjet"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["Hebrew", "English", "Arabic", "French", "German", "Spanish", "Russian"]
            },
            "offers": {
              "@type": "Offer",
              "description": "תוכניות נתונים eSIM ביותר מ-200 מדינות",
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
