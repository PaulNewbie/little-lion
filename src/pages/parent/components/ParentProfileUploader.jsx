// src/pages/parent/components/ParentProfileUploader.jsx
import React, { useState } from 'react';
import cloudinaryService from '../../../services/cloudinaryService';
import userService from '../../../services/userService';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../context/ToastContext';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../../../config/queryClient';

const ParentProfileUploader = () => {
  const { currentUser, refreshUser } = useAuth();
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

      // 3. Refresh AuthContext so sidebar photo updates immediately
      await refreshUser();

      // 4. Also invalidate React Query cache for consistency
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
      <label className="sidebar-photo-upload-btn">
        {uploading ? (
          <>
            <svg className="sidebar-upload-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Change Photo
          </>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="sidebar-photo-upload-input"
          disabled={uploading}
        />
      </label>
    </div>
  );
};

export default ParentProfileUploader;