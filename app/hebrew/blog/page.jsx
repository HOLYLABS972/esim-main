import { Suspense } from 'react'
import Blog from '../../../src/components/Blog'
import Loading from '../../../src/components/Loading'

export const metadata = {
  title: 'בלוג עברי - טיפי נסיעות eSIM וחדשות | Roam Jet Plans',
  description: 'קראו את הטיפים, החדשות והתובנות האחרונות שלנו על eSIM בעברית. הישארו מעודכנים עם פתרונות חיבור גלובליים, מדריכי נסיעות ועדכוני טכנולוגיית eSIM.',
  keywords: [
    'בלוג eSIM עברי', 'טיפי נסיעות עברי', 'חדשות eSIM עברי', 'בלוג חיבור גלובלי',
    'מדריך נסיעות eSIM עברי', 'בלוג רומינג בינלאומי', 'טכנולוגיית eSIM עברי',
    'טיפי אינטרנט נסיעות עברי', 'ביקורות eSIM עברי', 'בלוג חיבור נסיעות'
  ],
  authors: [{ name: 'צוות Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/hebrew/blog',
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
    locale: 'he_IL',
    url: '/hebrew/blog',
    title: 'בלוג עברי - טיפי נסיעות eSIM וחדשות | Roam Jet Plans',
    description: 'קראו את הטיפים, החדשות והתובנות האחרונות שלנו על eSIM בעברית. הישארו מעודכנים עם פתרונות חיבור גלובליים.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/blog-og-image-he.jpg',
        width: 1200,
        height: 630,
        alt: 'בלוג עברי - טיפי נסיעות eSIM וחדשות',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'בלוג עברי - טיפי נסיעות eSIM וחדשות | Roam Jet Plans',
    description: 'קראו את הטיפים, החדשות והתובנות האחרונות שלנו על eSIM בעברית. הישארו מעודכנים עם פתרונות חיבור גלובליים.',
    images: ['/images/blog-twitter-image-he.jpg'],
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

export default function HebrewBlogPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Blog language="he" />
    </Suspense>
  )
}
