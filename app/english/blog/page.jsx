import { Suspense } from 'react'
import Blog from '../../../src/components/Blog'
import Loading from '../../../src/components/Loading'

export const metadata = {
  title: 'English Blog - eSIM Travel Tips & News | Roam Jet Plans',
  description: 'Read our latest eSIM travel tips, news, and insights in English. Stay updated with global connectivity solutions, travel guides, and eSIM technology updates.',
  keywords: [
    'eSIM blog English', 'travel tips English', 'eSIM news English', 'global connectivity blog',
    'eSIM travel guide English', 'international roaming blog', 'eSIM technology English',
    'travel internet tips English', 'eSIM reviews English', 'travel connectivity blog'
  ],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/english/blog',
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
    locale: 'en_US',
    url: '/english/blog',
    title: 'English Blog - eSIM Travel Tips & News | Roam Jet Plans',
    description: 'Read our latest eSIM travel tips, news, and insights in English. Stay updated with global connectivity solutions.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/blog-og-image-en.jpg',
        width: 1200,
        height: 630,
        alt: 'English Blog - eSIM Travel Tips & News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'English Blog - eSIM Travel Tips & News | Roam Jet Plans',
    description: 'Read our latest eSIM travel tips, news, and insights in English. Stay updated with global connectivity solutions.',
    images: ['/images/blog-twitter-image-en.jpg'],
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

export default function EnglishBlogPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Blog language="en" />
    </Suspense>
  )
}
