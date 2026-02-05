// src/services/storageService.js
// PDF storage service using Base64 encoding in Firestore
// Note: Limited to ~700KB files due to Firestore 1MB document limit

class StorageService {
  // Max file size: ~700KB (Base64 adds ~33% overhead, Firestore limit is 1MB)
  MAX_FILE_SIZE = 700 * 1024;

  /**
   * Convert a PDF file to Base64 data URL
   * @param {File} file - The PDF file to convert
   * @returns {Promise<string>} Base64 data URL
   */
  async uploadPDF(file) {
    if (!file) throw new Error('No file provided');

    // Validate file type
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${Math.round(this.MAX_FILE_SIZE / 1024)}KB for direct storage`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        // reader.result is a data URL like "data:application/pdf;base64,..."
        console.log('PDF converted to Base64 successfully');
        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Delete a PDF - for Base64 storage, this is a no-op
   * (The data is deleted when removed from Firestore)
   * @returns {Promise<boolean>} Always returns true
   */
  async deletePDF() {
    // No separate storage to delete - data is in Firestore
    return true;
  }

  /**
   * Open a Base64 PDF in a new tab
   * @param {string} dataUrl - The Base64 data URL
   * @param {string} fileName - Optional filename for download
   */
  openPDF(dataUrl, fileName = 'document.pdf') {
    // Convert data URL to blob for better browser handling
    const byteCharacters = atob(dataUrl.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    // Open in new tab
    window.open(blobUrl, '_blank');

    // Clean up blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }
}

const storageService = new StorageService();
export default storageService;
