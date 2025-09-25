import { Suspense } from 'react'
import Blog from '../../../src/components/Blog'
import Loading from '../../../src/components/Loading'

export const metadata = {
  title: 'Blog Español - Consejos de Viaje eSIM y Noticias | Roam Jet Plans',
  description: 'Lee nuestros últimos consejos de viaje eSIM, noticias e insights en español. Mantente informado sobre soluciones de conectividad global, guías de viaje y actualizaciones de tecnología eSIM.',
  keywords: [
    'blog eSIM español', 'consejos viaje español', 'noticias eSIM español', 'blog conectividad global',
    'guía viaje eSIM español', 'blog roaming internacional', 'tecnología eSIM español',
    'consejos internet viaje español', 'reseñas eSIM español', 'blog conectividad viaje'
  ],
  authors: [{ name: 'Equipo Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/spanish/blog',
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
    locale: 'es_ES',
    url: '/spanish/blog',
    title: 'Blog Español - Consejos de Viaje eSIM y Noticias | Roam Jet Plans',
    description: 'Lee nuestros últimos consejos de viaje eSIM, noticias e insights en español. Mantente informado sobre soluciones de conectividad global.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/blog-og-image-es.jpg',
        width: 1200,
        height: 630,
        alt: 'Blog Español - Consejos de Viaje eSIM y Noticias',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blog Español - Consejos de Viaje eSIM y Noticias | Roam Jet Plans',
    description: 'Lee nuestros últimos consejos de viaje eSIM, noticias e insights en español. Mantente informado sobre soluciones de conectividad global.',
    images: ['/images/blog-twitter-image-es.jpg'],
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

export default function SpanishBlogPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Blog language="es" />
    </Suspense>
  )
}
