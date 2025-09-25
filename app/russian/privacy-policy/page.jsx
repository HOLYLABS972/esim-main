

import dynamic from 'next/dynamic';
import RTLWrapper from '../../../src/components/RTLWrapper';

const PrivacyPolicy = dynamic(() => import('../../../src/components/PrivacyPolicy'), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
});

export const metadata = {
  title: 'Политика Конфиденциальности - Roam Jet Plans | Защита Ваших Личных Данных',
  description: 'Наша политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу личную информацию. Полная прозрачность в защите конфиденциальности.',
  keywords: [
    'политика конфиденциальности', 'защита конфиденциальности', 'личные данные', 'GDPR', 'защита данных',
    'конфиденциальность пользователей', 'информационная безопасность', 'защита данных', 'прозрачность конфиденциальности'
  ],
  authors: [{ name: 'Команда Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/russian/privacy-policy',
    languages: {
      'en': '/privacy-policy',
      'ar': '/arabic/privacy-policy',
      'fr': '/french/privacy-policy', 
      'de': '/german/privacy-policy',
      'es': '/spanish/privacy-policy',
      'he': '/hebrew/privacy-policy',
      'ru': '/russian/privacy-policy'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: '/russian/privacy-policy',
    title: 'Политика Конфиденциальности - Roam Jet Plans | Защита Ваших Личных Данных',
    description: 'Наша политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу личную информацию. Полная прозрачность в защите конфиденциальности.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/privacy-og-image-ru.jpg',
        width: 1200,
        height: 630,
        alt: 'Политика Конфиденциальности - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Политика Конфиденциальности - Roam Jet Plans | Защита Ваших Личных Данных',
    description: 'Наша политика конфиденциальности объясняет, как мы собираем, используем и защищаем вашу личную информацию.',
    images: ['/images/privacy-twitter-image-ru.jpg'],
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

export default function RussianPrivacyPolicyPage() {
  return (
    <RTLWrapper>
      <PrivacyPolicy language="ru" />
    </RTLWrapper>
  );
}
