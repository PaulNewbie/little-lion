import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import TherapistSidebar from '../../components/sidebar/TherapistSidebar';

// Shared components
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

const TherapistProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [slideDirection, setSlideDirection] = useState('next');

  const {
    loading,
    saving,
    uploadingFile,
    validationErrors,
    formData,
    newEducation,
    newCertification,
    handleInputChange,
    handleNestedChange,
    handleSpecializationToggle,
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

  // Step configuration
  const steps = [
    { id: 'personal', title: 'Personal Information', icon: '1', description: 'Basic details and contact info' },
    { id: 'credentials', title: 'Professional Credentials', icon: '2', description: 'License and specializations' },
    { id: 'education', title: 'Education History', icon: '3', description: 'Academic background' },
    { id: 'certifications', title: 'Certifications', icon: '4', description: 'Professional credentials' }
  ];

  const goToStep = (stepIndex) => {
    if (stepIndex !== currentStep && !isTransitioning) {
      setSlideDirection(stepIndex > currentStep ? 'next' : 'prev');
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentStep(stepIndex);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 200);
    }
  };

  const goToNextStep = () => {
    if (currentStep < steps.length - 1 && !isTransitioning) {
      goToStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0 && !isTransitioning) {
      goToStep(currentStep - 1);
    }
  };

  if (loading) return <Loading />;

  const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();
  const licenseStatus = formData.licenseExpirationDate ? getExpirationStatus(formData.licenseExpirationDate) : null;

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="tp-step-content">
            <PersonalInfoSection
              formData={formData}
              validationErrors={validationErrors}
              onInputChange={handleInputChange}
              onNestedChange={handleNestedChange}
            />
          </div>
        );

      case 1:
        return (
          <div className="tp-step-content">
            <TherapistCredentials
              formData={formData}
              validationErrors={validationErrors}
              licenseStatus={licenseStatus}
              onInputChange={handleInputChange}
              onSpecializationToggle={handleSpecializationToggle}
            />
          </div>
        );

      case 2:
        return (
          <div className="tp-step-content">
            {formData.educationHistory?.length > 0 && (
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

            <div className="tp-add-section">
              <h4 className="tp-add-title">Add New Education</h4>
              <EducationEntry
                education={newEducation}
                isNew={true}
                onChange={handleNewEducationChange}
                onAdd={handleAddEducation}
                onFileUpload={handleEducationCertificateUpload}
                uploading={uploadingFile === 'new-education-cert'}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="tp-step-content">
            {formData.certifications?.length > 0 && (
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

            <div className="tp-add-section">
              <h4 className="tp-add-title">Add New Certification</h4>
              <CertificationEntry
                certification={newCertification}
                isNew={true}
                onChange={handleNewCertificationChange}
                onAdd={handleAddCertification}
                onFileUpload={handleCertificationCertificateUpload}
                uploading={uploadingFile === 'new-cert-cert'}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <TherapistSidebar forceActive="/therapist/profile" />
      <div style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <div className="tp-page">

          {/* Page Header */}
          <div className="tp-page-header">
            <button
              className="tp-back-btn"
              onClick={() => navigate('/therapist/dashboard')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Dashboard
            </button>
          </div>

          {/* Profile Photo Card - Compact */}
          <div className="tp-photo-card tp-photo-card--compact">
            <div className="tp-photo-card-bg"></div>
            <div className="tp-photo-card-content">
              {/* Photo Section */}
              <div className="tp-photo-section">
                <div className="tp-photo-container">
                  {formData.profilePhoto ? (
                    <img src={formData.profilePhoto} alt="Profile" className="tp-photo-img" />
                  ) : (
                    <div className="tp-photo-empty">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                  {uploadingFile === 'profile-photo' && (
                    <div className="tp-photo-uploading">
                      <div className="tp-photo-spinner"></div>
                    </div>
                  )}
                  <label className="tp-photo-edit-btn">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      disabled={uploadingFile === 'profile-photo'}
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </label>
                </div>
              </div>

              {/* Info Section */}
              <div className="tp-info-section">
                <h1 className="tp-profile-name">{fullName || 'Your Name'}</h1>
                <p className="tp-profile-role">{formData.licenseType || 'Therapist'}</p>

                <div className="tp-profile-meta">
                  {/* Years of Experience - Highlighted */}
                  <div className="tp-experience-badge">
                    <span className="tp-experience-number">{formData.yearsExperience || 0}</span>
                    <span className="tp-experience-label">Years Experience</span>
                  </div>

                  {/* License Status */}
                  {licenseStatus && (
                    <span className={`tp-badge ${
                      licenseStatus === 'Active' ? 'tp-badge--success' :
                      licenseStatus === 'Expiring Soon' ? 'tp-badge--warning' :
                      'tp-badge--danger'
                    }`}>
                      <span className="tp-badge-dot"></span>
                      {licenseStatus}
                    </span>
                  )}

                  {/* Specializations Count */}
                  <span className="tp-badge tp-badge--info">
                    {formData.specializations?.length || 0} Specializations
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step Indicator */}
          <div className="tp-step-indicator">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  className={`tp-step-item ${index === currentStep ? 'tp-step-item--active' : ''} ${index < currentStep ? 'tp-step-item--completed' : ''}`}
                  onClick={() => goToStep(index)}
                  disabled={isTransitioning}
                >
                  <div className="tp-step-number">
                    {index < currentStep ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>
                  <div className="tp-step-text">
                    <span className="tp-step-title">{step.title}</span>
                    <span className="tp-step-desc">{step.description}</span>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div className={`tp-step-line ${index < currentStep ? 'tp-step-line--completed' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form Content */}
          <form onSubmit={handleSaveProfile} className="tp-form">
            {/* Step Header */}
            <div className="tp-form-header">
              <h2 className="tp-form-title">{steps[currentStep].title}</h2>
              <p className="tp-form-description">{steps[currentStep].description}</p>
            </div>

            {/* Step Content with Transition */}
            <div className={`tp-form-body ${isTransitioning ? `tp-form-body--${slideDirection}` : ''}`}>
              {renderStepContent()}
            </div>

            {/* Navigation Footer */}
            <div className="tp-form-footer">
              <div className="tp-footer-left">
                {currentStep > 0 && (
                  <button
                    type="button"
                    className="tp-btn tp-btn--secondary"
                    onClick={goToPrevStep}
                    disabled={isTransitioning}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    Previous
                  </button>
                )}
              </div>

              <div className="tp-footer-center">
                <span className="tp-step-counter">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>

              <div className="tp-footer-right">
                {currentStep < steps.length - 1 ? (
                  <button
                    type="button"
                    className="tp-btn tp-btn--primary"
                    onClick={goToNextStep}
                    disabled={isTransitioning}
                  >
                    Next
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="tp-btn tp-btn--save"
                    disabled={saving || isTransitioning}
                  >
                    {saving ? (
                      <>
                        <span className="tp-btn-spinner"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                          <polyline points="17 21 17 13 7 13 7 21"/>
                          <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Save Profile
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default TherapistProfile;
