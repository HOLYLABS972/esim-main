import React from 'react';
import Script from 'next/script';
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
    <>
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
