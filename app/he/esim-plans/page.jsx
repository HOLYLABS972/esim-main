import React from 'react';
import EsimPlans from '../../../src/components/EsimPlans';

export const metadata = {
  title: 'תוכניות eSIM - בחר את התוכנית המושלמת שלך',
  description: 'עיין במבחר המלא שלנו של תוכניות נתונים eSIM עבור יותר מ-200 מדינות. תמחור בזמן אמת עם הפעלה מיידית.',
  keywords: ['תוכניות eSIM', 'נתונים בינלאומיים', 'eSIM זול', 'נתונים לנסיעות'],
  openGraph: {
    title: 'תוכניות eSIM - בחר את התוכנית המושלמת שלך',
    description: 'עיין במבחר המלא שלנו של תוכניות נתונים eSIM עבור יותר מ-200 מדינות. תמחור בזמן אמת עם הפעלה מיידית.',
    url: '/he/esim-plans',
  },
  alternates: {
    canonical: '/he/esim-plans',
  },
};

export default function EsimPlansPage() {
  return (
    <div className="min-h-screen" dir="rtl">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 text-center">
            בחר את תוכנית ה-eSIM שלך
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto text-center">
            עיין במבחר המלא שלנו של תוכניות נתונים eSIM עבור יותר מ-200 מדינות. 
            תמחור בזמן אמת עם הפעלה מיידית.
          </p>
        </div>
        
        <EsimPlans />
      </div>
    </div>
  );
}
