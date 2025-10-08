import { Suspense } from 'react'
import Script from 'next/script'
import Login from '../../src/components/Login'
import Loading from '../../src/components/Loading'
import AuthRedirect from '../../src/components/AuthRedirect'
import RTLWrapper from '../../src/components/RTLWrapper'

export const metadata = {
  title: 'Login - RoamJet',
  description: 'Sign in to your RoamJet account to manage your global eSIM plans and travel connectivity.',
  keywords: ['login', 'sign in', 'RoamJet account', 'eSIM authentication', 'travel eSIM login'],
  openGraph: {
    title: 'Login - RoamJet | Global eSIM Plans',
    description: 'Sign in to your RoamJet account to manage your global eSIM plans and travel connectivity.',
    url: '/login',
    images: [
      {
        url: '/images/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'RoamJet Login - Global eSIM Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Login - RoamJet | Global eSIM Plans',
    description: 'Sign in to your RoamJet account to manage your global eSIM plans and travel connectivity.',
    images: ['/images/og-image.svg'],
  },
  alternates: {
    canonical: '/login',
  },
}

export default function LoginPage() {
  return (
    <>
      <RTLWrapper>
        <Suspense fallback={<Loading />}>
          <AuthRedirect redirectTo="/dashboard">
            <Login />
          </AuthRedirect>
        </Suspense>
      </RTLWrapper>
      
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
