import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../src/components/sections';

export const metadata = {
  title: 'eSIM USA - Roam Jet Plans for American Travelers | Cheaper than Airalo',
  description: 'eSIM for USA: Cheaper alternative to Airalo, Roamless, Saily & Esimo. Data plans for American travelers in 200+ countries. Instant activation, no roaming. Perfect for USA to Europe, Asia, Latin America. From $5. US customer support.',
  keywords: [
    'eSIM USA', 'eSIM for Americans', 'data plans USA', 'American travelers eSIM', 
    'eSIM USA Europe', 'eSIM USA Asia', 'eSIM USA Latin America', 'eSIM USA Canada',
    'cheap eSIM USA', 'eSIM activation USA', 'US eSIM providers', 'eSIM no roaming',
    'international data plans USA', 'eSIM for business travel USA', 'eSIM vacation USA',
    'eSIM students USA', 'eSIM backpackers USA', 'eSIM business travel USA',
    'eSIM USA Germany', 'eSIM USA Spain', 'eSIM USA France', 'eSIM USA Italy',
    'eSIM USA Japan', 'eSIM USA Thailand', 'eSIM USA Australia', 'eSIM USA Singapore',
    'eSIM USA Mexico', 'eSIM USA Brazil', 'eSIM USA Argentina', 'eSIM USA Chile',
    'Airalo USA', 'Airalo alternative', 'Roamless USA', 'Roamless alternative',
    'Saily USA', 'Saily alternative', 'Esimo USA', 'Esimo alternative',
    'eSIM comparison USA', 'best eSIM USA', 'cheapest eSIM USA',
    'Airalo vs Roam Jet', 'Roamless vs Roam Jet', 'Saily vs Roam Jet', 'Esimo vs Roam Jet',
    'eSIM provider comparison', 'eSIM test USA', 'eSIM reviews USA'
  ],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
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
    title: 'eSIM USA - Roam Jet Plans for American Travelers | Cheaper than Airalo',
    description: 'eSIM for USA: Cheaper alternative to Airalo, Roamless, Saily & Esimo. Data plans for American travelers in 200+ countries. Instant activation, no roaming.',
    siteName: 'Roam Jet Plans USA',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM USA - Roam Jet Plans for American Travelers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM USA - Roam Jet Plans for American Travelers | Cheaper than Airalo',
    description: 'eSIM for USA: Cheaper alternative to Airalo, Roamless, Saily & Esimo. Data plans for American travelers in 200+ countries.',
    images: ['/images/twitter-image.jpg'],
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
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION,
  },
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Roam Jet Plans",
    "description": "Cheaper alternative to Airalo, Roamless, Saily & Esimo. Global eSIM data plans for American travelers in 200+ countries. Instant activation, no physical SIM needed.",
    "url": process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com",
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
      "availableLanguage": ["English", "Arabic", "French", "German", "Spanish", "Hebrew", "Russian"]
    },
    "offers": {
      "@type": "Offer",
      "name": "eSIM Data Plans",
      "description": "Cheaper eSIM data plans than Airalo, Roamless, Saily & Esimo for international travel from USA",
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
      
      <div dir="ltr" lang="en">
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