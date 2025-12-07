const uploadImage = async (file, folderPath = 'little-lions/uploads') => {
  if (!file) return null;

  const cloudName = "dlfjnz8xq";
  const uploadPreset = "little-lions";

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  
  // Dynamic folder path
  formData.append('folder', folderPath);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Image upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

const cloudinaryService = {
  uploadImage
};

export default cloudinaryService;