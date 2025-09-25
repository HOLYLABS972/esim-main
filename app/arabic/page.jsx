'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'eSIM للعالم العربي - خطط Roam Jet للمسافرين العرب | بديل أرخص من Airalo',
  description: 'eSIM للعالم العربي: بديل أرخص من Airalo و Roamless و Saily و Esimo. خطط بيانات للمسافرين العرب في أكثر من 200 دولة. تفعيل فوري، بدون تجوال. مثالي للسفر من الدول العربية إلى أوروبا وأمريكا وآسيا. من 5 دولار. دعم عملاء باللغة العربية.',
  keywords: [
    'eSIM للعالم العربي', 'eSIM للمسافرين العرب', 'خطط بيانات عربية', 'eSIM السعودية', 
    'eSIM الإمارات', 'eSIM قطر', 'eSIM الكويت', 'eSIM البحرين', 'eSIM عمان', 'eSIM الأردن',
    'eSIM لبنان', 'eSIM مصر', 'eSIM المغرب', 'eSIM تونس', 'eSIM الجزائر', 'eSIM العراق',
    'eSIM سوريا', 'eSIM فلسطين', 'eSIM اليمن', 'eSIM السودان', 'eSIM ليبيا',
    'eSIM العرب أوروبا', 'eSIM العرب أمريكا', 'eSIM العرب آسيا', 'eSIM العرب كندا',
    'eSIM رخيص للعرب', 'تفعيل eSIM للعرب', 'مزودي eSIM للعرب', 'eSIM بدون تجوال',
    'خطط بيانات دولية للعرب', 'eSIM للسفر التجاري للعرب', 'eSIM للعطل للعرب',
    'eSIM للطلاب العرب', 'eSIM للمسافرين العرب', 'eSIM للسفر التجاري للعرب',
    'Airalo للعرب', 'بديل Airalo', 'Roamless للعرب', 'بديل Roamless',
    'Saily للعرب', 'بديل Saily', 'Esimo للعرب', 'بديل Esimo',
    'مقارنة eSIM للعرب', 'أفضل eSIM للعرب', 'أرخص eSIM للعرب',
    'Airalo مقابل Roam Jet', 'Roamless مقابل Roam Jet', 'Saily مقابل Roam Jet', 'Esimo مقابل Roam Jet',
    'مقارنة مزودي eSIM', 'اختبار eSIM للعرب', 'مراجعات eSIM للعرب'
  ],
  authors: [{ name: 'فريق Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
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
    title: 'eSIM للعالم العربي - خطط Roam Jet للمسافرين العرب | بديل أرخص من Airalo',
    description: 'eSIM للعالم العربي: بديل أرخص من Airalo و Roamless و Saily و Esimo. خطط بيانات للمسافرين العرب في أكثر من 200 دولة. تفعيل فوري، بدون تجوال.',
    siteName: 'Roam Jet Plans للعالم العربي',
    images: [
      {
        url: '/images/og-image-ar.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM للعالم العربي - خطط Roam Jet للمسافرين العرب',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM للعالم العربي - خطط Roam Jet للمسافرين العرب | بديل أرخص من Airalo',
    description: 'eSIM للعالم العربي: بديل أرخص من Airalo و Roamless و Saily و Esimo. خطط بيانات للمسافرين العرب في أكثر من 200 دولة.',
    images: ['/images/twitter-image-ar.jpg'],
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

export default function ArabicPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Roam Jet Plans",
    "description": "بديل أرخص من Airalo و Roamless و Saily و Esimo. خطط البيانات العالمية لـ eSIM للمسافرين العرب في أكثر من 200 دولة. تفعيل فوري، لا حاجة لبطاقة SIM مادية.",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/arabic`,
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
      "availableLanguage": ["Arabic", "English", "French", "German", "Spanish", "Hebrew", "Russian"]
    },
    "offers": {
      "@type": "Offer",
      "name": "خطط بيانات eSIM",
      "description": "خطط بيانات eSIM أرخص من Airalo و Roamless و Saily و Esimo للسفر الدولي من الدول العربية",
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
      
      <div dir="rtl" lang="ar">
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
