

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
  title: 'Политика Файлов Cookie - Roam Jet Plans | Использование Файлов Cookie',
  description: 'Наша политика файлов cookie объясняет, как мы используем файлы cookie и аналогичные технологии для предоставления наших услуг и улучшения вашего опыта.',
  keywords: [
    'политика файлов cookie', 'файлы cookie', 'целевые файлы cookie', 'функциональные файлы cookie', 'аналитические файлы cookie',
    'маркетинговые файлы cookie', 'необходимые файлы cookie', 'настройки файлов cookie', 'управление файлами cookie'
  ],
  authors: [{ name: 'Команда Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/russian/cookie-policy',
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
    locale: 'ru_RU',
    url: '/russian/cookie-policy',
    title: 'Политика Файлов Cookie - Roam Jet Plans | Использование Файлов Cookie',
    description: 'Наша политика файлов cookie объясняет, как мы используем файлы cookie и аналогичные технологии для предоставления наших услуг и улучшения вашего опыта.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/cookie-og-image-ru.jpg',
        width: 1200,
        height: 630,
        alt: 'Политика Файлов Cookie - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Политика Файлов Cookie - Roam Jet Plans | Использование Файлов Cookie',
    description: 'Наша политика файлов cookie объясняет, как мы используем файлы cookie и аналогичные технологии для предоставления наших услуг и улучшения вашего опыта.',
    images: ['/images/cookie-twitter-image-ru.jpg'],
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

export default function RussianCookiePolicyPage() {
  return (
    <RTLWrapper>
      <CookiePolicy language="ru" />
    </RTLWrapper>
  );
}
