import BlogPost from '../../../../src/components/BlogPost';

export async function generateMetadata({ params }) {
  // You can enhance this with actual blog post data
  return {
    title: 'Пост eSIM Блога | RoamJet',
    description: 'Читайте наши последние статьи о технологии eSIM и советы для путешествий.',
    openGraph: {
      type: 'article',
      locale: 'ru_RU',
      url: `/ru/blog/${params.id}`,
    },
    alternates: {
      canonical: `/ru/blog/${params.id}`,
    },
  };
}

export default function RussianBlogPostPage({ params }) {
  return <BlogPost slug={params.id} />;
}
