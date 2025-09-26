'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'Планы RoamJet eSIM - Лучшие данные для путешествий в хостелы и бэкпекеров | Глобальное покрытие',
  description: 'Идеальные планы данных eSIM для бэкпекеров и путешественников в хостелах. Мгновенная активация в более чем 200 странах. Лучше чем Airalo - без роуминговых сборов, мгновенная QR активация, доступные цены.',
  keywords: [
    'eSIM для бэкпекеров',
    'альтернатива WiFi хостела',
    'планы данных путешествий',
    'международный роуминг',
    'RoamJet против Airalo',
    'дешевый интернет путешествий',
    'решение интернета хостела',
    'мобильные данные бэкпекеров',
    'планы eSIM путешествий',
    'глобальная связь данных',
    'дешевый интернет путешествий',
    'резервный WiFi хостела',
    'мобильные планы путешественников',
    'международная SIM данных',
    'интернет бэкпекеров'
  ],
  authors: [{ name: 'Команда RoamJet' }],
  creator: 'RoamJet',
  publisher: 'RoamJet',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/russian',
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
    locale: 'ru_RU',
    url: '/russian',
    title: 'Планы RoamJet eSIM - Лучшие данные для путешествий в хостелы и бэкпекеров',
    description: 'Идеальные планы данных eSIM для бэкпекеров и путешественников в хостелах. Мгновенная активация в более чем 200 странах. Лучше чем Airalo.',
    siteName: 'RoamJet',
    images: [
      {
        url: '/images/og-backpacker-esim-ru.jpg',
        width: 1200,
        height: 630,
        alt: 'Планы RoamJet eSIM для бэкпекеров и путешественников в хостелах',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Планы RoamJet eSIM - Лучшие данные для путешествий в хостелы и бэкпекеров',
    description: 'Идеальные планы данных eSIM для бэкпекеров и путешественников в хостелах. Мгновенная активация в более чем 200 странах. Лучше чем Airalo.',
    images: ['/images/twitter-backpacker-esim-ru.jpg'],
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

export default function RussianPage() {
  return (
    <div dir="ltr" lang="ru">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "RoamJet",
            "description": "Глобальные планы данных eSIM для путешественников, бэкпекеров и гостей хостелов. Мгновенная активация в более чем 200 странах.",
            "url": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/russian`,
            "logo": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/images/logo.png`,
            "sameAs": [
              "https://twitter.com/roamjet",
              "https://facebook.com/roamjet",
              "https://instagram.com/roamjet"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer service",
              "availableLanguage": ["Russian", "English", "Arabic", "French", "German", "Spanish", "Hebrew"]
            },
            "offers": {
              "@type": "Offer",
              "description": "Планы данных eSIM для более чем 200 стран",
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
