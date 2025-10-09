'use client';

import React, { Suspense } from 'react';
import Script from 'next/script';
import EsimPlans from '../../src/components/EsimPlans';
import CountrySearchBar from '../../src/components/CountrySearchBar';

export default function EsimPlansPage() {
  return (
    <>
      <div className="min-h-screen ">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your eSIM Plan
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Browse our complete selection of eSIM data plans for 200+ countries. 
              Real-time pricing with instant activation.
            </p>
            
            {/* Search Bar */}
            <CountrySearchBar showCountryCount={true} />
          </div>
          
          <Suspense fallback={
            <div className="flex justify-center items-center min-h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tufts-blue"></div>
              <p className="ml-4 text-gray-600">Loading plans...</p>
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
          // Initialize Smart Script after it loads
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
