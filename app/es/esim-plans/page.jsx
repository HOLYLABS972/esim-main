import React from 'react';
import EsimPlans from '../../../src/components/EsimPlans';

export const metadata = {
  title: 'Planes eSIM - Elige tu plan perfecto',
  description: 'Explora nuestra selección completa de planes de datos eSIM para más de 200 países. Precios en tiempo real con activación instantánea.',
  keywords: ['planes eSIM', 'datos internacionales', 'eSIM barato', 'datos de viaje'],
  openGraph: {
    title: 'Planes eSIM - Elige tu plan perfecto',
    description: 'Explora nuestra selección completa de planes de datos eSIM para más de 200 países. Precios en tiempo real con activación instantánea.',
    url: '/es/esim-plans',
  },
  alternates: {
    canonical: '/es/esim-plans',
  },
};

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen " dir="ltr">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Elige tu plan eSIM
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explora nuestra selección completa de planes de datos eSIM para más de 200 países. 
            Precios en tiempo real con activación instantánea.
          </p>
        </div>
        
        <EsimPlans />
      </div>
    </div>
  );
}
