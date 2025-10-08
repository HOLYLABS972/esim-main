import { Suspense } from 'react'
import Script from 'next/script'
import Register from '../../src/components/Register'
import Loading from '../../src/components/Loading'
import AuthRedirect from '../../src/components/AuthRedirect'

export const metadata = {
  title: 'Register - RoamJet',
  description: 'Create your RoamJet account to start buying and managing global eSIM plans for your travels.',
  keywords: ['register', 'sign up', 'create account', 'RoamJet account', 'travel eSIM registration'],
  openGraph: {
    title: 'Register - RoamJet | Global eSIM Plans',
    description: 'Create your RoamJet account to start buying and managing global eSIM plans for your travels.',
    url: '/register',
    images: [
      {
        url: '/images/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'RoamJet Register - Global eSIM Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Register - RoamJet | Global eSIM Plans',
    description: 'Create your RoamJet account to start buying and managing global eSIM plans for your travels.',
    images: ['/images/og-image.svg'],
  },
  alternates: {
    canonical: '/register',
  },
}

export default function RegisterPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <AuthRedirect redirectTo="/dashboard">
          <Register />
        </AuthRedirect>
      </Suspense>
      
      {/* AppsFlyer SDK */}
      <Script
        id="appsflyer-sdk"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(t,e,n,s,a,c,i,o,p){t.AppsFlyerSdkObject=a,t.AF=t.AF||function(){(t.AF.q=t.AF.q||[]).push([Date.now()].concat(Array.prototype.slice.call(arguments)))},t.AF.id=t.AF.id||i,t.AF.plugins={},o=e.createElement(n),p=e.getElementsByTagName(n)[0],o.async=1,o.src="https://websdk.appsflyer.com?"+(c.length>0?"st="+c.split(",").sort().join(",")+"&":"")+(i.length>0?"af_id="+i:""),p.parentNode.insertBefore(o,p)}(window,document,"script",0,"AF","banners",{banners: {key: "2dbbc6cb-349f-414f-b4ae-1060442de536"}});
            AF('banners', 'showBanner')
          `
        }}
      />
    </>
  )
}
