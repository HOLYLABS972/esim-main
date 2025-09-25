import { Suspense } from 'react'
import Blog from '../../../src/components/Blog'
import Loading from '../../../src/components/Loading'

export const metadata = {
  title: 'Deutscher Blog - eSIM Reisetipps & News | Roam Jet Plans',
  description: 'Lesen Sie unsere neuesten eSIM Reisetipps, News und Einblicke auf Deutsch. Bleiben Sie informiert über globale Konnektivitätslösungen, Reiseführer und eSIM-Technologie-Updates.',
  keywords: [
    'eSIM Blog Deutsch', 'Reisetipps Deutsch', 'eSIM News Deutsch', 'globale Konnektivität Blog',
    'eSIM Reiseführer Deutsch', 'internationales Roaming Blog', 'eSIM Technologie Deutsch',
    'Internet Reisetipps Deutsch', 'eSIM Bewertungen Deutsch', 'Reise Konnektivität Blog'
  ],
  authors: [{ name: 'Roam Jet Plans Team' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/german/blog',
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
    locale: 'de_DE',
    url: '/german/blog',
    title: 'Deutscher Blog - eSIM Reisetipps & News | Roam Jet Plans',
    description: 'Lesen Sie unsere neuesten eSIM Reisetipps, News und Einblicke auf Deutsch. Bleiben Sie informiert über globale Konnektivitätslösungen.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/blog-og-image-de.jpg',
        width: 1200,
        height: 630,
        alt: 'Deutscher Blog - eSIM Reisetipps & News',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deutscher Blog - eSIM Reisetipps & News | Roam Jet Plans',
    description: 'Lesen Sie unsere neuesten eSIM Reisetipps, News und Einblicke auf Deutsch. Bleiben Sie informiert über globale Konnektivitätslösungen.',
    images: ['/images/blog-twitter-image-de.jpg'],
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

export default function GermanBlogPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Blog language="de" />
    </Suspense>
  )
}
