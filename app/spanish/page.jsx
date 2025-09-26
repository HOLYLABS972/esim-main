'use client';

import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../../src/components/sections';

export const metadata = {
  title: 'Mejores Planes eSIM para Mochileros, Viajeros y Nómadas Digitales | RoamJet',
  description: 'Planes eSIM perfectos para mochileros, viajeros y nómadas digitales. Compara Airalo vs RoamJet vs eSIMo. Conectividad global de datos en 200+ países con activación instantánea.',
  keywords: [
    'planes eSIM mochileros',
    'eSIM viajeros',
    'nómadas digitales eSIM',
    'Airalo vs RoamJet',
    'RoamJet vs eSIMo',
    'mejor eSIM viajeros',
    'datos móviles mochileros',
    'planes internet nómadas',
    'comparación eSIM viajes',
    'planes eSIM globales',
    'activación eSIM instantánea',
    'datos móviles mundiales'
  ],
  openGraph: {
    title: 'Mejores Planes eSIM para Mochileros, Viajeros y Nómadas Digitales | RoamJet',
    description: 'Planes eSIM perfectos para mochileros, viajeros y nómadas digitales. Compara Airalo vs RoamJet vs eSIMo. Conectividad global de datos en 200+ países.',
    type: 'website',
    locale: 'es_ES',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mejores Planes eSIM para Mochileros, Viajeros y Nómadas Digitales | RoamJet',
    description: 'Planes eSIM perfectos para mochileros, viajeros y nómadas digitales. Compara Airalo vs RoamJet vs eSIMo. Conectividad global de datos en 200+ países.',
  },
};

export default function SpanishPage() {
  return (
    <div dir="ltr" lang="es">
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
