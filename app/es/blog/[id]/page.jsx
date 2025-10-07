import BlogPost from '../../../../src/components/BlogPost';
import blogService from '../../../../src/services/blogService';

export async function generateMetadata({ params }) {
  try {
    // Fetch the actual blog post data for Spanish
    const post = await blogService.getPostBySlug(params.id, 'es');
    
    if (!post) {
      return {
        title: 'Artículo del blog no encontrado | RoamJet',
        description: 'El artículo del blog que buscas no se encontró.',
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.roamjet.net';
    const postUrl = `${baseUrl}/es/blog/${params.id}`;
    const imageUrl = post.featuredImage ? 
      (post.featuredImage.startsWith('http') ? post.featuredImage : `${baseUrl}${post.featuredImage}`) :
      `${baseUrl}/images/og-image.svg`;

    return {
      title: `${post.title} | RoamJet Blog`,
      description: post.excerpt || post.seoDescription || 'Lee nuestras últimas perspectivas sobre tecnología eSIM y conectividad global.',
      keywords: post.seoKeywords?.length > 0 ? post.seoKeywords : ['eSIM', 'viajes', 'conectividad', 'blog'],
      authors: [{ name: post.author || 'Equipo RoamJet' }],
      creator: post.author || 'RoamJet',
      publisher: 'RoamJet',
      
      // Open Graph for Facebook, LinkedIn, etc.
      openGraph: {
        type: 'article',
        locale: 'es_ES',
        url: postUrl,
        title: post.title,
        description: post.excerpt || post.seoDescription || 'Lee nuestras últimas perspectivas sobre tecnología eSIM y conectividad global.',
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
        description: post.excerpt || post.seoDescription || 'Lee nuestras últimas perspectivas sobre tecnología eSIM y conectividad global.',
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
    console.error('Error generating metadata for Spanish blog post:', error);
    return {
      title: 'Artículo del blog | RoamJet',
      description: 'Lee nuestras últimas perspectivas sobre tecnología eSIM y conectividad global.',
    }
  }
}

export default function SpanishBlogPostPage({ params }) {
  return <BlogPost slug={params.id} />;
}