'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,

} from '../../src/components/sections';

export default function FrenchPage() {
  return (
    <div dir="ltr" lang="fr">
      <main className="min-h-screen bg-alice-blue">
        <HeroSection />
        <FeaturesSection />
        <PlansSection />
      </main>
    </div>
  )
}


