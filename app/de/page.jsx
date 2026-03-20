'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,

} from '../../src/components/sections';

export default function GermanPage() {
  return (
    <div dir="ltr" lang="de">
      <main className="min-h-screen bg-alice-blue">
        <HeroSection />
        <FeaturesSection />
        <PlansSection />
      </main>
    </div>
  )
}


