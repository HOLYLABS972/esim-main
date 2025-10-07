import { Suspense } from 'react'
import BlogPost from '../../../src/components/BlogPost'
import Loading from '../../../src/components/Loading'
import blogService from '../../../src/services/blogService'

export async function generateMetadata({ params }) {
  try {
    // Fetch the actual blog post data
    const post = await blogService.getPostBySlug(params.id);
    
    if (!post) {
      return {
        title: 'Blog Post Not Found | RoamJet',
        description: 'The blog post you are looking for could not be found.',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.roamjet.net';
    const postUrl = `${baseUrl}/blog/${params.id}`;
    const imageUrl = post.featuredImage ? 
      (post.featuredImage.startsWith('http') ? post.featuredImage : `${baseUrl}${post.featuredImage}`) :
      `${baseUrl}/images/og-image.svg`;

    return {
      title: `${post.title} | RoamJet Blog`,
      description: post.excerpt || post.seoDescription || 'Read our latest insights about eSIM technology and global connectivity.',
      keywords: post.seoKeywords?.length > 0 ? post.seoKeywords : ['eSIM', 'travel', 'connectivity', 'blog'],
      authors: [{ name: post.author || 'RoamJet Team' }],
      creator: post.author || 'RoamJet',
      publisher: 'RoamJet',
      
      // Open Graph for Facebook, LinkedIn, etc.
      openGraph: {
        type: 'article',
        locale: 'en_US',
        url: postUrl,
        title: post.title,
        description: post.excerpt || post.seoDescription || 'Read our latest insights about eSIM technology and global connectivity.',
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
        description: post.excerpt || post.seoDescription || 'Read our latest insights about eSIM technology and global connectivity.',
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
    console.error('Error generating metadata for blog post:', error);
    return {
      title: 'Blog Post | RoamJet',
      description: 'Read our latest insights about eSIM technology and global connectivity.',
    }
  }
}

export default function BlogPostPage({ params }) {
  return (
    <Suspense fallback={<Loading />}>
      <BlogPost slug={params.id} />
    </Suspense>
  )
}
