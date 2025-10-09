import { Suspense } from 'react';
import Script from 'next/script';
import Blog from '../../../src/components/Blog';
import Loading from '../../../src/components/Loading';

export const metadata = {
  title: 'Blog eSIM - Perspectivas y Guías de Tecnología eSIM | RoamJet',
  description: 'Descubre las últimas tendencias, guías y perspectivas en tecnología eSIM y soluciones de conectividad global.',
  openGraph: {
    title: 'Blog eSIM - Perspectivas y Guías de Tecnología eSIM | RoamJet',
    description: 'Descubre las últimas tendencias, guías y perspectivas en tecnología eSIM y soluciones de conectividad global.',
    type: 'website',
    locale: 'es_ES',
    url: '/es/blog',
  },
  alternates: {
    canonical: '/es/blog',
  },
}

export default function SpanishBlogPage() {
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


