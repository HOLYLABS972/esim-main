import { storage } from '../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const imageUploadService = {
  // Upload image to Firebase Storage
  async uploadImage(file, path = 'blog-images') {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `${path}/${fileName}`);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        success: true,
        url: downloadURL,
        fileName: fileName,
        path: snapshot.ref.fullPath
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Delete image from Firebase Storage
  async deleteImage(imageUrl) {
    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
      
      if (!pathMatch) {
        throw new Error('Invalid image URL');
      }

      const imagePath = decodeURIComponent(pathMatch[1]);
      const imageRef = ref(storage, imagePath);
      
      await deleteObject(imageRef);
      
      return {
        success: true
      };
    } catch (error) {
      console.error('Error deleting image:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Validate image file
  validateImageFile(file) {
    const errors = [];

    // Check file type
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      errors.push('File size must be less than 5MB');
    }

    // Check file dimensions (optional)
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Generate image preview URL
  generatePreviewUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }
};

export default imageUploadService;
