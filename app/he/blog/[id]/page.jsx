import BlogPost from '../../../../src/components/BlogPost';

export async function generateMetadata({ params }) {
  // You can enhance this with actual blog post data
  return {
    title: 'פוסט בבלוג eSIM | RoamJet',
    description: 'קרא את המאמרים האחרונים שלנו על טכנולוגיית eSIM וטיפים לנסיעות.',
    openGraph: {
      type: 'article',
      locale: 'he_IL',
      url: `/he/blog/${params.id}`,
    },
    alternates: {
      canonical: `/he/blog/${params.id}`,
    },
  };
}

export default function HebrewBlogPostPage({ params }) {
  return <BlogPost slug={params.id} />;
}
