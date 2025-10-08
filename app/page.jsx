'use client';

import Script from 'next/script';
import { 
  HeroSection,
  FeaturesSection,
  PlansSection,
  ActivationSection
} from '../src/components/sections';

export default function HomePage() {
  return (
    <>
      <div dir="ltr" lang="en">
        <main className="min-h-screen bg-white">
          {/* Hero Section */}
          <HeroSection />

          {/* Features Section */}
          <FeaturesSection />

          {/* Plans Section */}
          <PlansSection />

          {/* How It Works & Mobile Apps Section (Combined) */}
          <ActivationSection />
        </main>
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
  )
}