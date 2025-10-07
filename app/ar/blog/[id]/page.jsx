import BlogPost from '../../../../src/components/BlogPost';
import blogService from '../../../../src/services/blogService';

export async function generateMetadata({ params }) {
  try {
    // Fetch the actual blog post data for Arabic
    const post = await blogService.getPostBySlug(params.id, 'ar');
    
    if (!post) {
      return {
        title: 'مقال المدونة غير موجود | RoamJet',
        description: 'مقال المدونة الذي تبحث عنه غير موجود.',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.roamjet.net';
    const postUrl = `${baseUrl}/ar/blog/${params.id}`;
    const imageUrl = post.featuredImage ? 
      (post.featuredImage.startsWith('http') ? post.featuredImage : `${baseUrl}${post.featuredImage}`) :
      `${baseUrl}/images/og-image.svg`;

    return {
      title: `${post.title} | RoamJet Blog`,
      description: post.excerpt || post.seoDescription || 'اقرأ أحدث رؤانا حول تقنية eSIM والاتصال العالمي.',
      keywords: post.seoKeywords?.length > 0 ? post.seoKeywords : ['eSIM', 'سفر', 'اتصال', 'مدونة'],
      authors: [{ name: post.author || 'فريق RoamJet' }],
      creator: post.author || 'RoamJet',
      publisher: 'RoamJet',
      
      // Open Graph for Facebook, LinkedIn, etc.
      openGraph: {
        type: 'article',
        locale: 'ar_SA',
        url: postUrl,
        title: post.title,
        description: post.excerpt || post.seoDescription || 'اقرأ أحدث رؤانا حول تقنية eSIM والاتصال العالمي.',
        siteName: 'RoamJet',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        article: {
          publishedTime: post.publishedAt?.toISOString(),
          modifiedTime: post.updatedAt?.toISOString(),
          author: post.author,
          section: post.category,
          tags: post.tags,
        },
      },
      
      // Twitter Cards
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || post.seoDescription || 'اقرأ أحدث رؤانا حول تقنية eSIM والاتصال العالمي.',
        images: [imageUrl],
        creator: '@roamjet',
        site: '@roamjet',
      },
      
      // Additional meta tags
      alternates: {
        canonical: postUrl,
      },
      
      // Robots
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    }
  } catch (error) {
    console.error('Error generating metadata for Arabic blog post:', error);
    return {
      title: 'مقال مدونة | RoamJet',
      description: 'اقرأ أحدث رؤانا حول تقنية eSIM والاتصال العالمي.',
    }
  }
}

export default function ArabicBlogPostPage({ params }) {
  return <BlogPost slug={params.id} />;
}
