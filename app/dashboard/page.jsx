import { Suspense } from 'react'
import Script from 'next/script'
import Dashboard from '../../src/components/Dashboard'
import Loading from '../../src/components/Loading'

export const metadata = {
  title: 'Dashboard - eSIM Plans',
  description: 'Manage your eSIM plans, view usage, and access your account settings.',
  keywords: ['eSIM dashboard', 'account management', 'usage tracking'],
  openGraph: {
    title: 'Dashboard - eSIM Plans',
    description: 'Manage your eSIM plans, view usage, and access your account settings.',
    url: '/dashboard',
  },
  alternates: {
    canonical: '/dashboard',
  },
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
      
      {/* AppsFlyer SDK */}
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
  )
}
