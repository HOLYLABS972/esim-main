import React from 'react';
import Script from 'next/script';
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
    <>
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
      
      {/* AppsFlyer SDK */}
      <Script
        id="appsflyer-sdk"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(t,e,n,s,a,c,i,o,p){t.AppsFlyerSdkObject=a,t.AF=t.AF||function(){(t.AF.q=t.AF.q||[]).push([Date.now()].concat(Array.prototype.slice.call(arguments)))},t.AF.id=t.AF.id||i,t.AF.plugins={},o=e.createElement(n),p=e.getElementsByTagName(n)[0],o.async=1,o.src="https://websdk.appsflyer.com?"+(c.length>0?"st="+c.split(",").sort().join(",")+"&":"")+(i.length>0?"af_id="+i:""),p.parentNode.insertBefore(o,p)}(window,document,"script",0,"AF","banners",{banners: {key: "2dbbc6cb-349f-414f-b4ae-1060442de536"}});
            AF('banners', 'showBanner')
          `
        }}
      />
    </>
  );
}
