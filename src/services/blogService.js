import { supabase } from '../supabase/config';

const BRAND = 'esim';

// Supported blog locales (must match DB language column values)
const SUPPORTED_LOCALES = ['en', 'ar', 'de', 'es', 'fr', 'he', 'ru', 'pt', 'tr', 'ja', 'zh', 'id', 'uk', 'vi'];

/**
 * Get locale from pathname (e.g. /de/blog -> 'de', /blog -> 'en').
 * Used by server components via x-pathname header.
 */
export function getLocaleFromPathname(pathname) {
  if (!pathname || pathname === '/') return 'en';
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (SUPPORTED_LOCALES.includes(first)) return first;
  return 'en';
}

// Get all blog posts (public posts only, optionally filtered by locale)
export const getBlogPosts = async (locale = 'en') => {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('brand', BRAND)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    // Filter by language/locale when column exists
    const normalizedLocale = locale && SUPPORTED_LOCALES.includes(locale) ? locale : 'en';
    query = query.eq('language', normalizedLocale);

    const { data, error } = await query;

    if (error) {
      // If language column is missing, fetch all and filter in memory (backward compatibility)
      if (error.code === '42703' || error.message?.includes('language')) {
        const { data: allData, error: allError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('brand', BRAND)
          .eq('status', 'published')
          .order('published_at', { ascending: false });
        if (allError) {
          console.error('Error getting blog posts:', allError);
          return [];
        }
        const filtered = (allData || []).filter(p => (p.language || 'en') === normalizedLocale);
        return filtered.map(post => ({
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.featured_image,
          author: post.author || 'Roamjet Team',
          tags: post.tags || [],
          published: post.status === 'published',
          publishedAt: post.published_at ? new Date(post.published_at) : new Date(),
          metaDescription: post.seo_description || post.excerpt,
          language: post.language || 'en',
        }));
      }
      console.error('Error getting blog posts:', error);
      return [];
    }

    return (data || []).map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.featured_image,
      author: post.author || 'Roamjet Team',
      tags: post.tags || [],
      published: post.status === 'published',
      publishedAt: post.published_at ? new Date(post.published_at) : new Date(),
      metaDescription: post.seo_description || post.excerpt,
      language: post.language || 'en',
    }));
  } catch (error) {
    console.error('Error getting blog posts:', error);
    return [];
  }
};

// Get single blog post by slug (optionally filtered by locale)
export const getBlogPost = async (slug, locale = 'en') => {
  try {
    if (!supabase) return null;

    const normalizedLocale = locale && SUPPORTED_LOCALES.includes(locale) ? locale : 'en';

    let query = supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('brand', BRAND)
      .eq('status', 'published')
      .eq('language', normalizedLocale);

    const { data, error } = await query.single();

    if (error) {
      // If language column missing or no row, try without language filter and pick by locale
      if (error.code === 'PGRST116' || error.code === '42703' || error.message?.includes('language')) {
        const { data: rows, error: allError } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', slug)
          .eq('brand', BRAND)
          .eq('status', 'published');
        if (allError || !rows?.length) return null;
        const data = rows.find(r => (r.language || 'en') === normalizedLocale) || rows[0];
        return {
          id: data.id,
          slug: data.slug,
          title: data.title,
          excerpt: data.excerpt,
          content: data.content,
          coverImage: data.featured_image,
          author: data.author || 'Roamjet Team',
          tags: data.tags || [],
          published: true,
          publishedAt: data.published_at ? new Date(data.published_at) : new Date(),
          metaDescription: data.seo_description || data.excerpt,
          language: data.language || 'en',
        };
      }
      return null;
    }

    return {
      id: data.id,
      slug: data.slug,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      coverImage: data.featured_image,
      author: data.author || 'Roamjet Team',
      tags: data.tags || [],
      published: true,
      publishedAt: data.published_at ? new Date(data.published_at) : new Date(),
      metaDescription: data.seo_description || data.excerpt,
      language: data.language || 'en',
    };
  } catch (error) {
    console.error('Error getting blog post:', error);
    return null;
  }
};

// Create new blog post
export const createBlogPost = async (postData) => {
  try {
    if (!supabase) throw new Error('Supabase not initialized');

    const blogPost = {
      slug: postData.slug,
      title: postData.title,
      excerpt: postData.excerpt,
      content: postData.content,
      featured_image: postData.coverImage || null,
      author: postData.author || 'Roamjet Team',
      tags: postData.tags || [],
      status: postData.published !== false ? 'published' : 'draft',
      published_at: new Date().toISOString(),
      seo_description: postData.metaDescription || postData.excerpt,
      brand: BRAND,
      language: 'en',
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(blogPost)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      ...postData,
      publishedAt: new Date(data.published_at),
    };
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
};

// Get featured blog posts (optionally filtered by locale)
export const getFeaturedBlogPosts = async (limit = 3, locale = 'en') => {
  try {
    const posts = await getBlogPosts(locale);
    return posts.slice(0, limit);
  } catch (error) {
    console.error('Error getting featured blog posts:', error);
    return [];
  }
};

// Search blog posts (optionally filtered by locale)
export const searchBlogPosts = async (searchTerm, locale = 'en') => {
  try {
    const posts = await getBlogPosts(locale);
    if (!searchTerm) return posts;
    const searchLower = searchTerm.toLowerCase();
    return posts.filter(post =>
      post.title?.toLowerCase().includes(searchLower) ||
      post.excerpt?.toLowerCase().includes(searchLower) ||
      post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return [];
  }
};
