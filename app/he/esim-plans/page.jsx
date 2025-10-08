import React from 'react';
import Script from 'next/script';
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
    <>
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
      
      {/* AppsFlyer SDK */}
      <Script
        id="appsflyer-sdk"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(t,e,n,s,a,c,i,o,p){t.AppsFlyerSdkObject=a,t.AF=t.AF||function(){(t.AF.q=t.AF.q||[]).push([Date.now()].concat(Array.prototype.slice.call(arguments)))},t.AF.id=t.AF.id||i,t.AF.plugins={},o=e.createElement(n),p=e.getElementsByTagName(n)[0],o.async=1,o.src="https://websdk.appsflyer.com?"+(c.length>0?"st="+c.split(",").sort().join(",")+"&":"")+(i.length>0?"af_id="+i:""),p.parentNode.insertBefore(o,p)}(window,document,"script",0,"AF","banners",{banners: {key: "ae5b205a-0713-453d-adf9-4ec72aebdea7"}});
            AF('banners', 'showBanner')
          `
        }}
      />
    </>
  );
}
