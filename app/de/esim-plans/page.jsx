import React from 'react';
import EsimPlans from '../../../src/components/EsimPlans';

export const metadata = {
  title: 'eSIM-Pläne - Wählen Sie Ihren perfekten Plan',
  description: 'Durchsuchen Sie unsere vollständige Auswahl an eSIM-Datenplänen für über 200 Länder. Echtzeitpreise mit sofortiger Aktivierung.',
  keywords: ['eSIM-Pläne', 'internationale Daten', 'günstiger eSIM', 'Reisedaten'],
  openGraph: {
    title: 'eSIM-Pläne - Wählen Sie Ihren perfekten Plan',
    description: 'Durchsuchen Sie unsere vollständige Auswahl an eSIM-Datenplänen für über 200 Länder. Echtzeitpreise mit sofortiger Aktivierung.',
    url: '/de/esim-plans',
  },
  alternates: {
    canonical: '/de/esim-plans',
  },
};

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen " dir="ltr">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wählen Sie Ihren eSIM-Plan
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Durchsuchen Sie unsere vollständige Auswahl an eSIM-Datenplänen für über 200 Länder. 
            Echtzeitpreise mit sofortiger Aktivierung.
          </p>
        </div>
        
        <EsimPlans />
      </div>
    </div>
  );
}
