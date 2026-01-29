// src/pages/parent/components/ParentProfileUploader.jsx
import React, { useState } from 'react';
import cloudinaryService from '../../../services/cloudinaryService';
import userService from '../../../services/userService';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../config/queryClient';

const ParentProfileUploader = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Optional: Add file validation similar to useProfileForm.js
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload to Cloudinary in the parents folder
      const url = await cloudinaryService.uploadImage(file, 'little-lions/parents');
      
      // 2. Update Firebase user document
      await userService.updateUser(currentUser.uid, {
        profilePhoto: url,
        updatedAt: new Date().toISOString()
      });

      // 3. Invalidate cache so the sidebar updates immediately
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(currentUser.uid) });

      toast.success("Profile picture updated!");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="sidebar__extra-profile">
      <label style={{ 
        fontSize: '12px', 
        color: '#3498db', 
        cursor: 'pointer',
        fontWeight: '500',
        display: 'inline-block',
        marginTop: '5px'
      }}>
        {uploading ? '⌛ Uploading...' : '📸 Change Photo'}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handlePhotoUpload} 
          style={{ display: 'none' }} 
          disabled={uploading}
        />
      </label>
    </div>
  );
};

export default ParentProfileUploader;