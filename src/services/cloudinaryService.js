import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = 'dlfjnz8xq'; 
const CLOUDINARY_UPLOAD_PRESET = 'little-lions'; 

class CloudinaryService {
  // Existing image upload
  async uploadImage(file, folder = 'little-lions/general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, 
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error('Cloudinary Image Upload Error:', error);
      throw error;
    }
  }

  // ✅ NEW: Generic file upload (Supports PDF, Docs, Images)
  async uploadFile(file, folder = 'little-lions/documents') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    
    // Note: We use 'auto' resource type to handle both images and PDFs
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, 
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error('Cloudinary File Upload Error:', error);
      throw error;
    }
  }
}

const cloudinaryServiceInstance = new CloudinaryService();
export default cloudinaryServiceInstance;