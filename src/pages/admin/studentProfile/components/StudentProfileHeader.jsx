import React from 'react';

/**
 * BackArrowIcon - SVG back arrow
 */
const BackArrowIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M15 18L9 12L15 6"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Calculate age from date of birth
 */
const calculateAge = (dob) => {
  if (!dob) return "N/A";
  const age = Math.abs(
    new Date(Date.now() - new Date(dob).getTime()).getUTCFullYear() - 1970
  );
  return isNaN(age) ? "N/A" : age;
};

/**
 * Format date to readable string
 */
const formatDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

/**
 * StudentProfileHeader - Profile header with photo and student info
 */
const StudentProfileHeader = ({
  student,
  parentData,
  isParentView,
  uploadingPhoto,
  onBack,
  onPhotoUpload,
  onToggleAssessment
}) => {
  return (
    <div className="profile-header-section">
      {/* Header Bar */}
      <div className="profile-header-bar">
        <span className="header-back-arrow" onClick={onBack}>
          <BackArrowIcon />
        </span>
        <div className="header-text">
          <h1 className="header-title-text">STUDENT PROFILE</h1>
          <p className="header-subtitle-text">
            {isParentView
              ? "View your child's profile details and activities"
              : "View student information and enrolled services"
            }
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="profile-card-container">
        {/* Left: Photo Section */}
        <div className="profile-photo-section">
          <div className="profile-photo-wrapper">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                className="profile-photo-img"
                alt="profile"
              />
            ) : (
              <div className="profile-photo-placeholder-new">
                <span className="placeholder-initial">{student.firstName[0]}</span>
              </div>
            )}
          </div>

          {/* Parent photo upload button */}
          {isParentView && (
            <label className="photo-upload-label">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={onPhotoUpload}
                disabled={uploadingPhoto}
                className="photo-upload-input"
              />
              <span className="photo-upload-button">
                {uploadingPhoto ? (
                  <>
                    <svg className="upload-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                    Uploading...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {student.photoUrl ? 'Change Photo' : 'Upload Photo'}
                  </>
                )}
              </span>
            </label>
          )}

          {/* Age and Gender info below photo */}
          <div className="photo-section-info">
            <div className="info-item">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div className="info-content">
                <span className="info-label">Age</span>
                <span className="info-value">{calculateAge(student.dateOfBirth)} years old</span>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className="info-content">
                <span className="info-label">Gender</span>
                <span className="info-value">{student.gender || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Assessment Button - opens modal */}
          <button
            className="assessment-toggle-btn photo-section-btn"
            onClick={onToggleAssessment}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            View Assessment History
          </button>
        </div>

        {/* Right: Info Section */}
        <div className="profile-info-section">
          {/* Name & Quick Info */}
          <div className="profile-name-row">
            <h1 className="profile-student-name">
              {student.firstName} {student.lastName}
            </h1>
            {student.nickname && (
              <span className="profile-nickname">"{student.nickname}"</span>
            )}
          </div>

          {/* Info Grid */}
          <div className="profile-info-grid">
            <div className="info-item">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="info-content">
                <span className="info-label">Date of Birth</span>
                <span className="info-value">{formatDate(student.dateOfBirth)}</span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <div className="info-content">
                <span className="info-label">School</span>
                <span className="info-value">{student.school || "N/A"}</span>
              </div>
            </div>

            <div className="info-item info-item-full">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div className="info-content">
                <span className="info-label">Address</span>
                <span className="info-value">{student.address || "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Guardian Section */}
          {parentData && (
            <div className="guardian-card">
              <div className="guardian-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <span>Guardian Information</span>
              </div>
              <div className="guardian-body">
                <div className="guardian-name-row">
                  <span className="guardian-fullname">{parentData.firstName} {parentData.lastName}</span>
                </div>
                <div className="guardian-contact">
                  <div className="contact-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>{parentData.email}</span>
                  </div>
                  <div className="contact-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                    <span>{parentData.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfileHeader;
