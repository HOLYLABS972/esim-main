import { Suspense } from 'react'
import Blog from '../../../src/components/Blog'
import Loading from '../../../src/components/Loading'

export const metadata = {
  title: 'المدونة العربية - نصائح السفر eSIM والأخبار | Roam Jet Plans',
  description: 'اقرأ أحدث نصائح السفر eSIM والأخبار والرؤى باللغة العربية. ابق محدثًا مع حلول الاتصال العالمي وأدلة السفر وتحديثات تقنية eSIM.',
  keywords: [
    'مدونة eSIM عربية', 'نصائح السفر العربية', 'أخبار eSIM عربية', 'مدونة الاتصال العالمي',
    'دليل السفر eSIM عربي', 'مدونة التجوال الدولي', 'تقنية eSIM عربية',
    'نصائح الإنترنت للسفر العربية', 'مراجعات eSIM عربية', 'مدونة اتصال السفر'
  ],
  authors: [{ name: 'فريق Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/arabic/blog',
    languages: {
      'en': '/english/blog',
      'ar': '/arabic/blog',
      'fr': '/french/blog', 
      'de': '/german/blog',
      'es': '/spanish/blog',
      'he': '/hebrew/blog',
      'ru': '/russian/blog'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: '/arabic/blog',
    title: 'المدونة العربية - نصائح السفر eSIM والأخبار | Roam Jet Plans',
    description: 'اقرأ أحدث نصائح السفر eSIM والأخبار والرؤى باللغة العربية. ابق محدثًا مع حلول الاتصال العالمي.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/blog-og-image-ar.jpg',
        width: 1200,
        height: 630,
        alt: 'المدونة العربية - نصائح السفر eSIM والأخبار',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'المدونة العربية - نصائح السفر eSIM والأخبار | Roam Jet Plans',
    description: 'اقرأ أحدث نصائح السفر eSIM والأخبار والرؤى باللغة العربية. ابق محدثًا مع حلول الاتصال العالمي.',
    images: ['/images/blog-twitter-image-ar.jpg'],
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

export default function ArabicBlogPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Blog language="ar" />
    </Suspense>
  )
}
