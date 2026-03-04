import { supabase } from '../supabase/config';

export const imageUploadService = {
  async uploadImage(file, path = 'blog-images') {
    try {
      if (!file.type.startsWith('image/')) throw new Error('File must be an image');
      if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');

      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const filePath = `${path}/${fileName}`;

      const { data, error } = await supabase.storage.from('uploads').upload(filePath, file);
      if (error) throw error;

      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        fileName,
        path: filePath
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteImage(imageUrl) {
    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/uploads\/(.+)/);
      if (!pathMatch) throw new Error('Invalid image URL');

      const { error } = await supabase.storage.from('uploads').remove([pathMatch[1]]);
      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { success: false, error: error.message };
    }
  }
};
