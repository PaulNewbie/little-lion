import React from 'react';

/**
 * BackArrowIcon - SVG back arrow
 */
const BackArrowIcon = () => (
  <svg width="32" height="52" viewBox="0 0 32 52" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.6255 22.8691C9.89159 24.4549 9.89159 27.1866 11.6255 28.7724L30.3211 45.8712C31.7604 47.1876 31.7604 49.455 30.3211 50.7714C29.0525 51.9316 27.1081 51.9316 25.8395 50.7714L1.01868 28.0705C0.366419 27.4738 0 26.6645 0 25.8208C0 24.977 0.366419 24.1678 1.01868 23.571L25.8395 0.87018C27.1081 -0.290054 29.0525 -0.290057 30.3211 0.870177C31.7604 2.1865 31.7604 4.45398 30.3211 5.7703L11.6255 22.8691Z"
      fill="#636363"
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
 * StudentProfileHeader - Profile header with photo and student info
 */
const StudentProfileHeader = ({
  student,
  parentData,
  isParentView,
  uploadingPhoto,
  onBack,
  onPhotoUpload,
  showAssessment,
  onToggleAssessment
}) => {
  return (
    <>
      {/* Top bar with back button and title */}
      <div className="profile-top">
        <div className="left-group">
          <span className="back-arrow" onClick={onBack}>
            <BackArrowIcon />
          </span>
          <h2>
            {isParentView
              ? `${student.firstName}'S PROFILE`
              : "STUDENT PROFILE"
            }
          </h2>
        </div>
      </div>

      {/* Profile photo and info */}
      <div className="profile-3col">
        <div className="profile-photo-frame">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              className="profile-photo"
              alt="profile"
            />
          ) : (
            <div className="profile-photo-placeholder">
              {student.firstName[0]}
            </div>
          )}

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
        </div>

        <div className="profile-info">
          <h1 className="profile-fullname">
            {student.lastName}, {student.firstName}
          </h1>
          <div className="profile-details">
            <div className="profile-left">
              <p><b>Nickname:</b> {student.nickname || "N/A"}</p>
              <p><b>Address:</b> {student.address || "N/A"}</p>
              <p><b>Date of Birth:</b> {student.dateOfBirth || "N/A"}</p>
              <p><b>Current Age:</b> {calculateAge(student.dateOfBirth) ?? "N/A"}</p>
            </div>

            <div className="profile-right">
              <p><b>Gender:</b> {student.gender || "N/A"}</p>
              <p><b>Current School:</b> {student.school || "N/A"}</p>
              <p><b>Relationship:</b> {student.relationshipToClient || "N/A"}</p>
            </div>
          </div>

          {parentData && (
            <div className="guardian-section">
              <p className="guardian-name">
                <b>Guardian:</b> {parentData.firstName} {parentData.lastName}
              </p>
              <div className="guardian-meta">
                <span>{parentData.email}</span>
                <span>{parentData.phone}</span>
              </div>
            </div>
          )}

          <div className="assessment-btn-wrapper">
            <button
              className={`see-more-btn assessment-btn ${showAssessment ? "active" : "inactive"}`}
              onClick={onToggleAssessment}
            >
              {showAssessment ? "Hide Assessment History" : "Assessment History"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentProfileHeader;
