import React from 'react';
import EsimPlans from '../../../src/components/EsimPlans';

export const metadata = {
  title: 'Планы eSIM - Выберите идеальный план',
  description: 'Просмотрите наш полный выбор планов данных eSIM для более чем 200 стран. Цены в реальном времени с мгновенной активацией.',
  keywords: ['планы eSIM', 'международные данные', 'дешевый eSIM', 'данные для путешествий'],
  openGraph: {
    title: 'Планы eSIM - Выберите идеальный план',
    description: 'Просмотрите наш полный выбор планов данных eSIM для более чем 200 стран. Цены в реальном времени с мгновенной активацией.',
    url: '/ru/esim-plans',
  },
  alternates: {
    canonical: '/ru/esim-plans',
  },
};

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen " dir="ltr">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Выберите ваш план eSIM
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Просмотрите наш полный выбор планов данных eSIM для более чем 200 стран. 
            Цены в реальном времени с мгновенной активацией.
          </p>
        </div>
        
        <EsimPlans />
      </div>
    </div>
  );
}
