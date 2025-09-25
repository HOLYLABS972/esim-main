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
  title: 'سياسة ملفات تعريف الارتباط - Roam Jet Plans | استخدام ملفات تعريف الارتباط',
  description: 'توضح سياسة ملفات تعريف الارتباط الخاصة بنا كيف نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتقديم خدماتنا وتحسين تجربتك.',
  keywords: [
    'سياسة ملفات تعريف الارتباط', 'ملفات تعريف الارتباط', 'ملفات تعريف الارتباط المستهدفة', 'ملفات تعريف الارتباط الوظيفية', 'ملفات تعريف الارتباط التحليلية',
    'ملفات تعريف الارتباط التسويقية', 'ملفات تعريف الارتباط الضرورية', 'إعدادات ملفات تعريف الارتباط', 'إدارة ملفات تعريف الارتباط'
  ],
  authors: [{ name: 'فريق Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/arabic/cookie-policy',
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
    locale: 'ar_SA',
    url: '/arabic/cookie-policy',
    title: 'سياسة ملفات تعريف الارتباط - Roam Jet Plans | استخدام ملفات تعريف الارتباط',
    description: 'توضح سياسة ملفات تعريف الارتباط الخاصة بنا كيف نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتقديم خدماتنا وتحسين تجربتك.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/cookie-og-image-ar.jpg',
        width: 1200,
        height: 630,
        alt: 'سياسة ملفات تعريف الارتباط - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سياسة ملفات تعريف الارتباط - Roam Jet Plans | استخدام ملفات تعريف الارتباط',
    description: 'توضح سياسة ملفات تعريف الارتباط الخاصة بنا كيف نستخدم ملفات تعريف الارتباط والتقنيات المماثلة لتقديم خدماتنا وتحسين تجربتك.',
    images: ['/images/cookie-twitter-image-ar.jpg'],
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

export default function ArabicCookiePolicyPage() {
  return (
    <RTLWrapper>
      <CookiePolicy language="ar" />
    </RTLWrapper>
  );
}
