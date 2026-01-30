import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTherapistConfig } from '../../components/sidebar/sidebarConfigs';

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

  // Modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [modalStep, setModalStep] = useState(0);

  const {
    loading,
    saving,
    uploadingFile,
    validationErrors,
    formData,
    newEducation,
    newCertification,
    newLicense,
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
    handleNewLicenseChange,
    handleAddLicense,
    handleRemoveLicense,
    handleSaveProfile
  } = useProfileForm(currentUser, 'therapist', navigate);

  const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();

  // Get primary license status (first license in array)
  const primaryLicense = formData.licenses?.[0];
  const licenseStatus = primaryLicense?.licenseExpirationDate
    ? getExpirationStatus(primaryLicense.licenseExpirationDate)
    : null;

  // Calculate profile completion status
  const getProfileCompletion = () => {
    const requirements = [
      { label: 'Profile photo', completed: !!formData.profilePhoto },
      { label: 'Personal information', completed: !!(formData.firstName && formData.lastName && formData.email && formData.phone) },
      { label: 'License information', completed: formData.licenses?.length > 0 },
      { label: 'Education history', completed: formData.educationHistory?.length > 0 },
      { label: 'Certifications', completed: formData.certifications?.length > 0 }
    ];

    const completedCount = requirements.filter(r => r.completed).length;
    const percentage = Math.round((completedCount / requirements.length) * 100);
    const missingItems = requirements.filter(r => !r.completed).map(r => r.label);

    return { percentage, completedCount, total: requirements.length, missingItems, isComplete: percentage === 100 };
  };

  const profileCompletion = getProfileCompletion();

  // Modal step configuration
  const modalSteps = [
    { id: 'personal', title: 'Personal Information', description: 'Basic details and contact info' },
    { id: 'credentials', title: 'Professional Credentials', description: 'License and clinical credentials' },
    { id: 'education', title: 'Education History', description: 'Academic background' },
    { id: 'certifications', title: 'Certifications', description: 'Professional credentials' }
  ];

  const openProfileModal = () => {
    setModalStep(0);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setModalStep(0);
  };

  const goToModalStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < modalSteps.length) {
      setModalStep(stepIndex);
    }
  };

  const nextModalStep = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (modalStep < modalSteps.length - 1) {
      setModalStep(modalStep + 1);
    }
  };

  const prevModalStep = () => {
    if (modalStep > 0) {
      setModalStep(modalStep - 1);
    }
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    await handleSaveProfile(e);
    closeProfileModal();
  };

  // Prevent Enter key from submitting the form (except on the final step)
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  };

  // Render modal step content
  const renderModalStepContent = () => {
    switch (modalStep) {
      case 0:
        return (
          <PersonalInfoSection
            formData={formData}
            validationErrors={validationErrors}
            onInputChange={handleInputChange}
            onNestedChange={handleNestedChange}
          />
        );
      case 1:
        return (
          <TherapistCredentials
            formData={formData}
            validationErrors={validationErrors}
            newLicense={newLicense}
            onInputChange={handleInputChange}
            onNewLicenseChange={handleNewLicenseChange}
            onAddLicense={handleAddLicense}
            onRemoveLicense={handleRemoveLicense}
          />
        );
      case 2:
        return (
          <>
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
          </>
        );
      case 3:
        return (
          <>
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
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar {...getTherapistConfig()} forceActive="/therapist/profile" />
      {loading ? (
        <Loading role="therapist" message="Loading profile" variant="content" />
      ) : (
        <div style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
        <div className="tp-page">

          {/* Page Header */}
          <div className="tp-page-header">
            <h1 className="tp-page-title">MY PROFILE</h1>
            <p className="tp-page-subtitle">Manage your professional information</p>
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
                <p className="tp-profile-role">
                  {formData.licenses?.length > 0
                    ? formData.licenses.map(l => l.licenseType).join(' / ')
                    : 'Therapist'}
                </p>

                <div className="tp-profile-meta">
                  {/* Years of Experience */}
                  <span className="tp-badge tp-badge--info">
                    {formData.yearsExperience || 0} Years Experience
                  </span>

                  {/* License Status - show primary license status */}
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

                  {/* License Count */}
                  <span className="tp-badge tp-badge--info">
                    {formData.licenses?.length || 0} License(s)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Completion Notice */}
          {!profileCompletion.isComplete && (
            <div className="tp-completion-notice">
              <div className="tp-completion-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div className="tp-completion-content">
                <h3 className="tp-completion-title">Complete Your Profile</h3>
                <p className="tp-completion-text">
                  Please complete your personal information and upload required documents before you can fully use the system.
                </p>
                <div className="tp-completion-progress">
                  <div className="tp-progress-bar">
                    <div
                      className="tp-progress-fill"
                      style={{ width: `${profileCompletion.percentage}%` }}
                    />
                  </div>
                  <span className="tp-progress-text">
                    {profileCompletion.completedCount} of {profileCompletion.total} completed ({profileCompletion.percentage}%)
                  </span>
                </div>
                {profileCompletion.missingItems.length > 0 && (
                  <div className="tp-completion-missing">
                    <span className="tp-missing-label">Missing:</span>
                    <span className="tp-missing-items">{profileCompletion.missingItems.join(' • ')}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="tp-completion-btn"
                  onClick={openProfileModal}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Complete Profile Now
                </button>
              </div>
            </div>
          )}

          {/* Profile Display Section - Shows when profile is complete */}
          {profileCompletion.isComplete && (
            <div className="tp-profile-display">
              {/* Edit Profile Button */}
              <div className="tp-profile-display__header">
                <h2 className="tp-profile-display__title">Profile Information</h2>
                <button
                  type="button"
                  className="tp-btn tp-btn--secondary"
                  onClick={openProfileModal}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
              </div>

              {/* Personal Information */}
              <div className="tp-profile-section">
                <h3 className="tp-profile-section__title">Personal Information</h3>
                <div className="tp-profile-grid">
                  <div className="tp-profile-field">
                    <span className="tp-profile-field__label">Date of Birth</span>
                    <span className="tp-profile-field__value">{formData.dateOfBirth || '-'}</span>
                  </div>
                  <div className="tp-profile-field">
                    <span className="tp-profile-field__label">Gender</span>
                    <span className="tp-profile-field__value">{formData.gender || '-'}</span>
                  </div>
                  <div className="tp-profile-field">
                    <span className="tp-profile-field__label">Phone</span>
                    <span className="tp-profile-field__value">{formData.phone || '-'}</span>
                  </div>
                  <div className="tp-profile-field">
                    <span className="tp-profile-field__label">Email</span>
                    <span className="tp-profile-field__value">{formData.email || '-'}</span>
                  </div>
                  <div className="tp-profile-field tp-profile-field--full">
                    <span className="tp-profile-field__label">Address</span>
                    <span className="tp-profile-field__value">
                      {formData.address?.street && `${formData.address.street}, `}
                      {formData.address?.city && `${formData.address.city}, `}
                      {formData.address?.state && `${formData.address.state} `}
                      {formData.address?.zip || ''}
                      {!formData.address?.street && !formData.address?.city && '-'}
                    </span>
                  </div>
                  <div className="tp-profile-field">
                    <span className="tp-profile-field__label">Emergency Contact</span>
                    <span className="tp-profile-field__value">
                      {formData.emergencyContact?.name || '-'}
                      {formData.emergencyContact?.phone && ` (${formData.emergencyContact.phone})`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Professional Credentials - Licenses */}
              {formData.licenses?.length > 0 && (
                <div className="tp-profile-section">
                  <h3 className="tp-profile-section__title">Professional Licenses</h3>
                  {formData.licenses?.length > 0 ? (
                    <div className="tp-profile-cards">
                      {formData.licenses.map((license, idx) => {
                        const status = license.licenseExpirationDate
                          ? getExpirationStatus(license.licenseExpirationDate)
                          : null;
                        return (
                          <div key={license.id || idx} className="tp-profile-card">
                            <div className="tp-profile-card__header">
                              <strong>{license.licenseType}</strong>
                              {status && (
                                <span className={`tp-status-badge tp-status-badge--${
                                  status === 'Active' ? 'success' :
                                  status === 'Expiring Soon' ? 'warning' : 'danger'
                                }`}>
                                  {status}
                                </span>
                              )}
                            </div>
                            <div className="tp-profile-card__body">
                              <p><strong>License #:</strong> {license.licenseNumber}</p>
                              {license.licenseState && <p><strong>State/Region:</strong> {license.licenseState}</p>}
                              {license.licenseIssueDate && <p className="tp-profile-card__meta">Issued: {license.licenseIssueDate}</p>}
                              {license.licenseExpirationDate && <p className="tp-profile-card__meta">Expires: {license.licenseExpirationDate}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="tp-profile-empty">No licenses added</p>
                  )}

                  {/* Years of Experience & Employment Status */}
                  <div className="tp-profile-grid" style={{ marginTop: '16px' }}>
                    <div className="tp-profile-field">
                      <span className="tp-profile-field__label">Years of Experience</span>
                      <span className="tp-profile-field__value">{formData.yearsExperience || 0}</span>
                    </div>
                    <div className="tp-profile-field">
                      <span className="tp-profile-field__label">Employment Status</span>
                      <span className="tp-profile-field__value">{formData.employmentStatus || '-'}</span>
                    </div>
                    <div className="tp-profile-field tp-profile-field--full">
                      <span className="tp-profile-field__label">Specializations</span>
                      <div className="tp-profile-tags">
                        {formData.specializations?.length > 0 ? (
                          formData.specializations.map((spec, idx) => (
                            <span key={idx} className="tp-profile-tag">{spec}</span>
                          ))
                        ) : (
                          <span className="tp-profile-field__value">Managed by admin</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Education History */}
                {formData.educationHistory?.length > 0 && (
                <div className="tp-profile-section">
                  <h3 className="tp-profile-section__title">Education History</h3>
                  {formData.educationHistory?.length > 0 ? (
                    <div className="tp-profile-cards">
                      {formData.educationHistory.map((edu, idx) => (
                        <div key={idx} className="tp-profile-card tp-profile-card--with-image">
                          {edu.certificateURL && (
                            <a
                              href={edu.certificateURL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tp-profile-card__image"
                            >
                              <img src={edu.certificateURL} alt={`${edu.degreeType} - ${edu.institution}`} />
                            </a>
                          )}
                          <div className="tp-profile-card__content">
                            <div className="tp-profile-card__header">
                              <strong>{edu.degreeType}</strong> in {edu.fieldOfStudy}
                            </div>
                            <div className="tp-profile-card__body">
                              <p>{edu.institution}</p>
                              <p className="tp-profile-card__meta">Graduated: {edu.graduationYear}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="tp-profile-empty">No education history added</p>
                  )}
                </div>
              )}

              {/* Certifications */}
              {formData.certifications?.length > 0 && (
              <div className="tp-profile-section">
                <h3 className="tp-profile-section__title">Certifications</h3>
                {formData.certifications?.length > 0 ? (
                  <div className="tp-profile-cards">
                    {formData.certifications.map((cert, idx) => (
                      <div key={idx} className="tp-profile-card tp-profile-card--with-image">
                        {cert.certificateURL && (
                          <a
                            href={cert.certificateURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tp-profile-card__image"
                          >
                            <img src={cert.certificateURL} alt={cert.name} />
                          </a>
                        )}
                        <div className="tp-profile-card__content">
                          <div className="tp-profile-card__header">
                            <strong>{cert.name}</strong>
                          </div>
                          <div className="tp-profile-card__body">
                            <p>{cert.issuingOrg}</p>
                            <p className="tp-profile-card__meta">Issued: {cert.issueDate}</p>
                            {cert.expirationDate && <p className="tp-profile-card__meta">Expires: {cert.expirationDate}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="tp-profile-empty">No certifications added</p>
                )}
              </div>
              )}
            </div>
          )}

          {/* Profile Completion Modal */}
          {showProfileModal && (
            <div className="tp-modal-overlay" onClick={closeProfileModal}>
              <div className="tp-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="tp-modal-header">
                  <div className="tp-modal-header-content">
                    <h2 className="tp-modal-title">Complete Your Profile</h2>
                    <p className="tp-modal-subtitle">Fill out all required information</p>
                  </div>
                  <button
                    type="button"
                    className="tp-modal-close"
                    onClick={closeProfileModal}
                    aria-label="Close modal"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>

                {/* Modal Step Indicator */}
                <div className="tp-modal-steps">
                  {modalSteps.map((step, index) => (
                    <button
                      key={step.id}
                      type="button"
                      className={`tp-modal-step ${index === modalStep ? 'tp-modal-step--active' : ''} ${index < modalStep ? 'tp-modal-step--completed' : ''}`}
                      onClick={() => goToModalStep(index)}
                    >
                      <span className="tp-modal-step-number">
                        {index < modalStep ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="tp-modal-step-title">{step.title}</span>
                    </button>
                  ))}
                </div>

                {/* Modal Body */}
                <form onSubmit={handleModalSave} onKeyDown={handleFormKeyDown}>
                  <div className="tp-modal-body">
                    <div className="tp-modal-step-header">
                      <h3>{modalSteps[modalStep].title}</h3>
                      <p>{modalSteps[modalStep].description}</p>
                    </div>
                    <div className="tp-modal-step-content">
                      {renderModalStepContent()}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="tp-modal-footer">
                    <div className="tp-modal-footer-left">
                      {modalStep > 0 && (
                        <button
                          type="button"
                          className="tp-btn tp-btn--secondary"
                          onClick={prevModalStep}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                          </svg>
                          Previous
                        </button>
                      )}
                    </div>

                    <div className="tp-modal-footer-center">
                      <span className="tp-modal-step-counter">
                        Step {modalStep + 1} of {modalSteps.length}
                      </span>
                    </div>

                    <div className="tp-modal-footer-right">
                      {modalStep < modalSteps.length - 1 ? (
                        <button
                          type="button"
                          className="tp-btn tp-btn--primary"
                          onClick={(e) => nextModalStep(e)}
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
                          disabled={saving}
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
          )}
        </div>
        </div>
      )}
    </div>
  );
};

export default TherapistProfile;
