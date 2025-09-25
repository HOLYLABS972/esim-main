

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
  title: 'شروط الخدمة - Roam Jet Plans | الشروط والأحكام',
  description: 'تحدد شروط الخدمة الخاصة بنا حقوقك والتزاماتك وحقوق والتزامات Roam Jet Plans في استخدام خدمات eSIM الخاصة بنا.',
  keywords: [
    'شروط الخدمة', 'الشروط والأحكام', 'اتفاقية الخدمة', 'حقوق المستخدم', 'التزامات المستخدم',
    'قيود الخدمة', 'إلغاء الخدمة', 'التعويضات', 'مسؤولية الخدمة'
  ],
  authors: [{ name: 'فريق Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/arabic/terms-of-service',
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
    locale: 'ar_SA',
    url: '/arabic/terms-of-service',
    title: 'شروط الخدمة - Roam Jet Plans | الشروط والأحكام',
    description: 'تحدد شروط الخدمة الخاصة بنا حقوقك والتزاماتك وحقوق والتزامات Roam Jet Plans في استخدام خدمات eSIM الخاصة بنا.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/terms-og-image-ar.jpg',
        width: 1200,
        height: 630,
        alt: 'شروط الخدمة - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'شروط الخدمة - Roam Jet Plans | الشروط والأحكام',
    description: 'تحدد شروط الخدمة الخاصة بنا حقوقك والتزاماتك وحقوق والتزامات Roam Jet Plans في استخدام خدمات eSIM الخاصة بنا.',
    images: ['/images/terms-twitter-image-ar.jpg'],
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

export default function ArabicTermsOfServicePage() {
  return (
    <RTLWrapper>
      <TermsOfService language="ar" />
    </RTLWrapper>
  );
}
