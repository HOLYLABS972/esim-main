

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
  title: 'سياسة الخصوصية - Roam Jet Plans | حماية معلوماتك الشخصية',
  description: 'سياسة الخصوصية الخاصة بنا توضح كيف نجمع ونستخدم ونحمي معلوماتك الشخصية. شفافية كاملة في حماية الخصوصية.',
  keywords: [
    'سياسة الخصوصية', 'حماية الخصوصية', 'المعلومات الشخصية', 'GDPR', 'حماية البيانات',
    'خصوصية المستخدمين', 'أمان المعلومات', 'حماية البيانات', 'شفافية الخصوصية'
  ],
  authors: [{ name: 'فريق Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/arabic/privacy-policy',
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
    locale: 'ar_SA',
    url: '/arabic/privacy-policy',
    title: 'سياسة الخصوصية - Roam Jet Plans | حماية معلوماتك الشخصية',
    description: 'سياسة الخصوصية الخاصة بنا توضح كيف نجمع ونستخدم ونحمي معلوماتك الشخصية. شفافية كاملة في حماية الخصوصية.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/privacy-og-image-ar.jpg',
        width: 1200,
        height: 630,
        alt: 'سياسة الخصوصية - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سياسة الخصوصية - Roam Jet Plans | حماية معلوماتك الشخصية',
    description: 'سياسة الخصوصية الخاصة بنا توضح كيف نجمع ونستخدم ونحمي معلوماتك الشخصية.',
    images: ['/images/privacy-twitter-image-ar.jpg'],
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

export default function ArabicPrivacyPolicyPage() {
  return (
    <RTLWrapper>
      <PrivacyPolicy language="ar" />
    </RTLWrapper>
  );
}
