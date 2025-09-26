'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'Meilleurs Plans eSIM pour Randonneurs, Voyageurs & Nomades Numériques | RoamJet',
  description: 'Plans eSIM parfaits pour randonneurs, voyageurs et nomades numériques. Comparez Airalo vs RoamJet vs eSIMo. Connectivité mondiale dans 200+ pays avec activation instantanée.',
  keywords: [
    'plans eSIM randonneurs',
    'eSIM voyageurs',
    'nomades numériques eSIM',
    'Airalo vs RoamJet',
    'RoamJet vs eSIMo',
    'meilleur eSIM voyageurs',
    'données mobiles randonneurs',
    'plans internet nomades',
    'comparaison eSIM voyage',
    'plans eSIM mondiaux',
    'activation eSIM instantanée',
    'données mobiles mondiales'
  ],
  openGraph: {
    title: 'Meilleurs Plans eSIM pour Randonneurs, Voyageurs & Nomades Numériques | RoamJet',
    description: 'Plans eSIM parfaits pour randonneurs, voyageurs et nomades numériques. Comparez Airalo vs RoamJet vs eSIMo. Connectivité mondiale dans 200+ pays.',
    type: 'website',
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Meilleurs Plans eSIM pour Randonneurs, Voyageurs & Nomades Numériques | RoamJet',
    description: 'Plans eSIM parfaits pour randonneurs, voyageurs et nomades numériques. Comparez Airalo vs RoamJet vs eSIMo. Connectivité mondiale dans 200+ pays.',
  },
};

export default function FrenchPage() {
  return (
    <div dir="ltr" lang="fr">
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
