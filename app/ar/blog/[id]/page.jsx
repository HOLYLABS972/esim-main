import BlogPost from '../../../../src/components/BlogPost';

export async function generateMetadata({ params }) {
  return {
    title: 'مقال مدونة eSIM | RoamJet',
    description: 'اقرأ أحدث مقالاتنا حول تقنية eSIM ونصائح السفر.',
    openGraph: {
      type: 'article',
      locale: 'ar_SA',
      url: `/ar/blog/${params.id}`,
    },
    alternates: {
      canonical: `/ar/blog/${params.id}`,
    },
  };
}

export default function ArabicBlogPostPage({ params }) {
  return <BlogPost slug={params.id} />;
}
