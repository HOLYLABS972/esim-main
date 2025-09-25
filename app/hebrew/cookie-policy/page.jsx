

import dynamic from 'next/dynamic';
import RTLWrapper from '../../../src/components/RTLWrapper';

const CookiePolicy = dynamic(() => import('../../../src/components/CookiePolicy'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export const metadata = {
  title: 'מדיניות עוגיות - Roam Jet Plans | שימוש בעוגיות באתר',
  description: 'מדיניות העוגיות שלנו מסבירה איך אנו משתמשים בעוגיות ובטכנולוגיות דומות לאספקת השירותים שלנו ולשיפור החוויה שלכם.',
  keywords: [
    'מדיניות עוגיות', 'עוגיות אתר', 'עוגיות ממוקדות', 'עוגיות פונקציונליות', 'עוגיות אנליטיקה',
    'עוגיות שיווק', 'עוגיות הכרחיות', 'הגדרות עוגיות', 'ניהול עוגיות'
  ],
  authors: [{ name: 'צוות Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/hebrew/cookie-policy',
    languages: {
      'en': '/cookie-policy',
      'ar': '/arabic/cookie-policy',
      'fr': '/french/cookie-policy', 
      'de': '/german/cookie-policy',
      'es': '/spanish/cookie-policy',
      'he': '/hebrew/cookie-policy',
      'ru': '/russian/cookie-policy'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: '/hebrew/cookie-policy',
    title: 'מדיניות עוגיות - Roam Jet Plans | שימוש בעוגיות באתר',
    description: 'מדיניות העוגיות שלנו מסבירה איך אנו משתמשים בעוגיות ובטכנולוגיות דומות לאספקת השירותים שלנו ולשיפור החוויה שלכם.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/cookie-og-image-he.jpg',
        width: 1200,
        height: 630,
        alt: 'מדיניות עוגיות - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'מדיניות עוגיות - Roam Jet Plans | שימוש בעוגיות באתר',
    description: 'מדיניות העוגיות שלנו מסבירה איך אנו משתמשים בעוגיות ובטכנולוגיות דומות לאספקת השירותים שלנו ולשיפור החוויה שלכם.',
    images: ['/images/cookie-twitter-image-he.jpg'],
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
}

export default function HebrewCookiePolicyPage() {
  return (
    <RTLWrapper>
      <CookiePolicy language="he" />
    </RTLWrapper>
  );
}
