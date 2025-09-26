'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'Beste eSIM-Pläne für Rucksacktouristen, Reisende & Digitale Nomaden | RoamJet',
  description: 'Perfekte eSIM-Pläne für Rucksacktouristen, Reisende und digitale Nomaden. Vergleichen Sie Airalo vs RoamJet vs eSIMo. Globale Datenkonnektivität in 200+ Ländern mit sofortiger Aktivierung.',
  keywords: [
    'eSIM-Pläne Rucksacktouristen',
    'eSIM Reisende',
    'digitale Nomaden eSIM',
    'Airalo vs RoamJet',
    'RoamJet vs eSIMo',
    'bester eSIM Reisende',
    'Mobildaten Rucksacktouristen',
    'Internet-Pläne Nomaden',
    'eSIM Reisevergleich',
    'globale eSIM-Pläne',
    'sofortige eSIM-Aktivierung',
    'weltweite Mobildaten'
  ],
  openGraph: {
    title: 'Beste eSIM-Pläne für Rucksacktouristen, Reisende & Digitale Nomaden | RoamJet',
    description: 'Perfekte eSIM-Pläne für Rucksacktouristen, Reisende und digitale Nomaden. Vergleichen Sie Airalo vs RoamJet vs eSIMo. Globale Datenkonnektivität in 200+ Ländern.',
    type: 'website',
    locale: 'de_DE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beste eSIM-Pläne für Rucksacktouristen, Reisende & Digitale Nomaden | RoamJet',
    description: 'Perfekte eSIM-Pläne für Rucksacktouristen, Reisende und digitale Nomaden. Vergleichen Sie Airalo vs RoamJet vs eSIMo. Globale Datenkonnektivität in 200+ Ländern.',
  },
};

export default function GermanPage() {
  return (
    <div dir="ltr" lang="de">
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
