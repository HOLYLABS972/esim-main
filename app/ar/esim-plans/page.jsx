import React from 'react';
import EsimPlans from '../../../src/components/EsimPlans';

export const metadata = {
  title: 'خطط eSIM - اختر خطتك المثالية',
  description: 'تصفح مجموعتنا الكاملة من خطط بيانات eSIM لأكثر من 200 دولة. تسعير فوري مع تفعيل فوري.',
  keywords: ['خطط eSIM', 'بيانات دولية', 'eSIM رخيص', 'بيانات السفر'],
  openGraph: {
    title: 'خطط eSIM - اختر خطتك المثالية',
    description: 'تصفح مجموعتنا الكاملة من خطط بيانات eSIM لأكثر من 200 دولة. تسعير فوري مع تفعيل فوري.',
    url: '/ar/esim-plans',
  },
  alternates: {
    canonical: '/ar/esim-plans',
  },
};

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen " dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            اختر خطة eSIM الخاصة بك
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-center">
            تصفح مجموعتنا الكاملة من خطط بيانات eSIM لأكثر من 200 دولة. 
            تسعير فوري مع تفعيل فوري.
          </p>
        </div>
        
        <EsimPlans />
      </div>
    </div>
  );
}
