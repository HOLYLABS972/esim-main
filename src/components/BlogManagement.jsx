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
    status: 'published',
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
  }, [filterCategory, searchTerm]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      let postsData;
      
      console.log('Loading posts...', { searchTerm, filterCategory });
      
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
      status: 'published',
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
      status: 'published',
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

      if (showCreateModal) {
        console.log('Creating new post...');
        const postId = await blogService.createPost(postData);
        console.log('Post created with ID:', postId);
        toast.success('Blog post created successfully!');
      } else {
        console.log('Updating existing post:', selectedPost.id);
        await blogService.updatePost(selectedPost.id, postData);
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



  const formatDate = (date) => {
    if (!date) return 'Not published';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {post.author}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(post.publishedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {post.views || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-900"
                            title="View Post"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          
                          <button
                            onClick={() => handleEditPost(post)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Post"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          
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
              rows="12"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Write your blog post content here using HTML tags for formatting..."
            />
            
            {/* Comprehensive HTML/Markdown Guide */}
            <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-semibold text-blue-900 mb-3">✨ Complete Content Formatting Guide</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Headings */}
                <div>
                  <h5 className="font-semibold text-blue-800 mb-2">📝 Headings & Structure</h5>
                  <div className="space-y-1 text-blue-700 font-mono bg-white p-2 rounded">
                    <div>&lt;h1&gt;Main Title (Auto from title)&lt;/h1&gt;</div>
                    <div>&lt;h2&gt;Major Section&lt;/h2&gt;</div>
                    <div>&lt;h3&gt;Subsection&lt;/h3&gt;</div>
                    <div>&lt;h4&gt;Sub-subsection&lt;/h4&gt;</div>
                  </div>
                </div>

                {/* Text Formatting */}
                <div>
                  <h5 className="font-semibold text-blue-800 mb-2">🎨 Text Styling</h5>
                  <div className="space-y-1 text-blue-700 font-mono bg-white p-2 rounded">
                    <div>&lt;p&gt;Regular paragraph text&lt;/p&gt;</div>
                    <div>&lt;strong&gt;Bold important text&lt;/strong&gt;</div>
                    <div>&lt;em&gt;Italic emphasis&lt;/em&gt;</div>
                    <div>&lt;code&gt;inline code&lt;/code&gt;</div>
                  </div>
                </div>

                {/* Lists */}
                <div>
                  <h5 className="font-semibold text-blue-800 mb-2">📋 Lists</h5>
                  <div className="space-y-1 text-blue-700 font-mono bg-white p-2 rounded">
                    <div>&lt;ul&gt;</div>
                    <div>&nbsp;&nbsp;&lt;li&gt;Bullet point&lt;/li&gt;</div>
                    <div>&nbsp;&nbsp;&lt;li&gt;Another point&lt;/li&gt;</div>
                    <div>&lt;/ul&gt;</div>
                    <div className="mt-1">&lt;ol&gt;</div>
                    <div>&nbsp;&nbsp;&lt;li&gt;Numbered item&lt;/li&gt;</div>
                    <div>&lt;/ol&gt;</div>
                  </div>
                </div>

                {/* Links & Images */}
                <div>
                  <h5 className="font-semibold text-blue-800 mb-2">🔗 Links & Images</h5>
                  <div className="space-y-1 text-blue-700 font-mono bg-white p-2 rounded">
                    <div>&lt;a href="https://example.com"&gt;Link&lt;/a&gt;</div>
                    <div>&lt;img src="image.jpg" alt="desc" /&gt;</div>
                  </div>
                </div>

                {/* Blockquotes */}
                <div>
                  <h5 className="font-semibold text-blue-800 mb-2">💬 Quotes & Callouts</h5>
                  <div className="space-y-1 text-blue-700 font-mono bg-white p-2 rounded">
                    <div>&lt;blockquote&gt;</div>
                    <div>&nbsp;&nbsp;&lt;strong&gt;Key Point:&lt;/strong&gt;</div>
                    <div>&nbsp;&nbsp;Important information</div>
                    <div>&lt;/blockquote&gt;</div>
                  </div>
                </div>

                {/* Code Blocks */}
                <div>
                  <h5 className="font-semibold text-blue-800 mb-2">💻 Code Blocks</h5>
                  <div className="space-y-1 text-blue-700 font-mono bg-white p-2 rounded">
                    <div>&lt;pre&gt;&lt;code&gt;</div>
                    <div>Annual cost: €420</div>
                    <div>Monthly data: 20GB</div>
                    <div>Cost per GB: €1.75</div>
                    <div>&lt;/code&gt;&lt;/pre&gt;</div>
                  </div>
                </div>

                {/* Tables */}
                <div className="md:col-span-2">
                  <h5 className="font-semibold text-blue-800 mb-2">📊 Tables (Mobile-Optimized)</h5>
                  <div className="text-blue-700 font-mono bg-white p-2 rounded text-xs">
                    <div>&lt;table&gt;</div>
                    <div>&nbsp;&nbsp;&lt;thead&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;tr&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;th&gt;Provider&lt;/th&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;th&gt;Price&lt;/th&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;th&gt;Data&lt;/th&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;/tr&gt;</div>
                    <div>&nbsp;&nbsp;&lt;/thead&gt;</div>
                    <div>&nbsp;&nbsp;&lt;tbody&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;tr&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;td&gt;&lt;strong&gt;RoamJet&lt;/strong&gt;&lt;/td&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;td&gt;€28&lt;/td&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lt;td&gt;5GB&lt;/td&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;/tr&gt;</div>
                    <div>&nbsp;&nbsp;&lt;/tbody&gt;</div>
                    <div>&lt;/table&gt;</div>
                  </div>
                </div>

                {/* Table of Contents */}
                <div>
                  <h5 className="font-semibold text-blue-800 mb-2">📑 Table of Contents</h5>
                  <div className="space-y-1 text-blue-700 font-mono bg-white p-2 rounded text-xs">
                    <div>&lt;div class="toc"&gt;</div>
                    <div>&nbsp;&nbsp;&lt;h2&gt;Table of Contents&lt;/h2&gt;</div>
                    <div>&nbsp;&nbsp;&lt;ul&gt;</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;li&gt;&lt;a href="#section1"&gt;Section&lt;/a&gt;&lt;/li&gt;</div>
                    <div>&nbsp;&nbsp;&lt;/ul&gt;</div>
                    <div>&lt;/div&gt;</div>
                  </div>
                </div>

                {/* Video Embeds */}
                <div>
                  <h5 className="font-semibold text-blue-800 mb-2">🎥 YouTube Videos</h5>
                  <div className="space-y-1 text-blue-700 font-mono bg-white p-2 rounded text-xs">
                    <div>&lt;div class="video-container"&gt;</div>
                    <div>&nbsp;&nbsp;&lt;iframe</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;src="https://youtube.com/embed/ID"</div>
                    <div>&nbsp;&nbsp;&nbsp;&nbsp;title="Video Title"&gt;</div>
                    <div>&nbsp;&nbsp;&lt;/iframe&gt;</div>
                    <div>&lt;/div&gt;</div>
                  </div>
                </div>
              </div>

              {/* Advanced Features */}
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded">
                <h5 className="font-semibold text-purple-800 mb-2">🚀 Advanced Features</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <h6 className="font-semibold text-purple-700 mb-1">Anchor Links (for TOC)</h6>
                    <div className="text-purple-600 font-mono bg-white p-1 rounded">
                      &lt;h2 id="pricing"&gt;Pricing&lt;/h2&gt;
                    </div>
                  </div>
                  <div>
                    <h6 className="font-semibold text-purple-700 mb-1">External Links</h6>
                    <div className="text-purple-600 font-mono bg-white p-1 rounded">
                      &lt;a href="url" target="_blank"&gt;Link&lt;/a&gt;
                    </div>
                  </div>
                  <div>
                    <h6 className="font-semibold text-purple-700 mb-1">Small Text</h6>
                    <div className="text-purple-600 font-mono bg-white p-1 rounded">
                      &lt;small&gt;Fine print text&lt;/small&gt;
                    </div>
                  </div>
                  <div>
                    <h6 className="font-semibold text-purple-700 mb-1">Line Breaks</h6>
                    <div className="text-purple-600 font-mono bg-white p-1 rounded">
                      Line 1&lt;br&gt;Line 2
                    </div>
                  </div>
                </div>
              </div>

              {/* Pro Tips */}
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                <h5 className="font-semibold text-green-800 mb-2">💡 Pro Writing Tips</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Use &lt;h2&gt; for main sections with clear hierarchy</li>
                    <li>• Add id attributes to headings for anchor links</li>
                    <li>• Use &lt;strong&gt; for key points, &lt;em&gt; for emphasis</li>
                    <li>• Include alt text for all images (accessibility)</li>
                    <li>• Use blockquotes for important callouts</li>
                    <li>• Keep table headers short for mobile readability</li>
                  </ul>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Embed YouTube videos with responsive containers</li>
                    <li>• Use Table of Contents for long articles</li>
                    <li>• Link to related blog posts at the end</li>
                    <li>• Use &lt;code&gt; for technical terms and values</li>
                    <li>• Break up long paragraphs for mobile reading</li>
                    <li>• Test tables on mobile - use fewer columns if needed</li>
                  </ul>
                </div>
              </div>

              {/* Mobile Optimization */}
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded">
                <h5 className="font-semibold text-orange-800 mb-2">📱 Mobile Optimization</h5>
                <ul className="text-xs text-orange-700 space-y-1">
                  <li>• <strong>Tables:</strong> Keep to 3-4 columns max for mobile</li>
                  <li>• <strong>Images:</strong> Always include alt text and use descriptive names</li>
                  <li>• <strong>Videos:</strong> Use video-container class for responsive embeds</li>
                  <li>• <strong>Text:</strong> Break long paragraphs into shorter ones</li>
                  <li>• <strong>Links:</strong> Make link text descriptive (not "click here")</li>
                  <li>• <strong>Lists:</strong> Use bullet points to break up dense information</li>
                </ul>
              </div>
            </div>
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
