import { Suspense } from 'react';
import Script from 'next/script';
import Blog from '../../src/components/Blog';
import Loading from '../../src/components/Loading';

export const metadata = {
  title: 'eSIM Blog - Technology Insights & Travel Guides | RoamJet',
  description: 'Discover the latest trends, guides, and insights in eSIM technology and global connectivity solutions.',
  openGraph: {
    title: 'eSIM Blog - Technology Insights & Travel Guides | RoamJet',
    description: 'Discover the latest trends, guides, and insights in eSIM technology and global connectivity solutions.',
    type: 'website',
    locale: 'en_US',
    url: '/blog',
  },
  alternates: {
    canonical: '/blog',
  },
}

export default function BlogPage() {
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
