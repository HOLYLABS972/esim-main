'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../src/components/sections';

export default function HomePage() {
  return (
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
  )
}