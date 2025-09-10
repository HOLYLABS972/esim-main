import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Blog post data structure
export const createBlogPost = (postData) => {
  return {
    title: postData.title || '',
    slug: postData.slug || '',
    excerpt: postData.excerpt || '',
    content: postData.content || '',
    author: postData.author || '',
    authorId: postData.authorId || '',
    category: postData.category || 'General',
    tags: postData.tags || [],
    featuredImage: postData.featuredImage || '',
    status: postData.status || 'draft', // draft, published, archived, scheduled
    publishedAt: postData.publishedAt || null,
    scheduledAt: postData.scheduledAt || null,
    readTime: postData.readTime || '5 min read',
    seoTitle: postData.seoTitle || postData.title || '',
    seoDescription: postData.seoDescription || postData.excerpt || '',
    seoKeywords: postData.seoKeywords || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    views: 0,
    likes: 0,
    comments: 0
  };
};

// Generate slug from title
export const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
};

// Blog service functions
export const blogService = {
  // Get all published blog posts
  async getPublishedPosts(limitCount = 10, lastDoc = null) {
    try {
      let q = query(
        collection(db, 'blog_posts'),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null
      }));

      return {
        posts,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error fetching published posts:', error);
      throw error;
    }
  },

  // Get all blog posts (for admin)
  async getAllPosts(limitCount = 20, lastDoc = null) {
    try {
      let q = query(
        collection(db, 'blog_posts'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null
      }));

      return {
        posts,
        lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
        hasMore: snapshot.docs.length === limitCount
      };
    } catch (error) {
      console.error('Error fetching all posts:', error);
      throw error;
    }
  },

  // Get blog post by ID
  async getPostById(id) {
    try {
      const docRef = doc(db, 'blog_posts', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          publishedAt: data.publishedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching post by ID:', error);
      throw error;
    }
  },

  // Get blog post by slug
  async getPostBySlug(slug) {
    try {
      const q = query(
        collection(db, 'blog_posts'),
        where('slug', '==', slug),
        where('status', '==', 'published'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          publishedAt: data.publishedAt?.toDate() || null,
          createdAt: data.createdAt?.toDate() || null,
          updatedAt: data.updatedAt?.toDate() || null
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching post by slug:', error);
      throw error;
    }
  },

  // Create new blog post
  async createPost(postData) {
    try {
      const post = createBlogPost(postData);
      
      // Generate slug if not provided
      if (!post.slug) {
        post.slug = generateSlug(post.title);
      }

      // Check if slug already exists
      const existingPost = await this.getPostBySlug(post.slug);
      if (existingPost) {
        post.slug = `${post.slug}-${Date.now()}`;
      }

      const docRef = await addDoc(collection(db, 'blog_posts'), post);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Update blog post
  async updatePost(id, postData) {
    try {
      const postRef = doc(db, 'blog_posts', id);
      const updateData = {
        ...postData,
        updatedAt: serverTimestamp()
      };

      // Generate slug if title changed and no custom slug provided
      if (postData.title && !postData.slug) {
        updateData.slug = generateSlug(postData.title);
      }

      // Check for slug uniqueness if slug is being updated
      if (updateData.slug) {
        const existingPost = await this.getPostBySlug(updateData.slug);
        if (existingPost && existingPost.id !== id) {
          updateData.slug = `${updateData.slug}-${Date.now()}`;
        }
      }

      await updateDoc(postRef, updateData);
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete blog post
  async deletePost(id) {
    try {
      const postRef = doc(db, 'blog_posts', id);
      await deleteDoc(postRef);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Publish blog post
  async publishPost(id) {
    try {
      const postRef = doc(db, 'blog_posts', id);
      await updateDoc(postRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error publishing post:', error);
      throw error;
    }
  },

  // Unpublish blog post
  async unpublishPost(id) {
    try {
      const postRef = doc(db, 'blog_posts', id);
      await updateDoc(postRef, {
        status: 'draft',
        publishedAt: null,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error unpublishing post:', error);
      throw error;
    }
  },

  // Get posts by category
  async getPostsByCategory(category, limitCount = 10) {
    try {
      const q = query(
        collection(db, 'blog_posts'),
        where('category', '==', category),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null
      }));

      return posts;
    } catch (error) {
      console.error('Error fetching posts by category:', error);
      throw error;
    }
  },

  // Search posts
  async searchPosts(searchTerm, limitCount = 10) {
    try {
      // Note: This is a basic search. For better search, consider using Algolia or similar
      const q = query(
        collection(db, 'blog_posts'),
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const allPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        publishedAt: doc.data().publishedAt?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null
      }));

      // Filter posts based on search term
      const filteredPosts = allPosts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return filteredPosts.slice(0, limitCount);
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },

  // Get blog categories
  async getCategories() {
    try {
      const q = query(collection(db, 'blog_posts'), where('status', '==', 'published'));
      const snapshot = await getDocs(q);
      
      const categories = new Set();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Check if slug is available
  async isSlugAvailable(slug, excludeId = null) {
    try {
      const q = query(
        collection(db, 'blog_posts'),
        where('slug', '==', slug),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return true;
      }
      
      const doc = snapshot.docs[0];
      return excludeId ? doc.id !== excludeId : false;
    } catch (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }
  },

  // Schedule post for future publication
  async schedulePost(id, scheduledAt) {
    try {
      const postRef = doc(db, 'blog_posts', id);
      await updateDoc(postRef, {
        status: 'scheduled',
        scheduledAt: scheduledAt,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  },

  // Publish scheduled post immediately
  async publishScheduledPost(id) {
    try {
      const postRef = doc(db, 'blog_posts', id);
      await updateDoc(postRef, {
        status: 'published',
        publishedAt: serverTimestamp(),
        scheduledAt: null,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error publishing scheduled post:', error);
      throw error;
    }
  },

  // Get scheduled posts
  async getScheduledPosts() {
    try {
      const q = query(
        collection(db, 'blog_posts'),
        where('status', '==', 'scheduled'),
        orderBy('scheduledAt', 'asc')
      );

      const snapshot = await getDocs(q);
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        scheduledAt: doc.data().scheduledAt?.toDate() || null,
        createdAt: doc.data().createdAt?.toDate() || null,
        updatedAt: doc.data().updatedAt?.toDate() || null
      }));

      return posts;
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
      throw error;
    }
  },

  // Check and publish due scheduled posts
  async checkScheduledPosts() {
    try {
      const now = new Date();
      const scheduledPosts = await this.getScheduledPosts();
      
      const duePosts = scheduledPosts.filter(post => 
        post.scheduledAt && post.scheduledAt <= now
      );

      for (const post of duePosts) {
        await this.publishScheduledPost(post.id);
        console.log(`Published scheduled post: ${post.title}`);
      }

      return duePosts.length;
    } catch (error) {
      console.error('Error checking scheduled posts:', error);
      throw error;
    }
  },

  // Increment post views
  async incrementViews(id) {
    try {
      const postRef = doc(db, 'blog_posts', id);
      const post = await this.getPostById(id);
      
      if (post) {
        await updateDoc(postRef, {
          views: (post.views || 0) + 1
        });
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't throw error for view increment failures
    }
  }
};

export default blogService;
