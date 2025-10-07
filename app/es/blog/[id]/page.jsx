import BlogPost from '../../../../src/components/BlogPost';

export async function generateMetadata({ params }) {
  // You can enhance this with actual blog post data
  return {
    title: 'Post del Blog eSIM | RoamJet',
    description: 'Lee nuestros últimos artículos sobre tecnología eSIM y consejos de viaje.',
    openGraph: {
      type: 'article',
      locale: 'es_ES',
      url: `/es/blog/${params.id}`,
    },
    alternates: {
      canonical: `/es/blog/${params.id}`,
    },
  };
}

export default function SpanishBlogPostPage({ params }) {
  return <BlogPost slug={params.id} />;
}
