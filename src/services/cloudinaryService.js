const uploadImage = async (file) => {
  if (!file) return null;

//   const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
//   const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const cloudName = "dlfjnz8xq";
const uploadPreset = "little-lions";

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing. Check your .env file.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', 'little-lions/students'); // Organize uploads in a folder

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
    return data.secure_url; // This is the URL we will save to Firestore
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export default {
  uploadImage
};