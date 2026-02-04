import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';
import Sidebar from '../../components/sidebar/Sidebar';
import { getTherapistConfig } from '../../components/sidebar/sidebarConfigs';

// Custom hook
import { useProfileForm } from '../../hooks/useProfileForm';

// Utilities
import { getExpirationStatus } from '../../utils/profileHelpers';

import './css/TherapistProfile.css';

const TABS = [
  { id: 'personal', label: 'Personal Info', icon: 'user' },
  { id: 'credentials', label: 'Credentials', icon: 'badge' },
  { id: 'education', label: 'Education & Certifications', icon: 'graduation' }
];

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

const TherapistProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

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

  const handleSave = async (e) => {
    e.preventDefault();
    await handleSaveProfile(e);
    setIsEditing(false);
  };

  const startEditing = () => {
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleBack = () => {
    navigate('/therapist/dashboard');
  };

  // Check if profile has required fields completed
  const isProfileComplete = formData.profilePhoto && formData.firstName && formData.lastName && formData.phone;

  // Render tab icon
  const renderTabIcon = (iconName) => {
    switch (iconName) {
      case 'user':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        );
      case 'badge':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
          </svg>
        );
      case 'graduation':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        );
      default:
        return null;
    }
  };

  // Personal Info Section Content
  const renderPersonalInfo = () => (
    <div className="tp-tab-content">
      {isEditing ? (
        <form onSubmit={handleSave} className="tp-form">
          {/* Basic Information Section */}
          <div className="tp-form-section">
            <h4 className="tp-form-section-title">Basic Information</h4>
            <div className="tp-edit-card">
              <div className="tp-edit-card-header">
                <span className="tp-edit-card-label">Name (Read Only)</span>
              </div>
              <div className="tp-form-grid tp-form-grid--3">
                <div className="tp-field">
                  <label className="tp-label">First Name</label>
                  <input type="text" className="tp-input tp-input--disabled" value={formData.firstName} disabled />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Middle Name</label>
                  <input type="text" className="tp-input tp-input--disabled" value={formData.middleName} disabled />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Last Name</label>
                  <input type="text" className="tp-input tp-input--disabled" value={formData.lastName} disabled />
                </div>
              </div>
              <p className="tp-helper">Name is managed by your administrator</p>
            </div>

            <div className="tp-add-section">
              <h4 className="tp-add-title">Personal Details</h4>
              <div className="tp-form-grid">
                <div className="tp-field">
                  <label className="tp-label">Date of Birth <span className="tp-required">*</span></label>
                  <input
                    type="date"
                    className={`tp-input ${validationErrors.dateOfBirth ? 'tp-input--error' : ''}`}
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                  {validationErrors.dateOfBirth && <span className="tp-error">{validationErrors.dateOfBirth}</span>}
                </div>
                <div className="tp-field">
                  <label className="tp-label">Gender</label>
                  <select className="tp-input" value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)}>
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="tp-form-section">
            <h4 className="tp-form-section-title">Contact Information</h4>
            <div className="tp-edit-card">
              <div className="tp-edit-card-header">
                <span className="tp-edit-card-label">Email (Read Only)</span>
              </div>
              <div className="tp-field">
                <label className="tp-label">Email</label>
                <input type="email" className="tp-input tp-input--disabled" value={formData.email} disabled />
              </div>
            </div>

            <div className="tp-add-section">
              <h4 className="tp-add-title">Contact Details</h4>
              <div className="tp-form-grid">
                <div className="tp-field">
                  <label className="tp-label">Phone <span className="tp-required">*</span></label>
                  <input
                    type="tel"
                    className={`tp-input ${validationErrors.phone ? 'tp-input--error' : ''}`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="123-456-7890"
                  />
                  {validationErrors.phone && <span className="tp-error">{validationErrors.phone}</span>}
                </div>
              </div>

              <div className="tp-field">
                <label className="tp-label">Street Address</label>
                <input
                  type="text"
                  className="tp-input"
                  value={formData.address?.street || ''}
                  onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>

              <div className="tp-form-grid tp-form-grid--3">
                <div className="tp-field">
                  <label className="tp-label">City</label>
                  <input
                    type="text"
                    className="tp-input"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                  />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Province</label>
                  <input
                    type="text"
                    className="tp-input"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                  />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Postal Code</label>
                  <input
                    type="text"
                    className="tp-input"
                    value={formData.address?.zip || ''}
                    onChange={(e) => handleNestedChange('address', 'zip', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact Section */}
          <div className="tp-form-section">
            <h4 className="tp-form-section-title">Emergency Contact</h4>
            <div className="tp-add-section">
              <h4 className="tp-add-title">Emergency Contact Details</h4>
              <div className="tp-form-grid">
                <div className="tp-field">
                  <label className="tp-label">Contact Name</label>
                  <input
                    type="text"
                    className="tp-input"
                    value={formData.emergencyContact?.name || ''}
                    onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
                  />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Contact Phone</label>
                  <input
                    type="tel"
                    className="tp-input"
                    value={formData.emergencyContact?.phone || ''}
                    onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
                    placeholder="123-456-7890"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="tp-form-actions">
            <button type="button" className="tp-btn tp-btn--secondary" onClick={cancelEditing}>Cancel</button>
            <button type="submit" className="tp-btn tp-btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="tp-view-content">
          <div className="tp-info-section">
            <h4 className="tp-info-section-title">Basic Information</h4>
            <div className="tp-info-grid">
              <div className="tp-info-item">
                <span className="tp-info-label">Date of Birth</span>
                <span className="tp-info-value">{formData.dateOfBirth || <em className="tp-empty">Not set</em>}</span>
              </div>
              <div className="tp-info-item">
                <span className="tp-info-label">Gender</span>
                <span className="tp-info-value">{formData.gender || <em className="tp-empty">Not set</em>}</span>
              </div>
            </div>
          </div>

          <div className="tp-info-section">
            <h4 className="tp-info-section-title">Contact Information</h4>
            <div className="tp-info-grid">
              <div className="tp-info-item">
                <span className="tp-info-label">Phone</span>
                <span className="tp-info-value">{formData.phone || <em className="tp-empty">Not set</em>}</span>
              </div>
              <div className="tp-info-item">
                <span className="tp-info-label">Email</span>
                <span className="tp-info-value">{formData.email}</span>
              </div>
              <div className="tp-info-item tp-info-item--full">
                <span className="tp-info-label">Address</span>
                <span className="tp-info-value">
                  {formData.address?.street || formData.address?.city ? (
                    <>
                      {formData.address?.street && `${formData.address.street}, `}
                      {formData.address?.city && `${formData.address.city}, `}
                      {formData.address?.state && `${formData.address.state} `}
                      {formData.address?.zip || ''}
                    </>
                  ) : <em className="tp-empty">Not set</em>}
                </span>
              </div>
            </div>
          </div>

          <div className="tp-info-section">
            <h4 className="tp-info-section-title">Emergency Contact</h4>
            <div className="tp-info-grid">
              <div className="tp-info-item tp-info-item--full">
                <span className="tp-info-label">Contact Details</span>
                <span className="tp-info-value">
                  {formData.emergencyContact?.name ? (
                    `${formData.emergencyContact.name}${formData.emergencyContact.phone ? ` - ${formData.emergencyContact.phone}` : ''}`
                  ) : <em className="tp-empty">Not set</em>}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Professional Credentials Section Content
  const renderCredentials = () => (
    <div className="tp-tab-content">
      {isEditing ? (
        <form onSubmit={handleSave} className="tp-form">
          {/* Existing Licenses */}
          {formData.licenses?.length > 0 && (
            <div className="tp-form-section">
              <h4 className="tp-form-section-title">Your Licenses</h4>
              <div className="tp-licenses-list">
                {formData.licenses.map((license, index) => {
                  const status = license.licenseExpirationDate ? getExpirationStatus(license.licenseExpirationDate) : null;
                  return (
                    <div key={license.id || index} className="tp-license-item">
                      <div className="tp-license-info">
                        <strong>{license.licenseType}</strong>
                        <span>#{license.licenseNumber}</span>
                        {license.licenseState && <span>{license.licenseState}</span>}
                        {status && <span className={`tp-status tp-status--${status === 'Active' ? 'active' : status === 'Expiring Soon' ? 'warning' : 'expired'}`}>{status}</span>}
                      </div>
                      <button type="button" className="tp-btn-remove" onClick={() => handleRemoveLicense(index)}>Remove</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add New License */}
          <div className="tp-add-section">
            <h4 className="tp-add-title">{formData.licenses?.length > 0 ? 'Add Another License' : 'Add License'}</h4>
            <div className="tp-form-grid">
              <div className="tp-field">
                <label className="tp-label">License Type</label>
                <select className="tp-input" value={newLicense.licenseType} onChange={(e) => handleNewLicenseChange('licenseType', e.target.value)}>
                  <option value="">Select type</option>
                  <option value="BCBA">BCBA</option>
                  <option value="BCaBA">BCaBA</option>
                  <option value="RBT">RBT</option>
                  <option value="SLP">SLP</option>
                  <option value="OT">OT</option>
                  <option value="PT">PT</option>
                  <option value="LMFT">LMFT</option>
                  <option value="LPCC">LPCC</option>
                  <option value="SPED">SPED</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="tp-field">
                <label className="tp-label">License Number</label>
                <input type="text" className="tp-input" value={newLicense.licenseNumber} onChange={(e) => handleNewLicenseChange('licenseNumber', e.target.value)} placeholder="e.g., 1-23-45678" />
              </div>
            </div>
            <div className="tp-form-grid tp-form-grid--3">
              <div className="tp-field">
                <label className="tp-label">State/Region</label>
                <input type="text" className="tp-input" value={newLicense.licenseState} onChange={(e) => handleNewLicenseChange('licenseState', e.target.value)} placeholder="e.g., California" />
              </div>
              <div className="tp-field">
                <label className="tp-label">Issue Date</label>
                <input type="date" className="tp-input" value={newLicense.licenseIssueDate} onChange={(e) => handleNewLicenseChange('licenseIssueDate', e.target.value)} />
              </div>
              <div className="tp-field">
                <label className="tp-label">Expiration Date</label>
                <input type="date" className="tp-input" value={newLicense.licenseExpirationDate} onChange={(e) => handleNewLicenseChange('licenseExpirationDate', e.target.value)} />
              </div>
            </div>
            <button type="button" className="tp-btn tp-btn--outline" onClick={handleAddLicense}>+ Add License</button>
            {validationErrors.licenses && <span className="tp-error">{validationErrors.licenses}</span>}
          </div>

          <div className="tp-form-section">
            <h4 className="tp-form-section-title">Experience & Status</h4>
            <div className="tp-form-grid">
              <div className="tp-field">
                <label className="tp-label">Years of Experience</label>
                <input type="number" className="tp-input" value={formData.yearsExperience} onChange={(e) => handleInputChange('yearsExperience', parseInt(e.target.value) || 0)} min="0" />
              </div>
              <div className="tp-field">
                <label className="tp-label">Employment Status</label>
                <select className="tp-input" value={formData.employmentStatus} onChange={(e) => handleInputChange('employmentStatus', e.target.value)}>
                  <option value="">Select status</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Per Diem">Per Diem</option>
                </select>
              </div>
            </div>
          </div>

          <div className="tp-form-actions">
            <button type="button" className="tp-btn tp-btn--secondary" onClick={cancelEditing}>Cancel</button>
            <button type="submit" className="tp-btn tp-btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="tp-view-content">
          {formData.licenses?.length > 0 ? (
            <div className="tp-credentials-grid">
              {formData.licenses.map((license, idx) => {
                const status = license.licenseExpirationDate ? getExpirationStatus(license.licenseExpirationDate) : null;
                return (
                  <div key={license.id || idx} className="tp-credential-card">
                    <div className="tp-credential-header">
                      <strong>{license.licenseType}</strong>
                      {status && <span className={`tp-status tp-status--${status === 'Active' ? 'active' : status === 'Expiring Soon' ? 'warning' : 'expired'}`}>{status}</span>}
                    </div>
                    <div className="tp-credential-details">
                      <p>License #: {license.licenseNumber}</p>
                      {license.licenseState && <p>Region: {license.licenseState}</p>}
                      {license.licenseIssueDate && <p className="tp-meta">Issued: {license.licenseIssueDate}</p>}
                      {license.licenseExpirationDate && <p className="tp-meta">Expires: {license.licenseExpirationDate}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="tp-empty-message">No licenses added yet. Click Edit to add your professional licenses.</p>
          )}

          {(formData.yearsExperience > 0 || formData.employmentStatus || formData.specializations?.length > 0) && (
            <div className="tp-info-section tp-info-section--bordered">
              <h4 className="tp-info-section-title">Experience & Specializations</h4>
              <div className="tp-info-grid">
                {formData.yearsExperience > 0 && (
                  <div className="tp-info-item">
                    <span className="tp-info-label">Years of Experience</span>
                    <span className="tp-info-value">{formData.yearsExperience}</span>
                  </div>
                )}
                {formData.employmentStatus && (
                  <div className="tp-info-item">
                    <span className="tp-info-label">Employment Status</span>
                    <span className="tp-info-value">{formData.employmentStatus}</span>
                  </div>
                )}
              </div>
              {formData.specializations?.length > 0 && (
                <div className="tp-info-item">
                  <span className="tp-info-label">Specializations</span>
                  <span className="tp-info-value">{formData.specializations.length}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Education & Certifications Section Content
  const renderEducation = () => (
    <div className="tp-tab-content">
      {isEditing ? (
        <form onSubmit={handleSave} className="tp-form">
          {/* Education */}
          <div className="tp-form-section">
            <h4 className="tp-form-section-title">Education History</h4>
            {formData.educationHistory?.length > 0 && (
              <div className="tp-entries-list">
                {formData.educationHistory.map((edu, index) => (
                  <div key={edu.id || index} className="tp-entry-item">
                    <div className="tp-entry-content">
                      <strong>{edu.degreeType} in {edu.fieldOfStudy}</strong>
                      <span>{edu.institution}</span>
                      <span className="tp-meta">Graduated: {edu.graduationYear}</span>
                    </div>
                    <button type="button" className="tp-btn-remove" onClick={() => handleRemoveEducation(index)}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            <div className="tp-add-section tp-add-section--compact">
              <h4 className="tp-add-title">Add Education</h4>
              <div className="tp-form-grid">
                <div className="tp-field">
                  <label className="tp-label">Degree Type</label>
                  <select className="tp-input" value={newEducation.degreeType} onChange={(e) => handleNewEducationChange('degreeType', e.target.value)}>
                    <option value="">Select degree</option>
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Master's">Master's</option>
                    <option value="Doctorate">Doctorate</option>
                    <option value="Associate">Associate</option>
                    <option value="Certificate">Certificate</option>
                  </select>
                </div>
                <div className="tp-field">
                  <label className="tp-label">Field of Study</label>
                  <input type="text" className="tp-input" value={newEducation.fieldOfStudy} onChange={(e) => handleNewEducationChange('fieldOfStudy', e.target.value)} placeholder="e.g., Psychology" />
                </div>
              </div>
              <div className="tp-form-grid">
                <div className="tp-field">
                  <label className="tp-label">Institution</label>
                  <input type="text" className="tp-input" value={newEducation.institution} onChange={(e) => handleNewEducationChange('institution', e.target.value)} placeholder="University name" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Graduation Year</label>
                  <input type="number" className="tp-input" value={newEducation.graduationYear} onChange={(e) => handleNewEducationChange('graduationYear', e.target.value)} placeholder="2020" />
                </div>
              </div>
              <div className="tp-field">
                <label className="tp-label">Certificate (Optional)</label>
                <input type="file" accept="image/*,.pdf" onChange={handleEducationCertificateUpload} disabled={uploadingFile === 'new-education-cert'} />
                {uploadingFile === 'new-education-cert' && <span className="tp-uploading">Uploading...</span>}
              </div>
              <button type="button" className="tp-btn tp-btn--outline" onClick={handleAddEducation}>+ Add Education</button>
            </div>
          </div>

          {/* Certifications */}
          <div className="tp-form-section">
            <h4 className="tp-form-section-title">Certifications</h4>
            {formData.certifications?.length > 0 && (
              <div className="tp-entries-list">
                {formData.certifications.map((cert, index) => (
                  <div key={cert.id || index} className="tp-entry-item">
                    <div className="tp-entry-content">
                      <strong>{cert.name}</strong>
                      <span>{cert.issuingOrg}</span>
                      <span className="tp-meta">Issued: {cert.issueDate}</span>
                    </div>
                    <button type="button" className="tp-btn-remove" onClick={() => handleRemoveCertification(index)}>Remove</button>
                  </div>
                ))}
              </div>
            )}

            <div className="tp-add-section tp-add-section--compact">
              <h4 className="tp-add-title">Add Certification</h4>
              <div className="tp-form-grid">
                <div className="tp-field">
                  <label className="tp-label">Certification Name</label>
                  <input type="text" className="tp-input" value={newCertification.name} onChange={(e) => handleNewCertificationChange('name', e.target.value)} placeholder="e.g., CPR Certification" />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Issuing Organization</label>
                  <input type="text" className="tp-input" value={newCertification.issuingOrg} onChange={(e) => handleNewCertificationChange('issuingOrg', e.target.value)} placeholder="e.g., Red Cross" />
                </div>
              </div>
              <div className="tp-form-grid">
                <div className="tp-field">
                  <label className="tp-label">Issue Date</label>
                  <input type="date" className="tp-input" value={newCertification.issueDate} onChange={(e) => handleNewCertificationChange('issueDate', e.target.value)} />
                </div>
                <div className="tp-field">
                  <label className="tp-label">Expiration Date (Optional)</label>
                  <input type="date" className="tp-input" value={newCertification.expirationDate} onChange={(e) => handleNewCertificationChange('expirationDate', e.target.value)} />
                </div>
              </div>
              <div className="tp-field">
                <label className="tp-label">Certificate (Optional)</label>
                <input type="file" accept="image/*,.pdf" onChange={handleCertificationCertificateUpload} disabled={uploadingFile === 'new-cert-cert'} />
                {uploadingFile === 'new-cert-cert' && <span className="tp-uploading">Uploading...</span>}
              </div>
              <button type="button" className="tp-btn tp-btn--outline" onClick={handleAddCertification}>+ Add Certification</button>
            </div>
          </div>

          <div className="tp-form-actions">
            <button type="button" className="tp-btn tp-btn--secondary" onClick={cancelEditing}>Cancel</button>
            <button type="submit" className="tp-btn tp-btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="tp-view-content">
          {/* Education Display */}
          <div className="tp-info-section">
            <h4 className="tp-info-section-title">Education History</h4>
            {formData.educationHistory?.length > 0 ? (
              <div className="tp-education-grid">
                {formData.educationHistory.map((edu, idx) => (
                  <div key={idx} className="tp-education-card">
                    {edu.certificateURL && (
                      <a href={edu.certificateURL} target="_blank" rel="noopener noreferrer" className="tp-edu-image">
                        <img src={edu.certificateURL} alt="Certificate" />
                      </a>
                    )}
                    <div className="tp-edu-content">
                      <strong>{edu.degreeType} in {edu.fieldOfStudy}</strong>
                      <span>{edu.institution}</span>
                      <span className="tp-meta">Graduated: {edu.graduationYear}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="tp-empty-message tp-empty-message--small">No education history added yet.</p>
            )}
          </div>

          {/* Certifications Display */}
          <div className="tp-info-section">
            <h4 className="tp-info-section-title">Certifications</h4>
            {formData.certifications?.length > 0 ? (
              <div className="tp-education-grid">
                {formData.certifications.map((cert, idx) => (
                  <div key={idx} className="tp-education-card">
                    {cert.certificateURL && (
                      <a href={cert.certificateURL} target="_blank" rel="noopener noreferrer" className="tp-edu-image">
                        <img src={cert.certificateURL} alt="Certificate" />
                      </a>
                    )}
                    <div className="tp-edu-content">
                      <strong>{cert.name}</strong>
                      <span>{cert.issuingOrg}</span>
                      <span className="tp-meta">Issued: {cert.issueDate}</span>
                      {cert.expirationDate && <span className="tp-meta">Expires: {cert.expirationDate}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="tp-empty-message tp-empty-message--small">No certifications added yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render the active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'personal':
        return renderPersonalInfo();
      case 'credentials':
        return renderCredentials();
      case 'education':
        return renderEducation();
      default:
        return renderPersonalInfo();
    }
  };

  return (
    <div className="tp-layout">
      <Sidebar {...getTherapistConfig()} forceActive="/therapist/profile" />
      {loading ? (
        <Loading role="therapist" message="Loading profile" variant="content" />
      ) : (
        <main className="tp-main">
          <div className="tp-container">
            {/* Profile Completion Notice */}
            {!isProfileComplete && (
              <div className="tp-notice tp-notice--warning">
                <div className="tp-notice-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div className="tp-notice-content">
                  <strong>Complete Your Profile</strong>
                  <p>Please add your profile photo and contact information. This helps parents and staff identify you.</p>
                </div>
              </div>
            )}

            {/* Profile Header Section - Student Profile Style */}
            <section className="tp-profile-header-section">
              {/* Header Bar */}
              <div className="tp-profile-header-bar">
                <button
                  onClick={() => navigate(-1)}
                  className="tp-back-btn"
                  aria-label="Go back"
                >
                  <BackArrowIcon />
                </button>
                <div className="tp-header-text">
                  <h1 className="tp-header-title-text">MY PROFILE</h1>
                  <p className="tp-header-subtitle-text">View and manage your professional information</p>
                </div>
              </div>

              {/* Profile Card Container - 2 Column Layout */}
              <div className="tp-profile-card-container">
                {/* Left: Photo Section */}
                <div className="tp-profile-photo-section">
                  <div className="tp-profile-photo-wrapper">
                    {formData.profilePhoto ? (
                      <img src={formData.profilePhoto} alt="Profile" className="tp-profile-photo-img" />
                    ) : (
                      <div className="tp-profile-photo-placeholder">
                        <span className="tp-placeholder-initial">
                          {formData.firstName ? formData.firstName[0] : 'T'}
                        </span>
                      </div>
                    )}
                    <label className="tp-photo-upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        disabled={uploadingFile === 'profile-photo'}
                      />
                      {uploadingFile === 'profile-photo' ? (
                        <span className="tp-spinner-small"></span>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                          <circle cx="12" cy="13" r="4"/>
                        </svg>
                      )}
                    </label>
                  </div>

                  {/* Quick Info Items below photo */}
                  <div className="tp-photo-section-info">
                    {formData.yearsExperience > 0 && (
                      <div className="tp-photo-info-item">
                        <div className="tp-photo-info-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                        </div>
                        <div className="tp-photo-info-content">
                          <span className="tp-photo-info-label">Experience</span>
                          <span className="tp-photo-info-value">{formData.yearsExperience} years</span>
                        </div>
                      </div>
                    )}
                    {formData.specializations?.length > 0 && (
                      <div className="tp-photo-info-item">
                        <div className="tp-photo-info-icon">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                          </svg>
                        </div>
                        <div className="tp-photo-info-content">
                          <span className="tp-photo-info-label">Specializations</span>
                          <span className="tp-photo-info-value">{formData.specializations.length}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Info Section */}
                <div className="tp-profile-info-section">
                  {/* Name Row */}
                  <div className="tp-profile-name-row">
                    <h1 className="tp-profile-therapist-name">{fullName || 'Your Name'}</h1>
                    <span className="tp-profile-role-badge">
                      {formData.licenses?.length > 0
                        ? formData.licenses.map(l => l.licenseType).join(' / ')
                        : 'Therapist'}
                    </span>
                  </div>

                  {/* Info Grid */}
                  <div className="tp-profile-info-grid">
                    <div className="tp-profile-info-item">
                      <div className="tp-profile-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                      </div>
                      <div className="tp-profile-info-content">
                        <span className="tp-profile-info-label">Email</span>
                        <span className="tp-profile-info-value">{formData.email || 'Not set'}</span>
                      </div>
                    </div>

                    <div className="tp-profile-info-item">
                      <div className="tp-profile-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                      </div>
                      <div className="tp-profile-info-content">
                        <span className="tp-profile-info-label">Phone</span>
                        <span className="tp-profile-info-value">{formData.phone || 'Not set'}</span>
                      </div>
                    </div>

                    <div className="tp-profile-info-item tp-profile-info-item--full">
                      <div className="tp-profile-info-icon">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                      </div>
                      <div className="tp-profile-info-content">
                        <span className="tp-profile-info-label">Address</span>
                        <span className="tp-profile-info-value">
                          {formData.address?.street || formData.address?.city ? (
                            <>
                              {formData.address?.street && `${formData.address.street}, `}
                              {formData.address?.city && `${formData.address.city}, `}
                              {formData.address?.state && `${formData.address.state} `}
                              {formData.address?.zip || ''}
                            </>
                          ) : 'Not set'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Licenses Summary Card */}
                  {formData.licenses?.length > 0 && (
                    <div className="tp-licenses-card">
                      <div className="tp-licenses-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                        <span>Professional Licenses</span>
                      </div>
                      <div className="tp-licenses-card-body">
                        {formData.licenses.slice(0, 3).map((license, idx) => {
                          const status = license.licenseExpirationDate ? getExpirationStatus(license.licenseExpirationDate) : null;
                          return (
                            <div key={idx} className="tp-license-summary-item">
                              <span className="tp-license-type">{license.licenseType}</span>
                              <span className="tp-license-number">#{license.licenseNumber}</span>
                              {status && (
                                <span className={`tp-license-status tp-license-status--${status === 'Active' ? 'active' : status === 'Expiring Soon' ? 'warning' : 'expired'}`}>
                                  {status}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        {formData.licenses.length > 3 && (
                          <div className="tp-more-licenses">+{formData.licenses.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Tabbed Content Container */}
            <section className="tp-card tp-tabs-container">
              {/* Tab Navigation */}
              <div className="tp-tabs-nav">
                <div className="tp-tabs-list">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`tp-tab-btn ${activeTab === tab.id ? 'tp-tab-btn--active' : ''}`}
                      onClick={() => {
                        if (!isEditing) {
                          setActiveTab(tab.id);
                        }
                      }}
                      disabled={isEditing && activeTab !== tab.id}
                    >
                      {renderTabIcon(tab.icon)}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                {!isEditing && (
                  <button type="button" className="tp-btn-edit" onClick={startEditing}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="tp-tabs-content">
                {renderTabContent()}
              </div>
            </section>
          </div>
        </main>
      )}
    </div>
  );
};

export default TherapistProfile;
