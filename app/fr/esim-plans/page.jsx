'use client';

import React, { Suspense } from 'react';
import Script from 'next/script';
import EsimPlans from '../../../src/components/EsimPlans';

export default function EsimPlansPage() {
  return (
    <>
      <div className="min-h-screen " dir="ltr">
          <div className="container mx-auto">
         
          
          <Suspense fallback={
            <div className="flex justify-center items-center min-h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tufts-blue"></div>
              <p className="ml-4 text-gray-600">Chargement des forfaits...</p>
            </div>
          }>
            <EsimPlans />
          </Suspense>
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
