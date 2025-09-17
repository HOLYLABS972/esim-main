'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../src/components/sections';

export default function HomePage() {
  return (
    <div dir="ltr" lang="en">
      <main className="min-h-screen bg-alice-blue">
        {/* Hero Section */}
        <HeroSection />

        {/* Plans Section */}
        <PlansSection />

        {/* Features Section */}
        <FeaturesSection />

        {/* How It Works & Mobile Apps Section (Combined) */}
        <ActivationSection />
      </main>
      
    </div>
  )
}