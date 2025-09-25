import { Suspense } from 'react'
import BlogPost from '../../../src/components/BlogPost'
import Loading from '../../../src/components/Loading'

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
      title: post.metaTitle || post.title || 'Blog Post',
      description: post.metaDescription || post.excerpt || 'Read our latest blog post',
      keywords: post.metaKeywords || [],
      authors: [{ name: post.author || 'Roam Jet Plans Team' }],
      creator: 'Roam Jet Plans',
      publisher: 'Roam Jet Plans',
      metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://esimplans.com'),
      alternates: {
        canonical: post.canonicalUrl || `/english/blog/${post.slug}`,
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
        locale: 'en_US',
        url: `/english/blog/${post.slug}`,
        title: post.ogTitle || post.title || 'Blog Post',
        description: post.ogDescription || post.excerpt || 'Read our latest blog post',
        siteName: 'Roam Jet Plans',
        images: [
          {
            url: post.ogImage || post.featuredImage || '/images/blog-default.jpg',
            width: 1200,
            height: 630,
            alt: post.title || 'Blog Post',
          },
        ],
        publishedTime: post.publishedAt,
        authors: [post.author || 'Roam Jet Plans Team'],
        tags: post.tags || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.twitterTitle || post.title || 'Blog Post',
        description: post.twitterDescription || post.excerpt || 'Read our latest blog post',
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
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }
}

export default function EnglishBlogPostPage({ params }) {
  return (
    <Suspense fallback={<Loading />}>
      <BlogPost postId={params.id} language="en" />
    </Suspense>
  )
}
