import { Suspense } from 'react'
import Blog from '../../../src/components/Blog'
import Loading from '../../../src/components/Loading'

export const metadata = {
  title: 'Русский Блог - Советы Путешествий eSIM и Новости | Roam Jet Plans',
  description: 'Читайте наши последние советы путешествий eSIM, новости и инсайты на русском языке. Оставайтесь в курсе глобальных решений подключения, путеводителей и обновлений технологий eSIM.',
  keywords: [
    'блог eSIM русский', 'советы путешествий русский', 'новости eSIM русский', 'блог глобального подключения',
    'путеводитель путешествий eSIM русский', 'блог международного роуминга', 'технология eSIM русский',
    'советы интернета путешествий русский', 'обзоры eSIM русский', 'блог подключения путешествий'
  ],
  authors: [{ name: 'Команда Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/russian/blog',
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
    locale: 'ru_RU',
    url: '/russian/blog',
    title: 'Русский Блог - Советы Путешествий eSIM и Новости | Roam Jet Plans',
    description: 'Читайте наши последние советы путешествий eSIM, новости и инсайты на русском языке. Оставайтесь в курсе глобальных решений подключения.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/blog-og-image-ru.jpg',
        width: 1200,
        height: 630,
        alt: 'Русский Блог - Советы Путешествий eSIM и Новости',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Русский Блог - Советы Путешествий eSIM и Новости | Roam Jet Plans',
    description: 'Читайте наши последние советы путешествий eSIM, новости и инсайты на русском языке. Оставайтесь в курсе глобальных решений подключения.',
    images: ['/images/blog-twitter-image-ru.jpg'],
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

export default function RussianBlogPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Blog language="ru" />
    </Suspense>
  )
}
