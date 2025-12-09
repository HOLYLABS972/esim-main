import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import BlogPostClient from '../../../../src/components/BlogPostClient';
import Loading from '../../../../src/components/Loading';
import blogService from '../../../../src/services/blogService';

export const revalidate = 60; // Revalidate every 60 seconds

export async function generateMetadata({ params }) {
  try {
    // Fetch the actual blog post data for French
    const post = await blogService.getPostBySlug(params.id, 'fr');
    
    if (!post) {
      return {
        title: 'Article de blog introuvable | RoamJet',
        description: 'L\'article de blog que vous recherchez est introuvable.',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.roamjet.net';
    const postUrl = `${baseUrl}/fr/blog/${params.id}`;
    const imageUrl = post.featuredImage ? 
      (post.featuredImage.startsWith('http') ? post.featuredImage : `${baseUrl}${post.featuredImage}`) :
      `${baseUrl}/images/og-image.svg`;

    return {
      title: `${post.title} | RoamJet Blog`,
      description: post.excerpt || post.seoDescription || 'Lisez nos dernières perspectives sur la technologie eSIM et la connectivité mondiale.',
      keywords: post.seoKeywords?.length > 0 ? post.seoKeywords : ['eSIM', 'voyage', 'connectivité', 'blog'],
      authors: [{ name: post.author || 'Équipe RoamJet' }],
      creator: post.author || 'RoamJet',
      publisher: 'RoamJet',
      
      // Open Graph for Facebook, LinkedIn, etc.
      openGraph: {
        type: 'article',
        locale: 'fr_FR',
        url: postUrl,
        title: post.title,
        description: post.excerpt || post.seoDescription || 'Lisez nos dernières perspectives sur la technologie eSIM et la connectivité mondiale.',
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
          publishedTime: post.publishedAt ? (post.publishedAt instanceof Date ? post.publishedAt.toISOString() : new Date(post.publishedAt).toISOString()) : undefined,
          modifiedTime: post.updatedAt ? (post.updatedAt instanceof Date ? post.updatedAt.toISOString() : new Date(post.updatedAt).toISOString()) : undefined,
          author: post.author,
          section: post.category,
          tags: post.tags,
        },
      },
      
      // Twitter Cards
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || post.seoDescription || 'Lisez nos dernières perspectives sur la technologie eSIM et la connectivité mondiale.',
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
    console.error('Error generating metadata for French blog post:', error);
    return {
      title: 'Article de blog | RoamJet',
      description: 'Lisez nos dernières perspectives sur la technologie eSIM et la connectivité mondiale.',
    }
  }
}

export default async function FrenchBlogPostPage({ params }) {
  // Fetch post data on the server
  let post = null;
  try {
    post = await blogService.getPostBySlug(params.id, 'fr');
    if (!post) {
      notFound();
    }
    
    // Serialize dates to ISO strings for client component
    post = {
      ...post,
      publishedAt: post.publishedAt ? (post.publishedAt instanceof Date ? post.publishedAt.toISOString() : new Date(post.publishedAt).toISOString()) : null,
      createdAt: post.createdAt ? (post.createdAt instanceof Date ? post.createdAt.toISOString() : new Date(post.createdAt).toISOString()) : null,
      updatedAt: post.updatedAt ? (post.updatedAt instanceof Date ? post.updatedAt.toISOString() : new Date(post.updatedAt).toISOString()) : null,
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
    notFound();
  }

  return (
    <Suspense fallback={<Loading />}>
      <BlogPostClient initialPost={post} slug={params.id} language="fr" />
    </Suspense>
  );
}