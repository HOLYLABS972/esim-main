import { Suspense } from 'react';
import Script from 'next/script';
import BlogClient from '../../../src/components/BlogClient';
import Loading from '../../../src/components/Loading';
import blogService from '../../../src/services/blogService';

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

export const revalidate = 60; // Revalidate every 60 seconds

export default async function SpanishBlogPage() {
  // Fetch blog posts on the server
  let initialPosts = [];
  let categories = [];
  
  try {
    const result = await blogService.getPublishedPosts(20, null, 'es');
    // Serialize dates to ISO strings for client component
    initialPosts = result.posts
      .filter(post => !post.isFallback)
      .map(post => ({
        ...post,
        publishedAt: post.publishedAt ? (post.publishedAt instanceof Date ? post.publishedAt.toISOString() : new Date(post.publishedAt).toISOString()) : null,
        createdAt: post.createdAt ? (post.createdAt instanceof Date ? post.createdAt.toISOString() : new Date(post.createdAt).toISOString()) : null,
        updatedAt: post.updatedAt ? (post.updatedAt instanceof Date ? post.updatedAt.toISOString() : new Date(post.updatedAt).toISOString()) : null,
      }));
    categories = await blogService.getCategories();
  } catch (error) {
    console.error('Error fetching blog posts:', error);
  }

  return (
    <>
      <Suspense fallback={<Loading />}>
        <BlogClient initialPosts={initialPosts} initialCategories={categories} language="es" />
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
