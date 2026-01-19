// src/components/staffCredentials/StaffCredentialsModal.jsx
// Modal to display staff credentials (licenses, education, certifications)

import React from 'react';
import './StaffCredentialsModal.css';

/**
 * StaffCredentialsModal - Display detailed staff credentials
 *
 * @param {Object} staff - Staff member object with credentials
 * @param {boolean} isOpen - Modal visibility
 * @param {Function} onClose - Close handler
 *
 * Usage:
 * <StaffCredentialsModal
 *   staff={staffMember}
 *   isOpen={true}
 *   onClose={() => setOpen(false)}
 * />
 */
const StaffCredentialsModal = ({ staff, isOpen, onClose }) => {
  if (!isOpen || !staff) return null;

  const {
    firstName = '',
    lastName = '',
    middleName = '',
    profilePhoto = '',
    role = '',
    // License info - handle both single license (teacher) and array (therapist)
    licenses = [],
    licenseType = '',
    licenseNumber = '',
    licenseExpirationDate = '',
    // Professional info
    educationHistory = [],
    certifications = [],
    yearsExperience = 0,
    specializations = []
  } = staff;

  const fullName = `${firstName} ${middleName} ${lastName}`.trim();
  const roleDisplay = role === 'therapist' ? 'Therapist' : 'Teacher';

  // Consolidate licenses - therapists have licenses[], teachers have single license fields
  const allLicenses = licenses.length > 0
    ? licenses
    : (licenseType && licenseNumber)
      ? [{ licenseType, licenseNumber, licenseExpirationDate }]
      : [];

  // Get expiration status
  const getExpirationStatus = (expirationDate) => {
    if (!expirationDate) return null;

    const today = new Date();
    const expDate = new Date(expirationDate);
    const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiration < 0) {
      return { status: 'expired', color: 'var(--tp-danger)', label: 'Expired' };
    } else if (daysUntilExpiration <= 30) {
      return { status: 'expiring-soon', color: 'var(--tp-warning)', label: 'Expiring Soon' };
    }
    return { status: 'valid', color: 'var(--tp-success)', label: 'Valid' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="scm-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="staff-modal-title">
      <div className="scm-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="scm-header">
          <div className="scm-header-content">
            <h2 id="staff-modal-title" className="scm-title">Professional Credentials</h2>
            <p className="scm-subtitle">Viewing {roleDisplay.toLowerCase()} credentials</p>
          </div>
          <button
            className="scm-close"
            onClick={onClose}
            aria-label="Close credentials modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="scm-body">
          {/* Staff Info */}
          <div className="scm-staff-info">
            <div className="scm-photo-container">
              {profilePhoto ? (
                <img src={profilePhoto} alt={fullName} className="scm-photo" />
              ) : (
                <div className="scm-photo-placeholder">
                  {firstName?.[0]}{lastName?.[0]}
                </div>
              )}
            </div>
            <div className="scm-staff-meta">
              <h3 className="scm-staff-name">{fullName}</h3>
              <p className="scm-staff-role">{roleDisplay}</p>
              {yearsExperience > 0 && (
                <div className="scm-experience-badge">
                  <span className="scm-experience-number">{yearsExperience}</span>
                  <span className="scm-experience-label">Years Exp.</span>
                </div>
              )}
            </div>
          </div>

          {/* Specializations */}
          {specializations.length > 0 && (
            <div className="scm-section">
              <h4 className="scm-section-title">Specializations</h4>
              <div className="scm-tags">
                {specializations.map((spec, idx) => (
                  <span key={idx} className="scm-tag">{spec}</span>
                ))}
              </div>
            </div>
          )}

          {/* Licenses */}
          {allLicenses.length > 0 && (
            <div className="scm-section">
              <h4 className="scm-section-title">Professional Licenses</h4>
              <div className="scm-licenses-list">
                {allLicenses.map((license, idx) => {
                  const expStatus = getExpirationStatus(license.licenseExpirationDate);
                  return (
                    <div key={idx} className="scm-license-card">
                      <div className="scm-license-header">
                        <span className="scm-license-type">{license.licenseType || 'N/A'}</span>
                        {expStatus && (
                          <span
                            className="scm-license-status"
                            style={{ color: expStatus.color }}
                          >
                            {expStatus.label}
                          </span>
                        )}
                      </div>
                      <div className="scm-license-details">
                        <span><strong>License #:</strong> {license.licenseNumber || 'N/A'}</span>
                        <span><strong>Expires:</strong> {formatDate(license.licenseExpirationDate)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Education History */}
          {educationHistory.length > 0 && (
            <div className="scm-section">
              <h4 className="scm-section-title">Education History</h4>
              <div className="scm-cards">
                {educationHistory.map((edu, idx) => (
                  <div key={idx} className="scm-card">
                    {edu.certificateUrl && (
                      <a
                        href={edu.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="scm-card-image"
                        aria-label={`View ${edu.degree} certificate`}
                      >
                        <img src={edu.certificateUrl} alt={`${edu.degree} certificate`} />
                      </a>
                    )}
                    <div className="scm-card-content">
                      <h5 className="scm-card-title">{edu.degree || 'N/A'}</h5>
                      <p className="scm-card-text">{edu.institution || 'N/A'}</p>
                      <p className="scm-card-meta">{edu.graduationYear || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="scm-section">
              <h4 className="scm-section-title">Professional Certifications</h4>
              <div className="scm-cards">
                {certifications.map((cert, idx) => (
                  <div key={idx} className="scm-card">
                    {cert.certificateUrl && (
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="scm-card-image"
                        aria-label={`View ${cert.name} certificate`}
                      >
                        <img src={cert.certificateUrl} alt={`${cert.name} certificate`} />
                      </a>
                    )}
                    <div className="scm-card-content">
                      <h5 className="scm-card-title">{cert.name || 'N/A'}</h5>
                      <p className="scm-card-text">{cert.issuingOrganization || 'N/A'}</p>
                      {cert.issueDate && (
                        <p className="scm-card-meta">Issued: {formatDate(cert.issueDate)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {allLicenses.length === 0 && educationHistory.length === 0 && certifications.length === 0 && (
            <div className="scm-empty">
              <p>No credentials available for this staff member.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="scm-footer">
          <button className="scm-btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default StaffCredentialsModal;
