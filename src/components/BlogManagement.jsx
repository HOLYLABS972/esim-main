'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../contexts/AdminContext';
import blogService, { generateSlug } from '../services/blogService';
import imageUploadService from '../services/imageUploadService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Calendar, 
  User, 
  Tag, 
  Search,
  Filter,
  MoreVertical,
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

const BlogManagement = () => {
  const { currentUser } = useAuth();
  const { canManageBlog, loading: adminLoading } = useAdmin();
  
  // State management
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [slugAvailability, setSlugAvailability] = useState(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state for creating/editing posts
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
    category: 'General',
    tags: [],
    featuredImage: '',
    status: 'draft',
    scheduledAt: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: []
  });

  // Load posts on component mount
  useEffect(() => {
    loadPosts();
    loadCategories();
  }, []);

  // Load posts based on filters
  useEffect(() => {
    loadPosts();
  }, [filterStatus, filterCategory, searchTerm]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      let postsData;
      
      console.log('Loading posts...', { searchTerm, filterStatus, filterCategory });
      
      if (searchTerm) {
        postsData = await blogService.searchPosts(searchTerm);
        console.log('Search results:', postsData);
      } else {
        const result = await blogService.getAllPosts(50);
        postsData = result.posts;
        console.log('All posts loaded:', postsData.length, 'posts');
      }

      // Apply filters
      let filteredPosts = postsData;
      
      if (filterStatus !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.status === filterStatus);
        console.log('After status filter:', filteredPosts.length, 'posts');
      }
      
      if (filterCategory !== 'all') {
        filteredPosts = filteredPosts.filter(post => post.category === filterCategory);
        console.log('After category filter:', filteredPosts.length, 'posts');
      }

      console.log('Final filtered posts:', filteredPosts);
      setPosts(filteredPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      toast.error('Error loading blog posts');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await blogService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  // Check slug availability with debouncing
  const checkSlugAvailability = async (slug, excludeId = null) => {
    if (!slug || slug.length < 3) {
      setSlugAvailability(null);
      return;
    }

    setCheckingSlug(true);
    try {
      const isAvailable = await blogService.isSlugAvailable(slug, excludeId);
      setSlugAvailability(isAvailable);
    } catch (error) {
      console.error('Error checking slug availability:', error);
      setSlugAvailability(null);
    } finally {
      setCheckingSlug(false);
    }
  };

  // Debounced slug checking
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.slug) {
        checkSlugAvailability(formData.slug, selectedPost?.id);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.slug, selectedPost?.id]);

  // Handle image upload
  const handleImageUpload = async (file) => {
    try {
      setUploadingImage(true);
      
      // Validate file
      const validation = imageUploadService.validateImageFile(file);
      if (!validation.isValid) {
        toast.error(validation.errors.join(', '));
        return;
      }

      // Generate preview
      const previewUrl = await imageUploadService.generatePreviewUrl(file);
      setImagePreview(previewUrl);

      // Upload image
      const result = await imageUploadService.uploadImage(file, 'blog-images');
      
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          featuredImage: result.url
        }));
        toast.success('Image uploaded successfully!');
      } else {
        toast.error(result.error || 'Failed to upload image');
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle image file selection
  const handleImageFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      featuredImage: ''
    }));
    setImagePreview(null);
  };

  const handleCreatePost = () => {
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      author: currentUser?.displayName || currentUser?.email || '',
      category: 'General',
      tags: [],
      featuredImage: '',
      status: 'draft',
      scheduledAt: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: []
    });
    setImagePreview(null);
    setShowCreateModal(true);
  };

  const handleEditPost = (post) => {
    setFormData({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      author: post.author || '',
      category: post.category || 'General',
      tags: post.tags || [],
      featuredImage: post.featuredImage || '',
      status: post.status || 'draft',
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : '',
      seoTitle: post.seoTitle || post.title || '',
      seoDescription: post.seoDescription || post.excerpt || '',
      seoKeywords: post.seoKeywords || []
    });
    setImagePreview(post.featuredImage || null);
    setSelectedPost(post);
    setShowEditModal(true);
  };

  const handleSavePost = async () => {
    try {
      setLoading(true);
      
      const postData = {
        ...formData,
        authorId: currentUser?.uid
      };

      console.log('Saving post with data:', postData);

      // Handle scheduling
      if (formData.scheduledAt && formData.status === 'draft') {
        const scheduledDate = new Date(formData.scheduledAt);
        const now = new Date();
        
        if (scheduledDate > now) {
          postData.status = 'scheduled';
          postData.scheduledAt = scheduledDate;
        } else {
          toast.error('Scheduled date must be in the future');
          return;
        }
      }

      if (showCreateModal) {
        console.log('Creating new post...');
        const postId = await blogService.createPost(postData);
        console.log('Post created with ID:', postId);
        
        // If scheduled, update the post with scheduling info
        if (postData.status === 'scheduled') {
          await blogService.schedulePost(postId, postData.scheduledAt);
          console.log('Post scheduled for:', postData.scheduledAt);
        }
        
        toast.success('Blog post created successfully!');
      } else {
        console.log('Updating existing post:', selectedPost.id);
        await blogService.updatePost(selectedPost.id, postData);
        
        // If scheduled, update the post with scheduling info
        if (postData.status === 'scheduled') {
          await blogService.schedulePost(selectedPost.id, postData.scheduledAt);
        }
        
        toast.success('Blog post updated successfully!');
      }
      
      setShowCreateModal(false);
      setShowEditModal(false);
      setSelectedPost(null);
      
      console.log('Reloading posts...');
      await loadPosts();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Error saving blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      setLoading(true);
      await blogService.deletePost(postToDelete.id);
      toast.success('Blog post deleted successfully!');
      setShowDeleteModal(false);
      setPostToDelete(null);
      loadPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Error deleting blog post');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishPost = async (post) => {
    try {
      setLoading(true);
      await blogService.publishPost(post.id);
      toast.success('Blog post published successfully!');
      loadPosts();
    } catch (error) {
      console.error('Error publishing post:', error);
      toast.error('Error publishing blog post');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpublishPost = async (post) => {
    try {
      setLoading(true);
      await blogService.unpublishPost(post.id);
      toast.success('Blog post unpublished successfully!');
      loadPosts();
    } catch (error) {
      console.error('Error unpublishing post:', error);
      toast.error('Error unpublishing blog post');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishScheduledPost = async (post) => {
    try {
      setLoading(true);
      await blogService.publishScheduledPost(post.id);
      toast.success('Scheduled post published successfully!');
      loadPosts();
    } catch (error) {
      console.error('Error publishing scheduled post:', error);
      toast.error('Error publishing scheduled post');
    } finally {
      setLoading(false);
    }
  };

  const handleUnschedulePost = async (post) => {
    try {
      setLoading(true);
      await blogService.updatePost(post.id, {
        status: 'draft',
        scheduledAt: null
      });
      toast.success('Post unscheduled successfully!');
      loadPosts();
    } catch (error) {
      console.error('Error unscheduling post:', error);
      toast.error('Error unscheduling post');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not published';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!canManageBlog) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need blog management privileges to access this feature</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
              <p className="text-gray-600 mt-1">Create and manage blog posts</p>
            </div>
            <button
              onClick={handleCreatePost}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Post</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadPosts}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500">No blog posts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {posts.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {post.featuredImage && (
                            <img
                              src={post.featuredImage}
                              alt={post.title}
                              className="w-12 h-12 rounded-lg object-cover mr-4"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">
                              {post.title}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {post.excerpt}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(post.status)}`}>
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.status === 'scheduled' && post.scheduledAt 
                          ? `Scheduled: ${formatDate(post.scheduledAt)}`
                          : formatDate(post.publishedAt)
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {post.status === 'published' && (
                            <a
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900"
                              title="View Post"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          
                          <button
                            onClick={() => handleEditPost(post)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Post"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
                          {post.status === 'published' ? (
                            <button
                              onClick={() => handleUnpublishPost(post)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Unpublish Post"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          ) : post.status === 'scheduled' ? (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handlePublishScheduledPost(post)}
                                className="text-green-600 hover:text-green-900"
                                title="Publish Now"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleUnschedulePost(post)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Unschedule"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handlePublishPost(post)}
                              className="text-green-600 hover:text-green-900"
                              title="Publish Post"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setPostToDelete(post);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Post"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <BlogPostModal
          isOpen={showCreateModal || showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedPost(null);
          }}
          onSave={handleSavePost}
          formData={formData}
          setFormData={setFormData}
          loading={loading}
          isEdit={showEditModal}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          uploadingImage={uploadingImage}
          handleImageFileChange={handleImageFileChange}
          handleRemoveImage={handleRemoveImage}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setPostToDelete(null);
          }}
          onConfirm={handleDeletePost}
          postTitle={postToDelete?.title}
          loading={loading}
        />
      )}
    </div>
  );
};

// Blog Post Modal Component
const BlogPostModal = ({ isOpen, onClose, onSave, formData, setFormData, loading, isEdit, imagePreview, setImagePreview, uploadingImage, handleImageFileChange, handleRemoveImage }) => {
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-generate slug when title changes
      if (field === 'title' && value) {
        const autoSlug = generateSlug(value);
        newData.slug = autoSlug;
      }
      
      return newData;
    });
  };

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  // Add tag chip
  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
    }
  };

  // Remove tag chip
  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle tag input key press
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value) {
        addTag(value);
        e.target.value = '';
      }
    }
  };

  // Handle tag input blur (when user clicks away)
  const handleTagBlur = (e) => {
    const value = e.target.value.trim();
    if (value) {
      addTag(value);
      e.target.value = '';
    }
  };

  const handleKeywordsChange = (value) => {
    const keywords = value.split(',').map(keyword => keyword.trim()).filter(keyword => keyword);
    setFormData(prev => ({
      ...prev,
      seoKeywords: keywords
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">
            {isEdit ? 'Edit Blog Post' : 'Create New Blog Post'}
          </h2>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter blog post title"
                />
              </div>
              
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excerpt
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the post"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Featured Image
                </label>
                
                {/* Image Preview */}
                {(imagePreview || formData.featuredImage) && (
                  <div className="mb-4">
                    <div className="relative inline-block">
                      <img
                        src={imagePreview || formData.featuredImage}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    id="image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="image-upload"
                    className={`cursor-pointer ${uploadingImage ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploadingImage ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                        <p className="text-sm text-gray-600">Uploading...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-600">
                          Click to upload image or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
            
            {/* Additional Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="General">General</option>
                  <option value="Technology">Technology</option>
                  <option value="Travel">Travel</option>
                  <option value="Business">Business</option>
                  <option value="Tutorial">Tutorial</option>
                  <option value="Security">Security</option>
                  <option value="Innovation">Innovation</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                
                {/* Tags Chips Display */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                          title="Remove tag"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Tag Input */}
                <input
                  type="text"
                  onKeyPress={handleTagKeyPress}
                  onBlur={handleTagBlur}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type a tag and press Enter or comma"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Press Enter or comma to add tags. Click the × on a tag to remove it.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Scheduling Fields - Only show when status is draft */}
              {formData.status === 'draft' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule for Publication
                    <span className="text-xs text-gray-500 ml-1">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep as draft. Set a future date to schedule publication.
                  </p>
                </div>
              )}

              {/* Show scheduled info if post is scheduled */}
              {formData.status === 'scheduled' && formData.scheduledAt && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">Scheduled for Publication</p>
                      <p className="text-xs text-blue-600">
                        {new Date(formData.scheduledAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your blog post content here. You can use HTML tags for formatting."
            />
            <p className="text-sm text-gray-500 mt-1">
              You can use HTML tags for formatting. For example: &lt;h2&gt;Heading&lt;/h2&gt;, &lt;p&gt;Paragraph&lt;/p&gt;, &lt;ul&gt;&lt;li&gt;List item&lt;/li&gt;&lt;/ul&gt;
            </p>
          </div>
          
        </div>
        
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading || !formData.title || !formData.content}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : (isEdit ? 'Update Post' : 'Create Post')}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteModal = ({ isOpen, onClose, onConfirm, postTitle, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Blog Post</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{postTitle}"? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
          >
            {loading ? 'Deleting...' : 'Delete Post'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlogManagement;
