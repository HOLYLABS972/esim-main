import BlogPost from '../../../../src/components/BlogPost';

export async function generateMetadata({ params }) {
  return {
    title: 'eSIM Blog-Beitrag | RoamJet',
    description: 'Lies unsere neuesten Artikel über eSIM-Technologie und Reisetipps.',
    openGraph: {
      type: 'article',
      locale: 'de_DE',
      url: `/de/blog/${params.id}`,
    },
    alternates: {
      canonical: `/de/blog/${params.id}`,
    },
  };
}

export default function GermanBlogPostPage({ params }) {
  return <BlogPost slug={params.id} />;
}
