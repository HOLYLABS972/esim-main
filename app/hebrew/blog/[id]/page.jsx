import { Suspense } from 'react'
import BlogPost from '../../../../src/components/BlogPost'
import Loading from '../../../../src/components/Loading'

export async function generateMetadata({ params }) {
  const { id } = params;
  
  // Fetch the blog post data
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'}/api/blog/${id}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Post not found');
    }
    
    const post = await response.json();
    
    return {
      title: post.metaTitle || post.title || 'פוסט בבלוג',
      description: post.metaDescription || post.excerpt || 'קרא את הפוסט האחרון שלנו בבלוג',
      keywords: post.metaKeywords || [],
      authors: [{ name: post.author || 'צוות Roam Jet Plans' }],
      creator: 'Roam Jet Plans',
      publisher: 'Roam Jet Plans',
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
      alternates: {
        canonical: post.canonicalUrl || `/hebrew/blog/${post.slug}`,
        languages: {
          'en': `/english/blog/${post.slug}`,
          'ar': `/arabic/blog/${post.slug}`,
          'fr': `/french/blog/${post.slug}`, 
          'de': `/german/blog/${post.slug}`,
          'es': `/spanish/blog/${post.slug}`,
          'he': `/hebrew/blog/${post.slug}`,
          'ru': `/russian/blog/${post.slug}`
        }
      },
      openGraph: {
        type: 'article',
        locale: 'he_IL',
        url: `/hebrew/blog/${post.slug}`,
        title: post.ogTitle || post.title || 'פוסט בבלוג',
        description: post.ogDescription || post.excerpt || 'קרא את הפוסט האחרון שלנו בבלוג',
        siteName: 'Roam Jet Plans',
        images: [
          {
            url: post.ogImage || post.featuredImage || '/images/blog-default.jpg',
            width: 1200,
            height: 630,
            alt: post.title || 'פוסט בבלוג',
          },
        ],
        publishedTime: post.publishedAt,
        authors: [post.author || 'צוות Roam Jet Plans'],
        tags: post.tags || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.twitterTitle || post.title || 'פוסט בבלוג',
        description: post.twitterDescription || post.excerpt || 'קרא את הפוסט האחרון שלנו בבלוג',
        images: [post.twitterImage || post.featuredImage || '/images/blog-default.jpg'],
        creator: '@roamjetplans',
      },
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
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'פוסט בבלוג לא נמצא',
      description: 'הפוסט המבוקש לא נמצא.',
    };
  }
}

export default function HebrewBlogPostPage({ params }) {
  return (
    <Suspense fallback={<Loading />}>
      <BlogPost postId={params.id} language="he" />
    </Suspense>
  )
}
