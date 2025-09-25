

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
  title: 'Условия Использования - Roam Jet Plans | Условия и Положения',
  description: 'Наши условия использования определяют ваши права и обязательства, а также права и обязательства Roam Jet Plans при использовании наших услуг eSIM.',
  keywords: [
    'условия использования', 'условия и положения', 'соглашение об обслуживании', 'права пользователя', 'обязательства пользователя',
    'ограничения сервиса', 'отмена сервиса', 'компенсации', 'ответственность сервиса'
  ],
  authors: [{ name: 'Команда Roam Jet Plans' }],
  creator: 'Roam Jet Plans',
  publisher: 'Roam Jet Plans',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
  alternates: {
    canonical: '/russian/terms-of-service',
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
    locale: 'ru_RU',
    url: '/russian/terms-of-service',
    title: 'Условия Использования - Roam Jet Plans | Условия и Положения',
    description: 'Наши условия использования определяют ваши права и обязательства, а также права и обязательства Roam Jet Plans при использовании наших услуг eSIM.',
    siteName: 'Roam Jet Plans',
    images: [
      {
        url: '/images/terms-og-image-ru.jpg',
        width: 1200,
        height: 630,
        alt: 'Условия Использования - Roam Jet Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Условия Использования - Roam Jet Plans | Условия и Положения',
    description: 'Наши условия использования определяют ваши права и обязательства, а также права и обязательства Roam Jet Plans при использовании наших услуг eSIM.',
    images: ['/images/terms-twitter-image-ru.jpg'],
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

export default function RussianTermsOfServicePage() {
  return (
    <RTLWrapper>
      <TermsOfService language="ru" />
    </RTLWrapper>
  );
}
