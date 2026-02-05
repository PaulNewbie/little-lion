// src/services/storageService.js
// Firebase Storage service for PDF reports

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

class StorageService {
  /**
   * Upload a PDF file to Firebase Storage
   * @param {File} file - The PDF file to upload
   * @param {string} childId - The child's ID for folder organization
   * @param {string} fileName - Optional custom filename
   * @returns {Promise<string>} Download URL of the uploaded file
   */
  async uploadPDF(file, childId, fileName = null) {
    if (!file) throw new Error('No file provided');
    if (!childId) throw new Error('Child ID is required');

    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB');
    }

    // Create a unique filename
    const timestamp = Date.now();
    const safeName = (fileName || file.name).replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `children/${childId}/reports/${timestamp}_${safeName}`;

    try {
      // Create reference
      const storageRef = ref(storage, storagePath);

      // Upload file
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: 'application/pdf',
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      });

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('PDF uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('Firebase Storage upload error:', error);
      throw error;
    }
  }

  /**
   * Delete a PDF file from Firebase Storage
   * @param {string} fileUrl - The download URL of the file to delete
   * @returns {Promise<boolean>} True if deletion was successful
   */
  async deletePDF(fileUrl) {
    if (!fileUrl) throw new Error('File URL is required');

    try {
      // Extract the path from the URL
      // Firebase Storage URLs contain the path after /o/ and before ?
      const urlObj = new URL(fileUrl);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);

      if (!pathMatch) {
        console.warn('Could not extract path from URL, skipping deletion');
        return true;
      }

      const encodedPath = pathMatch[1];
      const storagePath = decodeURIComponent(encodedPath);

      // Create reference and delete
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);

      console.log('PDF deleted successfully:', storagePath);
      return true;
    } catch (error) {
      // If file doesn't exist, consider it a success
      if (error.code === 'storage/object-not-found') {
        console.warn('File already deleted or not found');
        return true;
      }
      console.error('Firebase Storage delete error:', error);
      throw error;
    }
  }
}

const storageService = new StorageService();
export default storageService;
