import { Suspense } from 'react'
import BlogPost from '../../../src/components/BlogPost'
import Loading from '../../../src/components/Loading'

export async function generateMetadata({ params }) {
  try {
    // Import the blog service to fetch post data
    const { default: blogService } = await import('../../../src/services/blogService');
    const post = await blogService.getPostBySlug(params.id);
    
    if (!post) {
      return {
        title: 'Blog Post Not Found - eSIM Plans',
        description: 'The blog post you are looking for does not exist.',
      };
    }

    return {
      title: post.metaTitle || post.title || 'Blog Post - eSIM Plans',
      description: post.metaDescription || post.excerpt || 'Read our latest insights about eSIM technology and global connectivity.',
      keywords: post.metaKeywords?.join(', ') || post.tags?.join(', ') || 'eSIM blog post, connectivity insights, travel tips',
      authors: [{ name: post.author || 'eSIM Plans Team' }],
      openGraph: {
        title: post.ogTitle || post.metaTitle || post.title || 'Blog Post - eSIM Plans',
        description: post.ogDescription || post.metaDescription || post.excerpt || 'Read our latest insights about eSIM technology and global connectivity.',
        url: `/blog/${params.id}`,
        images: [
          {
            url: post.ogImage || post.featuredImage || '/images/og-image.jpg',
            width: 1200,
            height: 630,
            alt: post.title || 'Blog Post',
          },
        ],
        type: 'article',
        publishedTime: post.publishedAt,
        authors: [post.author || 'eSIM Plans Team'],
        tags: post.tags || [],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.twitterTitle || post.ogTitle || post.metaTitle || post.title || 'Blog Post - eSIM Plans',
        description: post.twitterDescription || post.ogDescription || post.metaDescription || post.excerpt || 'Read our latest insights about eSIM technology and global connectivity.',
        images: [post.twitterImage || post.ogImage || post.featuredImage || '/images/og-image.jpg'],
      },
      alternates: {
        canonical: post.canonicalUrl || `/blog/${params.id}`,
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
      title: 'Blog Post - eSIM Plans',
      description: 'Read our latest insights about eSIM technology and global connectivity.',
      keywords: ['eSIM blog post', 'connectivity insights', 'travel tips'],
      openGraph: {
        title: 'Blog Post - eSIM Plans',
        description: 'Read our latest insights about eSIM technology and global connectivity.',
        url: `/blog/${params.id}`,
      },
      alternates: {
        canonical: `/blog/${params.id}`,
      },
    };
  }
}

export default function BlogPostPage({ params }) {
  return (
    <Suspense fallback={<Loading />}>
      <BlogPost slug={params.id} />
    </Suspense>
  )
}
