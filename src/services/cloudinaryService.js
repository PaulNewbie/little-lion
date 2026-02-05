import axios from 'axios';

const CLOUDINARY_CLOUD_NAME = 'dlfjnz8xq';
const CLOUDINARY_UPLOAD_PRESET = 'little-lions';
const CLOUDINARY_DOCS_PRESET = 'little-lions-docs'; // For PDF/document uploads

// Image compression settings
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1080;
const IMAGE_QUALITY = 0.8; // 80% quality

class CloudinaryService {
  /**
   * Compress an image file before upload
   * @param {File} file - Original image file
   * @param {number} maxWidth - Maximum width in pixels
   * @param {number} maxHeight - Maximum height in pixels
   * @param {number} quality - Quality (0-1)
   * @returns {Promise<Blob>} Compressed image blob
   */
  async compressImage(file, maxWidth = MAX_IMAGE_WIDTH, maxHeight = MAX_IMAGE_HEIGHT, quality = IMAGE_QUALITY) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      reader.onerror = (error) => reject(error);

      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Upload image with optional compression
   * @param {File} file - Image file to upload
   * @param {string} folder - Cloudinary folder path
   * @param {boolean} compress - Whether to compress the image first
   * @returns {Promise<string>} Uploaded image URL
   */
  async uploadImage(file, folder = 'little-lions/general', compress = true) {
    let uploadFile = file;

    // Compress image if enabled and file is large (> 500KB)
    if (compress && file.size > 500 * 1024) {
      try {
        const compressedBlob = await this.compressImage(file);
        uploadFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });
        console.log(`Compressed ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${(uploadFile.size / 1024).toFixed(1)}KB`);
      } catch (compressError) {
        console.warn('Image compression failed, uploading original:', compressError);
        // Continue with original file if compression fails
      }
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
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

  /**
   * Upload multiple images with compression and error handling
   * @param {File[]} files - Array of image files
   * @param {string} folder - Cloudinary folder path
   * @param {Function} onProgress - Progress callback (completed, total)
   * @returns {Promise<{urls: string[], errors: {file: string, error: string}[]}>}
   */
  async uploadMultipleImages(files, folder = 'little-lions/general', onProgress = null) {
    const results = { urls: [], errors: [] };

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const url = await this.uploadImage(file, folder, true);
        results.urls.push(url);
      } catch (error) {
        results.errors.push({
          file: file.name,
          error: error.response?.data?.error?.message || error.message || 'Upload failed'
        });
      }

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    return results;
  }

  // ✅ NEW: Generic file upload (Supports PDF, Docs)
  // Uses 'raw' resource type for documents to ensure proper download/view URLs
  // Requires 'little-lions-docs' upload preset in Cloudinary with "Auto" resource type
  async uploadFile(file, folder = 'little-lions/documents') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_DOCS_PRESET); // Use docs preset
    formData.append('folder', folder);

    // Use 'raw' resource type for PDFs and documents
    // This ensures the returned URL works for viewing/downloading
    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
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