import { Suspense } from 'react';
import Script from 'next/script';
import BlogClient from '../../../src/components/BlogClient';
import Loading from '../../../src/components/Loading';
import blogService from '../../../src/services/blogService';

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

export const revalidate = 60; // Revalidate every 60 seconds

export default async function ArabicBlogPage() {
  // Fetch blog posts on the server
  let initialPosts = [];
  let categories = [];
  
  try {
    const result = await blogService.getPublishedPosts(20, null, 'ar');
    initialPosts = result.posts.filter(post => !post.isFallback);
    categories = await blogService.getCategories();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
  }

  return (
    <>
      <Suspense fallback={<Loading />}>
        <BlogClient initialPosts={initialPosts} initialCategories={categories} language="ar" />
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


