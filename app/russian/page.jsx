'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'Лучшие eSIM планы для путешественников и цифровых кочевников | RoamJet',
  description: 'Идеальные eSIM планы для путешественников и цифровых кочевников. Сравните Airalo vs RoamJet vs eSIMo. Глобальное подключение к данным в 200+ странах с мгновенной активацией.',
  keywords: [
    'eSIM планы путешественники',
    'eSIM туристы',
    'цифровые кочевники eSIM',
    'Airalo против RoamJet',
    'RoamJet против eSIMo',
    'лучший eSIM путешественники',
    'мобильные данные туристы',
    'интернет планы кочевники',
    'сравнение eSIM путешествия',
    'глобальные eSIM планы',
    'мгновенная активация eSIM',
    'мировые мобильные данные'
  ],
  openGraph: {
    title: 'Лучшие eSIM планы для путешественников и цифровых кочевников | RoamJet',
    description: 'Идеальные eSIM планы для путешественников и цифровых кочевников. Сравните Airalo vs RoamJet vs eSIMo. Глобальное подключение к данным в 200+ странах.',
    type: 'website',
    locale: 'ru_RU',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Лучшие eSIM планы для путешественников и цифровых кочевников | RoamJet',
    description: 'Идеальные eSIM планы для путешественников и цифровых кочевников. Сравните Airalo vs RoamJet vs eSIMo. Глобальное подключение к данным в 200+ странах.',
  },
};

export default function RussianPage() {
  return (
    <div dir="ltr" lang="ru">
      <main className="min-h-screen bg-alice-blue">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Plans Section */}
        <PlansSection />

        {/* How It Works & Mobile Apps Section (Combined) */}
        <ActivationSection />
      </main>
      
    </div>
  )
}
