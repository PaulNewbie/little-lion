import React from 'react';

/**
 * TeacherCredentialsSection Component
 * Teaching license, PRC ID, and certification fields
 * Note: Specializations are managed by admin from the dashboard
 */
const TeacherCredentialsSection = ({
  formData,
  validationErrors,
  licenseStatus,
  onInputChange
}) => {
  
  return (
    <>
      <p className="tp-section-description">
        Professional teaching license and credentials
      </p>

      {/* Teaching License & PRC ID */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">
            Teaching License Number <span className="tp-required">*</span>
          </label>
          <input
            type="text"
            className={`tp-input ${validationErrors.teachingLicense ? 'tp-input-error' : ''}`}
            value={formData.teachingLicense}
            onChange={(e) => onInputChange('teachingLicense', e.target.value)}
            placeholder="e.g., TL-123456"
          />
          {validationErrors.teachingLicense && (
            <span className="tp-error-text">{validationErrors.teachingLicense}</span>
          )}
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">PRC ID Number</label>
          <input
            type="text"
            className="tp-input"
            value={formData.prcIdNumber}
            onChange={(e) => onInputChange('prcIdNumber', e.target.value)}
            placeholder="e.g., 1234567"
          />
        </div>
      </div>

      {/* Certification Level & License State */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">
            Certification Level <span className="tp-required">*</span>
          </label>
          <select
            className={`tp-input ${validationErrors.certificationLevel ? 'tp-input-error' : ''}`}
            value={formData.certificationLevel}
            onChange={(e) => onInputChange('certificationLevel', e.target.value)}
          >
            <option value="">Select certification level</option>
            <option value="Initial">Initial</option>
            <option value="Professional">Professional</option>
            <option value="Master Teacher">Master Teacher</option>
            <option value="Provisional">Provisional</option>
          </select>
          {validationErrors.certificationLevel && (
            <span className="tp-error-text">{validationErrors.certificationLevel}</span>
          )}
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">License State/Region</label>
          <input
            type="text"
            className="tp-input"
            value={formData.licenseState}
            onChange={(e) => onInputChange('licenseState', e.target.value)}
            placeholder="e.g., Philippines"
          />
        </div>
      </div>

      {/* License Dates */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">License Issue Date</label>
          <input
            type="date"
            className="tp-input"
            value={formData.licenseIssueDate}
            onChange={(e) => onInputChange('licenseIssueDate', e.target.value)}
          />
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">License Expiration Date</label>
          <input
            type="date"
            className="tp-input"
            value={formData.licenseExpirationDate}
            onChange={(e) => onInputChange('licenseExpirationDate', e.target.value)}
          />
          {licenseStatus === 'Expiring Soon' && (
            <span className="tp-warning-text">⚠️ License expires soon. Please renew.</span>
          )}
          {licenseStatus === 'Expired' && (
            <span className="tp-error-text">❌ License expired. Please renew immediately.</span>
          )}
        </div>
      </div>

      {/* Experience & Employment */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">Years of Teaching Experience</label>
          <input
            type="number"
            className="tp-input"
            value={formData.yearsExperience}
            onChange={(e) => onInputChange('yearsExperience', parseInt(e.target.value))}
            min="0"
          />
        </div>

        <div className="tp-input-group">
          <label className="tp-label">Employment Status</label>
          <select
            className="tp-input"
            value={formData.employmentStatus}
            onChange={(e) => onInputChange('employmentStatus', e.target.value)}
          >
            <option value="">Select status</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Substitute">Substitute</option>
          </select>
        </div>
      </div>
    </>
  );
};

export default TeacherCredentialsSection;