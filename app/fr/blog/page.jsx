import { Suspense } from 'react';
import Script from 'next/script';
import Blog from '../../../src/components/Blog';
import Loading from '../../../src/components/Loading';

export const metadata = {
  title: 'Blog eSIM - Perspectives et guides technologie eSIM | RoamJet',
  description: 'Découvrez les dernières tendances, guides et perspectives en technologie eSIM et solutions de connectivité mondiale.',
  openGraph: {
    title: 'Blog eSIM - Perspectives et guides technologie eSIM | RoamJet',
    description: 'Découvrez les dernières tendances, guides et perspectives en technologie eSIM et solutions de connectivité mondiale.',
    type: 'website',
    locale: 'fr_FR',
    url: '/fr/blog',
  },
  alternates: {
    canonical: '/fr/blog',
  },
}

export default function FrenchBlogPage() {
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


