import React from 'react';

/**
 * ProfileHeader Component
 * Displays profile photo, name, role, and status badge
 * Reusable across Teacher and Therapist profiles
 */
const ProfileHeader = ({ 
  profilePhoto, 
  fullName, 
  role, 
  statusBadge,
  onPhotoUpload,
  uploading 
}) => {
  return (
    <div className="tp-photo-section">
      <div className="tp-photo-container">
        {profilePhoto ? (
          <img src={profilePhoto} alt="Profile" className="tp-photo" />
        ) : (
          <div className="tp-photo-placeholder">👤</div>
        )}
        
        <label className="tp-photo-upload-btn">
          {uploading ? 'Uploading...' : 'Change Photo'}
          <input
            type="file"
            accept="image/*"
            onChange={onPhotoUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      
      <div className="tp-photo-info">
        <h2 className="tp-profile-name">{fullName || 'Name'}</h2>
        <p className="tp-profile-role">{role}</p>
        {statusBadge && (
          <span className={`tp-license-status ${statusBadge.className}`}>
            {statusBadge.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;