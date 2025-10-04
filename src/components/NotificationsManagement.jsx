'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, getDoc, doc, updateDoc, deleteDoc, addDoc, setDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MessageSquare, 
  Search,
  RefreshCw,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { imageUploadService } from '../services/imageUploadService';
import { sendNotificationToAllUsers, getFCMTokenStats } from '../services/fcmService';

// Helper function to get flag emoji from country code
const getFlagEmoji = (countryCode) => {
  if (!countryCode || countryCode.length !== 2) return '🌍';
  
  // Handle special cases like PT-MA, multi-region codes, etc.
  if (countryCode.includes('-') || countryCode.length > 2) {
    return '🌍';
  }
  
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt());
    
    return String.fromCodePoint(...codePoints);
  } catch (error) {
    console.warn('Invalid country code: ' + countryCode, error);
    return '🌍';
  }
};

const NotificationsManagement = () => {
  const { currentUser } = useAuth();
  const functions = getFunctions();

  // State Management
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [notificationSearchTerm, setNotificationSearchTerm] = useState('');
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [notificationFormData, setNotificationFormData] = useState({
    title: '',
    name: '',
    imageUrl: ''
  });
  const [notificationErrors, setNotificationErrors] = useState({});
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationCountries, setNotificationCountries] = useState([]);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // FCM state
  const [fcmStats, setFcmStats] = useState(null);
  const [sendingNotification, setSendingNotification] = useState(false);

  // Load data on component mount
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      loadCountriesForNotifications();
      loadFCMStats();
    }
  }, [currentUser]);

  // Filter notifications based on search only
  useEffect(() => {
    let filtered = notifications.filter(notification => 
      notification.title?.toLowerCase().includes(notificationSearchTerm.toLowerCase()) ||
      notification.body?.toLowerCase().includes(notificationSearchTerm.toLowerCase()) ||
      notification.type?.toLowerCase().includes(notificationSearchTerm.toLowerCase())
    );
    
    setFilteredNotifications(filtered);
  }, [notifications, notificationSearchTerm]);

  // Load countries for notifications
  const loadCountriesForNotifications = async () => {
    try {
      const countriesSnapshot = await getDocs(collection(db, 'countries'));
      const countriesData = countriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          flagEmoji: data.flagEmoji || getFlagEmoji(data.code)
        };
      });
      setNotificationCountries(countriesData);
    } catch (error) {
      console.error('Error loading countries for notifications:', error);
    }
  };

  // Notification Management Functions
  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const notificationsSnapshot = await getDocs(
        query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))
      );
      const notificationsData = notificationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsData);
      setFilteredNotifications(notificationsData);
      console.log('✅ Loaded', notificationsData.length, 'notifications');
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      toast.error(`Error loading notifications: ${error.message}`);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle image file selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Clear existing imageUrl when new file is selected
      setNotificationFormData(prev => ({
        ...prev,
        imageUrl: ''
      }));
    }
  };

  // Upload image to Firebase Storage
  const uploadImage = async () => {
    if (!selectedImage) return null;

    try {
      setUploadingImage(true);
      const result = await imageUploadService.uploadImage(selectedImage, 'notification-images');
      
      if (result.success) {
        setNotificationFormData(prev => ({
          ...prev,
          imageUrl: result.url
        }));
        toast.success('Image uploaded successfully');
        return result.url;
      } else {
        toast.error(`Upload failed: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setNotificationFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
    
    // Clean up preview URL
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const saveNotification = async () => {
    try {
      setLoadingNotifications(true);
      setNotificationErrors({});

      // Validation
      const errors = {};
      if (!notificationFormData.title.trim()) errors.title = 'Title is required';
      if (!notificationFormData.name.trim()) errors.name = 'Name is required';

      if (Object.keys(errors).length > 0) {
        setNotificationErrors(errors);
        return;
      }

      // Upload image if one is selected
      let imageUrl = notificationFormData.imageUrl;
      if (selectedImage && !imageUrl) {
        imageUrl = await uploadImage();
        if (!imageUrl) {
          toast.error('Failed to upload image. Please try again.');
          return;
        }
      }

      const notificationData = {
        ...notificationFormData,
        imageUrl: imageUrl, // Use uploaded image URL
        createdAt: editingNotification ? editingNotification.createdAt : serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser.email,
        sentCount: editingNotification ? editingNotification.sentCount || 0 : 0,
        readCount: editingNotification ? editingNotification.readCount || 0 : 0,
        // Set default values for removed fields
        body: notificationFormData.name, // Use name as body for backward compatibility
        type: 'general',
        priority: 'normal',
        targetAudience: 'all',
        countries: [],
        scheduledDate: '',
        isActive: true
      };

      if (editingNotification) {
        await updateDoc(doc(db, 'notifications', editingNotification.id), notificationData);
        toast.success('Notification updated successfully');
      } else {
        await addDoc(collection(db, 'notifications'), notificationData);
        toast.success('Notification created successfully');
      }

      setShowNotificationModal(false);
      setEditingNotification(null);
      setNotificationFormData({
        title: '',
        name: '',
        imageUrl: ''
      });
      
      // Clear image state
      setSelectedImage(null);
      setImagePreview(null);
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      
      await loadNotifications();
    } catch (error) {
      console.error('❌ Error saving notification:', error);
      toast.error(`Error saving notification: ${error.message}`);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    
    try {
      setLoadingNotifications(true);
      await deleteDoc(doc(db, 'notifications', notificationId));
      toast.success('Notification deleted successfully');
      await loadNotifications();
    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      toast.error(`Error deleting notification: ${error.message}`);
    } finally {
      setLoadingNotifications(false);
    }
  };


  const editNotification = (notification) => {
    setEditingNotification(notification);
    setNotificationFormData({
      title: notification.title,
      name: notification.name || notification.body || '', // Use body as name if name doesn't exist
      imageUrl: notification.imageUrl || ''
    });
    
    // Clear image upload state when editing
    setSelectedImage(null);
    setImagePreview(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setShowNotificationModal(true);
  };

  // Load FCM token statistics
  const loadFCMStats = async () => {
    try {
      const stats = await getFCMTokenStats();
      setFcmStats(stats);
    } catch (error) {
      console.error('Error loading FCM stats:', error);
    }
  };

  // Send FCM notification immediately
  const sendFCMNotification = async (notification) => {
    if (!window.confirm(`Send push notification to all mobile users NOW?\n\nTitle: ${notification.title}\nMessage: ${notification.name || notification.body}\n\nThis will send immediately to iOS and Android devices.`)) {
      return;
    }

    try {
      setSendingNotification(true);
      
      console.log('🚀 Sending FCM notification immediately...');
      
      const result = await sendNotificationToAllUsers({
        title: notification.title,
        body: notification.name || notification.body,
        imageUrl: notification.imageUrl,
        data: {
          notificationId: notification.id,
          type: 'general',
          timestamp: Date.now().toString()
        }
      });

      console.log('✅ FCM notification sent successfully:', result);

      // Update notification with sent count and timestamp
      await updateDoc(doc(db, 'notifications', notification.id), {
        sentCount: (notification.sentCount || 0) + result.successCount,
        lastSentAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        fcmSentAt: serverTimestamp(), // Track when FCM was sent
        fcmSuccessCount: result.successCount,
        fcmFailureCount: result.failureCount || 0
      });

      toast.success(`🚀 Push notification sent immediately to ${result.successCount} devices!\n\n✅ iOS: ${result.platforms?.ios || 0} devices\n✅ Android: ${result.platforms?.android || 0} devices`);
      
      await loadNotifications();
      await loadFCMStats();
      
    } catch (error) {
      console.error('❌ Error sending FCM notification:', error);
      toast.error(`Failed to send notification immediately: ${error.message}`);
    } finally {
      setSendingNotification(false);
    }
  };

  const openNotificationModal = () => {
    setEditingNotification(null);
    setNotificationFormData({
      title: '',
      name: '',
      imageUrl: ''
    });
    setNotificationErrors({});
    
    // Clear image upload state
    setSelectedImage(null);
    setImagePreview(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setShowNotificationModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Management</h2>
            <p className="text-gray-600 mt-1">Create and manage in-app notifications</p>
          </div>
          <button
            onClick={openNotificationModal}
            className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Notification
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={notificationSearchTerm}
              onChange={(e) => setNotificationSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>
      </div>

      {/* FCM Stats */}
      {fcmStats && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📱 Push Notification Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{fcmStats.totalTokens}</div>
              <div className="text-sm text-gray-600">Total Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{fcmStats.platforms.ios}</div>
              <div className="text-sm text-gray-600">iOS Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{fcmStats.platforms.android}</div>
              <div className="text-sm text-gray-600">Android Devices</div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loadingNotifications ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-600 mb-4">Create your first notification to get started</p>
            <button
              onClick={openNotificationModal}
              className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Create Notification
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                      {notification.fcmSentAt && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          🚀 Sent via FCM
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-3">{notification.body}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Target: {notification.targetAudience}</span>
                      {notification.countries && notification.countries.length > 0 && (
                        <span>Countries: {notification.countries.length}</span>
                      )}
                      <span>Created: {notification.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                      {notification.fcmSuccessCount && (
                        <span className="text-green-600 font-medium">
                          📱 Sent to {notification.fcmSuccessCount} devices
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => sendFCMNotification(notification)}
                      disabled={sendingNotification}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Send push notification NOW to all iOS and Android devices"
                    >
                      {sendingNotification ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => editNotification(notification)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit notification"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold">
                {editingNotification ? 'Edit Notification' : 'Create Notification'}
              </h3>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={notificationFormData.title}
                    onChange={(e) => setNotificationFormData({...notificationFormData, title: e.target.value})}
                    placeholder="Notification title"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                      notificationErrors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {notificationErrors.title && (
                    <p className="text-red-500 text-sm mt-1">{notificationErrors.title}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={notificationFormData.name}
                    onChange={(e) => setNotificationFormData({...notificationFormData, name: e.target.value})}
                    placeholder="Notification name"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                      notificationErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {notificationErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{notificationErrors.name}</p>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notification Image (Optional)</label>
                  
                  {/* Image Preview */}
                  {(imagePreview || notificationFormData.imageUrl) && (
                    <div className="mb-4">
                      <div className="relative inline-block">
                        <img
                          src={imagePreview || notificationFormData.imageUrl}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {selectedImage && !notificationFormData.imageUrl && (
                        <p className="text-sm text-gray-600 mt-2">
                          Image will be uploaded when you save the notification
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Upload Button */}
                  {!imagePreview && !notificationFormData.imageUrl && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center"
                      >
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-1">Click to upload an image</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </label>
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {uploadingImage && (
                    <div className="mt-2 flex items-center text-sm text-gray-600">
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading image...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveNotification}
                disabled={loadingNotifications}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center"
              >
                {loadingNotifications ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingNotification ? 'Update' : 'Create'} Notification
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default NotificationsManagement;
