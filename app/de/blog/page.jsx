import { Suspense } from 'react';
import Script from 'next/script';
import Blog from '../../../src/components/Blog';
import Loading from '../../../src/components/Loading';

export const metadata = {
  title: 'eSIM Blog - Einblicke und Leitfäden zur eSIM-Technologie | RoamJet',
  description: 'Entdecke die neuesten Trends, Leitfäden und Einblicke in die eSIM-Technologie und globale Konnektivitätslösungen.',
  openGraph: {
    title: 'eSIM Blog - Einblicke und Leitfäden zur eSIM-Technologie | RoamJet',
    description: 'Entdecke die neuesten Trends, Leitfäden und Einblicke in die eSIM-Technologie und globale Konnektivitätslösungen.',
    type: 'website',
    locale: 'de_DE',
    url: '/de/blog',
  },
  alternates: {
    canonical: '/de/blog',
  },
}

export default function GermanBlogPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Blog />
      </Suspense>
      
      {/* AppsFlyer Banner SDK */}
      <Script
        id="appsflyer-sdk"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(t,e,n,s,a,c,i,o,p){t.AppsFlyerSdkObject=a,t.AF=t.AF||function(){(t.AF.q=t.AF.q||[]).push([Date.now()].concat(Array.prototype.slice.call(arguments)))},t.AF.id=t.AF.id||i,t.AF.plugins={},o=e.createElement(n),p=e.getElementsByTagName(n)[0],o.async=1,o.src="https://websdk.appsflyer.com?"+(c.length>0?"st="+c.split(",").sort().join(",")+"&":"")+(i.length>0?"af_id="+i:""),p.parentNode.insertBefore(o,p)}(window,document,"script",0,"AF","banners",{banners: {key: "2dbbc6cb-349f-414f-b4ae-1060442de536"}});
            AF('banners', 'showBanner', {key: '2dbbc6cb-349f-414f-b4ae-1060442de536'})
          `
        }}
      />
    </>
  );
}


