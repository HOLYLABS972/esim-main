'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'أفضل خطط eSIM للمسافرين والمتنقلين الرقميين | RoamJet',
  description: 'خطط eSIM مثالية للمسافرين والمتنقلين الرقميين. قارن بين Airalo و RoamJet و eSIMo. اتصال بيانات عالمي في أكثر من 200 دولة مع تفعيل فوري.',
  keywords: [
    'خطط eSIM للمسافرين',
    'eSIM للمتنقلين الرقميين',
    'Airalo مقابل RoamJet',
    'RoamJet مقابل eSIMo',
    'أفضل eSIM للمسافرين',
    'بيانات متنقلة للمسافرين',
    'خطط إنترنت للمتنقلين',
    'مقارنة eSIM للسفر',
    'خطط eSIM عالمية',
    'تفعيل eSIM فوري',
    'بيانات متنقلة عالمية'
  ],
  openGraph: {
    title: 'أفضل خطط eSIM للمسافرين والمتنقلين الرقميين | RoamJet',
    description: 'خطط eSIM مثالية للمسافرين والمتنقلين الرقميين. قارن بين Airalo و RoamJet و eSIMo. اتصال بيانات عالمي في أكثر من 200 دولة.',
    type: 'website',
    locale: 'ar_SA',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'أفضل خطط eSIM للمسافرين والمتنقلين الرقميين | RoamJet',
    description: 'خطط eSIM مثالية للمسافرين والمتنقلين الرقميين. قارن بين Airalo و RoamJet و eSIMo. اتصال بيانات عالمي في أكثر من 200 دولة.',
  },
};

export default function ArabicPage() {
  return (
    <div dir="rtl" lang="ar">
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
