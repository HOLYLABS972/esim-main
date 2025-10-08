import React from 'react';
import Script from 'next/script';
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
    <>
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
      
      {/* AppsFlyer OneLink Smart Script */}
      <Script
        id="appsflyer-onelink-smart-script"
        src="https://onelinksmartscript.appsflyer.com/onelink-smart-script-latest.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (window.AF_SMART_SCRIPT) {
            const oneLinkURL = "https://roamjet.onelink.me/Sc5I";
            const mediaSource = {keys:["ads_source"],defaultValue:"organic"};
            const custom_ss_ui = {paramKey:"af_ss_ui",defaultValue:"true"};
            
            const result = window.AF_SMART_SCRIPT.generateOneLinkURL({
              oneLinkURL: oneLinkURL,
              afParameters: {
                mediaSource: mediaSource,
                afCustom: [custom_ss_ui]
              }
            });
            
            if (result && result.clickURL) {
              window.APPSFLYER_ONELINK_URL = result.clickURL;
              console.log('AppsFlyer OneLink URL generated:', result.clickURL);
            }
          }
        }}
      />
    </>
  );
}
