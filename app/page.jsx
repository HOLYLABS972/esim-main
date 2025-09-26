'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../src/components/sections';

export const metadata = {
  title: 'Best eSIM Plans for Backpackers, Travelers & Digital Nomads | RoamJet',
  description: 'Perfect eSIM plans for backpackers, travelers, and digital nomads. Compare Airalo vs RoamJet vs eSIMo. Global data connectivity in 200+ countries with instant activation.',
  keywords: [
    'eSIM plans backpackers',
    'eSIM travelers',
    'digital nomads eSIM',
    'Airalo vs RoamJet',
    'RoamJet vs eSIMo',
    'best eSIM for travelers',
    'backpacker mobile data',
    'nomad internet plans',
    'travel eSIM comparison',
    'global eSIM plans',
    'instant eSIM activation',
    'worldwide mobile data'
  ],
  openGraph: {
    title: 'Best eSIM Plans for Backpackers, Travelers & Digital Nomads | RoamJet',
    description: 'Perfect eSIM plans for backpackers, travelers, and digital nomads. Compare Airalo vs RoamJet vs eSIMo. Global data connectivity in 200+ countries.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Best eSIM Plans for Backpackers, Travelers & Digital Nomads | RoamJet',
    description: 'Perfect eSIM plans for backpackers, travelers, and digital nomads. Compare Airalo vs RoamJet vs eSIMo. Global data connectivity in 200+ countries.',
  },
};

export default function HomePage() {
  return (
    <div dir="ltr" lang="en">
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