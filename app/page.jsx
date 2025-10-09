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
      
      {/* AppsFlyer Banner SDK */}
      <Script
        id="appsflyer-banner-sdk"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(t,e,n,s,a,c,i,o,p){t.AppsFlyerSdkObject=a,t.AF=t.AF||function(){(t.AF.q=t.AF.q||[]).push([Date.now()].concat(Array.prototype.slice.call(arguments)))},t.AF.id=t.AF.id||i,t.AF.plugins={},o=e.createElement(n),p=e.getElementsByTagName(n)[0],o.async=1,o.src="https://websdk.appsflyer.com?"+(c.length>0?"st="+c.split(",").sort().join(",")+"&":"")+(i.length>0?"af_id="+i:""),p.parentNode.insertBefore(o,p)}(window,document,"script",0,"AF","banners",{banners: {key: "ae5b205a-0713-453d-adf9-4ec72aebdea7"}});
            AF('banners', 'showBanner')
          `
        }}
      />
    </>
  )
}