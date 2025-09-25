import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'eSIM ישראל - תוכניות Roam Jet למטיילים ישראלים | חלופה זולה יותר מ-Airalo',
  description: 'eSIM לישראל: חלופה זולה יותר מ-Airalo, Roamless, Saily ו-Esimo. תוכניות נתונים למטיילים ישראלים ביותר מ-200 מדינות. הפעלה מיידית, ללא רומינג. מושלם לישראל לארה"ב, גרמניה, אסיה. החל מ-5 דולר. תמיכת לקוחות בעברית.',
  keywords: [
    'eSIM ישראל', 'eSIM לישראלים', 'תוכניות נתונים ישראל', 'מטיילים ישראלים eSIM', 
    'eSIM ישראל ארה"ב', 'eSIM ישראל גרמניה', 'eSIM ישראל אסיה', 'eSIM ישראל אירופה',
    'eSIM ישראל קנדה', 'eSIM ישראל יפן', 'eSIM ישראל תאילנד', 'eSIM ישראל אוסטרליה',
    'eSIM זול לישראל', 'הפעלת eSIM ישראל', 'ספקי eSIM ישראל', 'eSIM ללא רומינג',
    'תוכניות נתונים בינלאומיות ישראל', 'eSIM לנסיעות עסקים ישראל', 'eSIM לחופשות ישראל',
    'eSIM לסטודנטים ישראל', 'eSIM לטיילים ישראל', 'eSIM לנסיעות עסקים ישראל',
    'eSIM ישראל צרפת', 'eSIM ישראל איטליה', 'eSIM ישראל ספרד', 'eSIM ישראל פורטוגל',
    'eSIM ישראל יוון', 'eSIM ישראל טורקיה', 'eSIM ישראל קפריסין', 'eSIM ישראל ירדן',
    'eSIM ישראל מצרים', 'eSIM ישראל מרוקו', 'eSIM ישראל תוניסיה', 'eSIM ישראל דובאי',
    'Airalo ישראל', 'חלופה ל-Airalo', 'Roamless ישראל', 'חלופה ל-Roamless',
    'Saily ישראל', 'חלופה ל-Saily', 'Esimo ישראל', 'חלופה ל-Esimo',
    'השוואת eSIM ישראל', 'הכי טוב eSIM ישראל', 'הכי זול eSIM ישראל',
    'Airalo מול Roam Jet', 'Roamless מול Roam Jet', 'Saily מול Roam Jet', 'Esimo מול Roam Jet',
    'השוואת ספקי eSIM', 'בדיקת eSIM ישראל', 'ביקורות eSIM ישראל'
  ],
  authors: [{ name: 'צוות Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
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
    title: 'eSIM ישראל - תוכניות Roam Jet למטיילים ישראלים | חלופה זולה יותר מ-Airalo',
    description: 'eSIM לישראל: חלופה זולה יותר מ-Airalo, Roamless, Saily ו-Esimo. תוכניות נתונים למטיילים ישראלים ביותר מ-200 מדינות. הפעלה מיידית, ללא רומינג.',
    siteName: 'Roam Jet Plans ישראל',
    images: [
      {
        url: '/images/og-image-he.jpg',
        width: 1200,
        height: 630,
        alt: 'eSIM ישראל - תוכניות Roam Jet למטיילים ישראלים',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eSIM ישראל - תוכניות Roam Jet למטיילים ישראלים | חלופה זולה יותר מ-Airalo',
    description: 'eSIM לישראל: חלופה זולה יותר מ-Airalo, Roamless, Saily ו-Esimo. תוכניות נתונים למטיילים ישראלים ביותר מ-200 מדינות.',
    images: ['/images/twitter-image-he.jpg'],
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

export default function HebrewPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Roam Jet Plans",
    "description": "חלופה זולה יותר מ-Airalo, Roamless, Saily ו-Esimo. תוכניות נתונים eSIM גלובליות למטיילים ישראלים ביותר מ-200 מדינות. הפעלה מיידית, אין צורך בכרטיס SIM פיזי.",
    "url": `${process.env.NEXT_PUBLIC_BASE_URL || "https://esimplans.com"}/hebrew`,
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
      "availableLanguage": ["Hebrew", "English", "Arabic", "French", "German", "Spanish", "Russian"]
    },
    "offers": {
      "@type": "Offer",
      "name": "תוכניות נתונים eSIM",
      "description": "תוכניות נתונים eSIM זולות יותר מ-Airalo, Roamless, Saily ו-Esimo לנסיעות בינלאומיות מישראל",
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
      
      <div dir="rtl" lang="he">
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
