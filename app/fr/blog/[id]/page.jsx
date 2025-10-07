import BlogPost from '../../../../src/components/BlogPost';

export async function generateMetadata({ params }) {
  return {
    title: 'Article de blog eSIM | RoamJet',
    description: 'Lisez nos derniers articles sur la technologie eSIM et les conseils de voyage.',
    openGraph: {
      type: 'article',
      locale: 'fr_FR',
      url: `/fr/blog/${params.id}`,
    },
    alternates: {
      canonical: `/fr/blog/${params.id}`,
    },
  };
}

export default function FrenchBlogPostPage({ params }) {
  return <BlogPost slug={params.id} />;
}
