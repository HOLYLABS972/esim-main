import { supabase } from '../supabase/config';

const BRAND = 'esim';

// Get all blog posts (public posts only, ordered by date)
export const getBlogPosts = async () => {
  try {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return [];
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('brand', BRAND)
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
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
    }));
  } catch (error) {
    console.error('Error getting blog posts:', error);
    return [];
  }
};

// Get single blog post by slug
export const getBlogPost = async (slug) => {
  try {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('brand', BRAND)
      .eq('status', 'published')
      .single();

    if (error || !data) return null;

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

// Get featured blog posts
export const getFeaturedBlogPosts = async (limit = 3) => {
  try {
    const posts = await getBlogPosts();
    return posts.slice(0, limit);
  } catch (error) {
    console.error('Error getting featured blog posts:', error);
    return [];
  }
};

// Search blog posts
export const searchBlogPosts = async (searchTerm) => {
  try {
    const posts = await getBlogPosts();
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
