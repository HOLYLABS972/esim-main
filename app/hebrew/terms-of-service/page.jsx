

import dynamic from 'next/dynamic';
import RTLWrapper from '../../../src/components/RTLWrapper';

const TermsOfService = dynamic(() => import('../../../src/components/TermsOfService'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export const metadata = {
  title: 'תנאי שירות - Roam Jet Plans | תנאים והגבלות',
  description: 'תנאי השירות שלנו מגדירים את הזכויות והחובות שלכם ושל Roam Jet Plans בשימוש בשירותי ה-eSIM שלנו.',
  keywords: [
    'תנאי שירות', 'תנאים והגבלות', 'הסכם שירות', 'זכויות משתמש', 'חובות משתמש',
    'הגבלות שירות', 'ביטול שירות', 'פיצויים', 'אחריות שירות'
  ],
  authors: [{ name: 'צוות Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/hebrew/terms-of-service',
    languages: {
      'en': '/terms-of-service',
      'ar': '/arabic/terms-of-service',
      'fr': '/french/terms-of-service', 
      'de': '/german/terms-of-service',
      'es': '/spanish/terms-of-service',
      'he': '/hebrew/terms-of-service',
      'ru': '/russian/terms-of-service'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: '/hebrew/terms-of-service',
    title: 'תנאי שירות - Roam Jet Plans | תנאים והגבלות',
    description: 'תנאי השירות שלנו מגדירים את הזכויות והחובות שלכם ושל Roam Jet Plans בשימוש בשירותי ה-eSIM שלנו.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/terms-og-image-he.jpg',
        width: 1200,
        height: 630,
        alt: 'תנאי שירות - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'תנאי שירות - Roam Jet Plans | תנאים והגבלות',
    description: 'תנאי השירות שלנו מגדירים את הזכויות והחובות שלכם ושל Roam Jet Plans בשימוש בשירותי ה-eSIM שלנו.',
    images: ['/images/terms-twitter-image-he.jpg'],
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

export default function HebrewTermsOfServicePage() {
  return (
    <RTLWrapper>
      <TermsOfService language="he" />
    </RTLWrapper>
  );
}
