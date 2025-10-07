import React from 'react';
import EsimPlans from '../../../src/components/EsimPlans';

export const metadata = {
  title: 'Plans eSIM - Choisissez votre plan parfait',
  description: 'Parcourez notre sélection complète de plans de données eSIM pour plus de 200 pays. Tarification en temps réel avec activation instantanée.',
  keywords: ['plans eSIM', 'données internationales', 'eSIM pas cher', 'données de voyage'],
  openGraph: {
    title: 'Plans eSIM - Choisissez votre plan parfait',
    description: 'Parcourez notre sélection complète de plans de données eSIM pour plus de 200 pays. Tarification en temps réel avec activation instantanée.',
    url: '/fr/esim-plans',
  },
  alternates: {
    canonical: '/fr/esim-plans',
  },
};

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen " dir="ltr">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre plan eSIM
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Parcourez notre sélection complète de plans de données eSIM pour plus de 200 pays. 
            Tarification en temps réel avec activation instantanée.
          </p>
        </div>
        
        <EsimPlans />
      </div>
    </div>
  );
}
