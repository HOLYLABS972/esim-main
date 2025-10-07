import { Suspense } from 'react'
import { headers } from 'next/headers'
import BlogPost from '../../../src/components/BlogPost'
import Loading from '../../../src/components/Loading'
import blogService from '../../../src/services/blogService'
import { detectLanguageFromPath } from '../../../src/utils/languageUtils'

export async function generateMetadata({ params }) {
  try {
    // Get the current pathname to detect language
    const headersList = headers();
    const pathname = headersList.get('x-pathname') || '/blog';
    const currentLanguage = detectLanguageFromPath(pathname);
    
    // Fetch the actual blog post data with language support
    const post = await blogService.getPostBySlug(params.id, currentLanguage);
    
    if (!post) {
      return {
        title: 'Blog Post Not Found | RoamJet',
        description: 'The blog post you are looking for could not be found.',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.roamjet.net';
    
    // Generate localized URL
    const languageRoutes = {
      'es': 'spanish',
      'fr': 'french',
      'de': 'german',
      'ar': 'arabic',
      'he': 'hebrew',
      'ru': 'russian'
    };
    
    const route = languageRoutes[currentLanguage];
    const postUrl = route ? `${baseUrl}/${route}/blog/${params.id}` : `${baseUrl}/blog/${params.id}`;
    
    const imageUrl = post.featuredImage ? 
      (post.featuredImage.startsWith('http') ? post.featuredImage : `${baseUrl}${post.featuredImage}`) :
      `${baseUrl}/images/og-image.svg`;
      
    // Map language codes to locales
    const localeMap = {
      'en': 'en_US',
      'es': 'es_ES', 
      'fr': 'fr_FR',
      'de': 'de_DE',
      'ar': 'ar_SA',
      'he': 'he_IL',
      'ru': 'ru_RU'
    };
    
    const locale = localeMap[currentLanguage] || 'en_US';

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
        locale: locale,
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
