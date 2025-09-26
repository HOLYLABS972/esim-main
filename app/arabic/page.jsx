'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'خطط RoamJet eSIM - أفضل بيانات السفر للنزل والرحالة | تغطية عالمية',
  description: 'خطط بيانات eSIM مثالية للرحالة وضيوف النزل. تفعيل فوري في أكثر من 200 دولة. أفضل من Airalo - بدون رسوم تجوال، تفعيل QR فوري، أسعار ميسورة.',
  keywords: [
    'eSIM للرحالة',
    'بديل واي فاي النزل',
    'خطط بيانات السفر',
    'التجوال الدولي',
    'RoamJet مقابل Airalo',
    'إنترنت السفر الاقتصادي',
    'حل إنترنت النزل',
    'بيانات الهاتف للرحالة',
    'خطط eSIM للسفر',
    'الاتصال العالمي بالبيانات',
    'إنترنت السفر الرخيص',
    'نسخ احتياطي واي فاي النزل',
    'خطط الهاتف للمسافرين',
    'SIM بيانات دولي',
    'إنترنت الرحالة'
  ],
  authors: [{ name: 'فريق RoamJet' }],
  creator: 'RoamJet',
  publisher: 'RoamJet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/arabic',
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
    locale: 'ar_SA',
    url: '/arabic',
    title: 'خطط RoamJet eSIM - أفضل بيانات السفر للنزل والرحالة',
    description: 'خطط بيانات eSIM مثالية للرحالة وضيوف النزل. تفعيل فوري في أكثر من 200 دولة. أفضل من Airalo - بدون رسوم تجوال، تفعيل QR فوري.',
    siteName: 'RoamJet',
    images: [
      {
        url: '/images/og-backpacker-esim-ar.jpg',
        width: 1200,
        height: 630,
        alt: 'خطط RoamJet eSIM للرحالة وضيوف النزل',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'خطط RoamJet eSIM - أفضل بيانات السفر للنزل والرحالة',
    description: 'خطط بيانات eSIM مثالية للرحالة وضيوف النزل. تفعيل فوري في أكثر من 200 دولة. أفضل من Airalo.',
    images: ['/images/twitter-backpacker-esim-ar.jpg'],
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

export default function ArabicPage() {
  return (
    <div dir="rtl" lang="ar">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "RoamJet",
            "description": "خطط بيانات eSIM عالمية للمسافرين والرحالة وضيوف النزل. تفعيل فوري في أكثر من 200 دولة.",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/arabic`,
            "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/images/logo.png`,
            "sameAs": [
              "https://twitter.com/roamjet",
              "https://facebook.com/roamjet",
              "https://instagram.com/roamjet"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["Arabic", "English", "French", "German", "Spanish", "Hebrew", "Russian"]
            },
            "offers": {
              "@type": "Offer",
              "description": "خطط بيانات eSIM لأكثر من 200 دولة",
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
