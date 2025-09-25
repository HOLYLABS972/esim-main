import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'eSIM Россия - Планы Roam Jet для российских путешественников | Дешевле чем Airalo',
  description: 'eSIM для России: Более дешевая альтернатива Airalo, Roamless, Saily и Esimo. Планы данных для российских путешественников в более чем 200 странах. Мгновенная активация, без роуминга. Идеально для России в США, Германию, Азию. От 5$. Поддержка клиентов на русском.',
  keywords: [
    'eSIM Россия', 'eSIM для россиян', 'планы данных Россия', 'российские путешественники eSIM', 
    'eSIM Россия США', 'eSIM Россия Германия', 'eSIM Россия Азия', 'eSIM Россия Европа',
    'eSIM Россия Канада', 'eSIM Россия Япония', 'eSIM Россия Таиланд', 'eSIM Россия Австралия',
    'дешевый eSIM Россия', 'активация eSIM Россия', 'провайдеры eSIM Россия', 'eSIM без роуминга',
    'международные планы данных Россия', 'eSIM для деловых поездок Россия', 'eSIM для отпуска Россия',
    'eSIM для студентов Россия', 'eSIM для путешественников Россия', 'eSIM для деловых поездок Россия',
    'eSIM Россия Франция', 'eSIM Россия Италия', 'eSIM Россия Испания', 'eSIM Россия Португалия',
    'eSIM Россия Греция', 'eSIM Россия Турция', 'eSIM Россия Кипр', 'eSIM Россия ОАЭ',
    'eSIM Россия Египет', 'eSIM Россия Марокко', 'eSIM Россия Тунис', 'eSIM Россия Дубай',
    'Airalo Россия', 'альтернатива Airalo', 'Roamless Россия', 'альтернатива Roamless',
    'Saily Россия', 'альтернатива Saily', 'Esimo Россия', 'альтернатива Esimo',
    'сравнение eSIM Россия', 'лучший eSIM Россия', 'самый дешевый eSIM Россия',
    'Airalo против Roam Jet', 'Roamless против Roam Jet', 'Saily против Roam Jet', 'Esimo против Roam Jet',
    'сравнение провайдеров eSIM', 'тест eSIM Россия', 'отзывы eSIM Россия'
  ],
  authors: [{ name: 'Команда Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
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
    title: 'eSIM Россия - Планы Roam Jet для российских путешественников | Дешевле чем Airalo',
    description: 'eSIM для России: Более дешевая альтернатива Airalo, Roamless, Saily и Esimo. Планы данных для российских путешественников в более чем 200 странах. Мгновенная активация, без роуминга.',
    siteName: 'Roam Jet Plans Россия',
    images: [
      {
        url: '/images/og-image-ru.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM Россия - Планы Roam Jet для российских путешественников',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM Россия - Планы Roam Jet для российских путешественников | Дешевле чем Airalo',
    description: 'eSIM для России: Более дешевая альтернатива Airalo, Roamless, Saily и Esimo. Планы данных для российских путешественников в более чем 200 странах.',
    images: ['/images/twitter-image-ru.jpg'],
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

export default function RussianPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Roam Jet Plans",
    "description": "Более дешевая альтернатива Airalo, Roamless, Saily и Esimo. Глобальные планы данных eSIM для российских путешественников в более чем 200 странах. Мгновенная активация, физическая SIM-карта не нужна.",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/russian`,
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
      "availableLanguage": ["Russian", "English", "Arabic", "French", "German", "Spanish", "Hebrew"]
    },
    "offers": {
      "@type": "Offer",
      "name": "Планы данных eSIM",
      "description": "Планы данных eSIM дешевле чем Airalo, Roamless, Saily и Esimo для международных поездок из России",
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
      
      <div dir="ltr" lang="ru">
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
