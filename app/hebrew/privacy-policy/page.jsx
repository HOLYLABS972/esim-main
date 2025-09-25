

import dynamic from 'next/dynamic';
import RTLWrapper from '../../../src/components/RTLWrapper';

const PrivacyPolicy = dynamic(() => import('../../../src/components/PrivacyPolicy'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export const metadata = {
  title: 'מדיניות פרטיות - Roam Jet Plans | הגנה על המידע האישי שלך',
  description: 'מדיניות הפרטיות שלנו מסבירה איך אנו אוספים, משתמשים ומגנים על המידע האישי שלך. שקיפות מלאה בהגנה על הפרטיות.',
  keywords: [
    'מדיניות פרטיות', 'הגנה על פרטיות', 'מידע אישי', 'GDPR', 'הגנת נתונים',
    'פרטיות משתמשים', 'אבטחת מידע', 'הגנה על נתונים', 'שקיפות פרטיות'
  ],
  authors: [{ name: 'צוות Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/hebrew/privacy-policy',
    languages: {
      'en': '/privacy-policy',
      'ar': '/arabic/privacy-policy',
      'fr': '/french/privacy-policy', 
      'de': '/german/privacy-policy',
      'es': '/spanish/privacy-policy',
      'he': '/hebrew/privacy-policy',
      'ru': '/russian/privacy-policy'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: '/hebrew/privacy-policy',
    title: 'מדיניות פרטיות - Roam Jet Plans | הגנה על המידע האישי שלך',
    description: 'מדיניות הפרטיות שלנו מסבירה איך אנו אוספים, משתמשים ומגנים על המידע האישי שלך. שקיפות מלאה בהגנה על הפרטיות.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/privacy-og-image-he.jpg',
        width: 1200,
        height: 630,
        alt: 'מדיניות פרטיות - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'מדיניות פרטיות - Roam Jet Plans | הגנה על המידע האישי שלך',
    description: 'מדיניות הפרטיות שלנו מסבירה איך אנו אוספים, משתמשים ומגנים על המידע האישי שלך.',
    images: ['/images/privacy-twitter-image-he.jpg'],
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

export default function HebrewPrivacyPolicyPage() {
  return (
    <RTLWrapper>
      <PrivacyPolicy language="he" />
    </RTLWrapper>
  );
}
