import { Suspense } from 'react'
import Blog from '../../../src/components/Blog'
import Loading from '../../../src/components/Loading'

export const metadata = {
  title: 'Blog Français - Conseils Voyage eSIM & Actualités | Roam Jet Plans',
  description: 'Lisez nos derniers conseils de voyage eSIM, actualités et insights en français. Restez informé des solutions de connectivité mondiale, guides de voyage et mises à jour technologiques eSIM.',
  keywords: [
    'blog eSIM français', 'conseils voyage français', 'actualités eSIM français', 'blog connectivité mondiale',
    'guide voyage eSIM français', 'blog roaming international', 'technologie eSIM français',
    'conseils internet voyage français', 'avis eSIM français', 'blog connectivité voyage'
  ],
  authors: [{ name: 'Équipe Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/french/blog',
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
    locale: 'fr_FR',
    url: '/french/blog',
    title: 'Blog Français - Conseils Voyage eSIM & Actualités | Roam Jet Plans',
    description: 'Lisez nos derniers conseils de voyage eSIM, actualités et insights en français. Restez informé des solutions de connectivité mondiale.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/blog-og-image-fr.jpg',
        width: 1200,
        height: 630,
        alt: 'Blog Français - Conseils Voyage eSIM & Actualités',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Français - Conseils Voyage eSIM & Actualités | Roam Jet Plans',
    description: 'Lisez nos derniers conseils de voyage eSIM, actualités et insights en français. Restez informé des solutions de connectivité mondiale.',
    images: ['/images/blog-twitter-image-fr.jpg'],
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

export default function FrenchBlogPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Blog language="fr" />
    </Suspense>
  )
}
