import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Get all blog posts (public posts only, ordered by date)
export const getBlogPosts = async () => {
  try {
    const blogQuery = query(
      collection(db, 'blog_posts'),
      orderBy('publishedAt', 'desc')
    );
    
    const postsSnapshot = await getDocs(blogQuery);
    const posts = postsSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || new Date()
      }))
      .filter(post => post.published !== false);
    
    return posts;
  } catch (error) {
    console.error('Error getting blog posts:', error);
    
    // If index doesn't exist yet, try without ordering
    try {
      const simpleQuery = query(
        collection(db, 'blog_posts'),
        where('published', '==', true)
      );
      
      const postsSnapshot = await getDocs(simpleQuery);
      const posts = postsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          publishedAt: doc.data().publishedAt?.toDate() || new Date()
        }))
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      
      return posts;
    } catch (fallbackError) {
      console.error('Fallback query failed:', fallbackError);
      return [];
    }
  }
};

// Get single blog post by slug
export const getBlogPost = async (slug) => {
  try {
    const postQuery = query(
      collection(db, 'blog_posts'),
      where('slug', '==', slug),
      where('published', '==', true)
    );
    
    const postsSnapshot = await getDocs(postQuery);
    
    if (postsSnapshot.empty) {
      return null;
    }
    
    const postDoc = postsSnapshot.docs[0];
    const postData = postDoc.data();
    
    return {
      id: postDoc.id,
      ...postData,
      publishedAt: postData.publishedAt?.toDate() || new Date()
    };
  } catch (error) {
    console.error('Error getting blog post:', error);
    return null;
  }
};

// Create new blog post (for API and admin use)
export const createBlogPost = async (postData) => {
  try {
    const blogPost = {
      ...postData,
      publishedAt: serverTimestamp(),
      published: postData.published !== false, // Default to true unless explicitly false
      images: postData.images || [], // Array of additional images for gallery/content
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'blog_posts'), blogPost);
    
    return {
      id: docRef.id,
      ...blogPost
    };
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
};

// Get featured blog posts (for home page, etc.)
export const getFeaturedBlogPosts = async (limit = 3) => {
  try {
    const posts = await getBlogPosts();
    return posts.slice(0, limit);
  } catch (error) {
    console.error('Error getting featured blog posts:', error);
    return [];
  }
};

// Search blog posts by tags or title
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