import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import TherapistSidebar from '../../components/sidebar/TherapistSidebar';

// Shared components
import ProfileHeader from '../shared/profile/ProfileHeader';
import PersonalInfoSection from '../shared/profile/PersonalInfoSection';
import EducationEntry from '../shared/profile/EducationEntry';
import CertificationEntry from '../shared/profile/CertificationEntry';

// Therapist-specific components
import TherapistCredentials from './components/TherapistCredential';

// Custom hook
import { useProfileForm } from '../../hooks/useProfileForm';

// Utilities
import { getExpirationStatus } from '../../utils/profileHelpers';

import './css/TherapistProfile.css';

// Styles (shared profile styles)
import '../shared/profile/css/ProfileStyles.css';

const TherapistProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const {
    loading,
    saving,
    uploadingFile,
    validationErrors,
    expandedSections,
    formData,
    newEducation,
    newCertification,
    handleInputChange,
    handleNestedChange,
    handleSpecializationToggle,
    toggleSection,
    handleProfilePhotoUpload,
    handleEducationCertificateUpload,
    handleCertificationCertificateUpload,
    handleNewEducationChange,
    handleAddEducation,
    handleRemoveEducation,
    handleNewCertificationChange,
    handleAddCertification,
    handleRemoveCertification,
    handleSaveProfile
  } = useProfileForm(currentUser, 'therapist', navigate);

  if (loading) return <Loading />;

  const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();
  const licenseStatus = formData.licenseExpirationDate ? getExpirationStatus(formData.licenseExpirationDate) : null;
  
  const statusBadge = licenseStatus ? {
    text: `License: ${licenseStatus}`,
    className: licenseStatus === 'Active' ? 'tp-status-active' :
                licenseStatus === 'Expiring Soon' ? 'tp-status-warning' :
                'tp-status-expired'
  } : null;

  return (
    <div className="therapist-profile-container">
      <TherapistSidebar />
      
      <div className="therapist-profile-main">
        {/* Header */}
        <div className="tp-header">
          <button 
            className="tp-back-btn"
            onClick={() => navigate('/therapist/dashboard')}
          >
            ← Back to Dashboard
          </button>
          
          <div className="tp-header-content">
            <h1 className="tp-title">Edit Profile</h1>
            <p className="tp-subtitle">
              Manage your professional information and credentials
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="tp-form">
          
          {/* Profile Photo Header */}
          <ProfileHeader
            profilePhoto={formData.profilePhoto}
            fullName={fullName}
            role={formData.licenseType || 'Therapist'}
            statusBadge={statusBadge}
            onPhotoUpload={handleProfilePhotoUpload}
            uploading={uploadingFile === 'profile-photo'}
          />

          {/* SECTION 1: Personal Information */}
          <div className="tp-section">
            <div 
              className="tp-section-header"
              onClick={() => toggleSection('personal')}
            >
              <h3 className="tp-section-title">1. Personal Information</h3>
              <span className="tp-section-toggle">
                {expandedSections.personal ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.personal && (
              <div className="tp-section-content">
                <PersonalInfoSection
                  formData={formData}
                  validationErrors={validationErrors}
                  onInputChange={handleInputChange}
                  onNestedChange={handleNestedChange}
                />
              </div>
            )}
          </div>

          {/* SECTION 2: Professional Credentials */}
          <div className="tp-section">
            <div 
              className="tp-section-header"
              onClick={() => toggleSection('credentials')}
            >
              <h3 className="tp-section-title">2. Professional Credentials</h3>
              <span className="tp-section-toggle">
                {expandedSections.credentials ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.credentials && (
              <div className="tp-section-content">
                <TherapistCredentials
                  formData={formData}
                  validationErrors={validationErrors}
                  licenseStatus={licenseStatus}
                  onInputChange={handleInputChange}
                  onSpecializationToggle={handleSpecializationToggle}
                />
              </div>
            )}
          </div>

          {/* SECTION 3: Education History */}
          <div className="tp-section">
            <div 
              className="tp-section-header"
              onClick={() => toggleSection('education')}
            >
              <h3 className="tp-section-title">3. Education History</h3>
              <span className="tp-section-toggle">
                {expandedSections.education ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.education && (
              <div className="tp-section-content">
                <p className="tp-section-description">College and Graduate Education</p>
                
                {formData.educationHistory.length > 0 && (
                  <div className="tp-entries-list">
                    {formData.educationHistory.map((edu, index) => (
                      <EducationEntry
                        key={edu.id || index}
                        education={edu}
                        index={index}
                        onRemove={handleRemoveEducation}
                      />
                    ))}
                  </div>
                )}

                <EducationEntry
                  education={newEducation}
                  isNew={true}
                  onChange={handleNewEducationChange}
                  onAdd={handleAddEducation}
                  onFileUpload={handleEducationCertificateUpload}
                  uploading={uploadingFile === 'new-education-cert'}
                />
              </div>
            )}
          </div>

          {/* SECTION 4: Certifications */}
          <div className="tp-section">
            <div 
              className="tp-section-header"
              onClick={() => toggleSection('certifications')}
            >
              <h3 className="tp-section-title">4. Certifications</h3>
              <span className="tp-section-toggle">
                {expandedSections.certifications ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.certifications && (
              <div className="tp-section-content">
                {formData.certifications.length > 0 && (
                  <div className="tp-entries-list">
                    {formData.certifications.map((cert, index) => (
                      <CertificationEntry
                        key={cert.id || index}
                        certification={cert}
                        index={index}
                        onRemove={handleRemoveCertification}
                      />
                    ))}
                  </div>
                )}

                <CertificationEntry
                  certification={newCertification}
                  isNew={true}
                  onChange={handleNewCertificationChange}
                  onAdd={handleAddCertification}
                  onFileUpload={handleCertificationCertificateUpload}
                  uploading={uploadingFile === 'new-cert-cert'}
                />
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="tp-actions">
            <button
              type="button"
              className="tp-cancel-btn"
              onClick={() => navigate('/therapist/dashboard')}
              disabled={saving}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="tp-save-btn"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TherapistProfile;