import { Suspense } from 'react';
import Script from 'next/script';
import Blog from '../../../src/components/Blog';
import Loading from '../../../src/components/Loading';

export const metadata = {
  title: 'مدونة eSIM - رؤى ودلائل تقنية eSIM | RoamJet',
  description: 'اكتشف أحدث الاتجاهات والدلائل والرؤى في تقنية eSIM وحلول الاتصال العالمية.',
  openGraph: {
    title: 'مدونة eSIM - رؤى ودلائل تقنية eSIM | RoamJet',
    description: 'اكتشف أحدث الاتجاهات والدلائل والرؤى في تقنية eSIM وحلول الاتصال العالمية.',
    type: 'website',
    locale: 'ar_SA',
    url: '/ar/blog',
  },
  alternates: {
    canonical: '/ar/blog',
  },
}

export default function ArabicBlogPage() {
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
            !function(t,e,n,s,a,c,i,o,p){t.AppsFlyerSdkObject=a,t.AF=t.AF||function(){(t.AF.q=t.AF.q||[]).push([Date.now()].concat(Array.prototype.slice.call(arguments)))},t.AF.id=t.AF.id||i,t.AF.plugins={},o=e.createElement(n),p=e.getElementsByTagName(n)[0],o.async=1,o.src="https://websdk.appsflyer.com?"+(c.length>0?"st="+c.split(",").sort().join(",")+"&":"")+(i.length>0?"af_id="+i:""),p.parentNode.insertBefore(o,p)}(window,document,"script",0,"AF","banners",{banners: {key: "ae5b205a-0713-453d-adf9-4ec72aebdea7"}});
            AF('banners', 'showBanner')
          `
        }}
      />
    </>
  );
}


