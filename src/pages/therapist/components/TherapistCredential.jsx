import React from 'react';

/**
 * TherapistCredentialsSection Component
 * Therapist license, credentials, and specializations
 */
const TherapistCredentialsSection = ({ 
  formData, 
  validationErrors,
  licenseStatus,
  onInputChange,
  onSpecializationToggle
}) => {
  
  const THERAPIST_SPECIALIZATIONS = [
    'Applied Behavior Analysis (ABA)',
    'Speech-Language Pathology',
    'Occupational Therapy',
    'Physical Therapy',
    'Feeding Therapy',
    'Sensory Integration',
    'Early Intervention (0-3 years)',
    'Autism Spectrum Disorders',
    'ADHD',
    'Learning Disabilities',
    'Developmental Delays',
    'Behavioral Disorders',
    'Social Skills Training',
    'Parent Training & Coaching',
    'Augmentative & Alternative Communication (AAC)',
    'Motor Skills Development'
  ];
  
  return (
    <>
      <p className="tp-section-description">
        Professional license and clinical credentials
      </p>

      {/* License Type & License Number */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">
            License Type <span className="tp-required">*</span>
          </label>
          <select
            className={`tp-input ${validationErrors.licenseType ? 'tp-input-error' : ''}`}
            value={formData.licenseType}
            onChange={(e) => onInputChange('licenseType', e.target.value)}
          >
            <option value="">Select license type</option>
            <option value="BCBA">BCBA (Board Certified Behavior Analyst)</option>
            <option value="BCaBA">BCaBA (Board Certified Assistant Behavior Analyst)</option>
            <option value="SLP">SLP (Speech-Language Pathologist)</option>
            <option value="OT">OT (Occupational Therapist)</option>
            <option value="PT">PT (Physical Therapist)</option>
            <option value="LMFT">LMFT (Licensed Marriage & Family Therapist)</option>
            <option value="LPCC">LPCC (Licensed Professional Clinical Counselor)</option>
            <option value="Other">Other</option>
          </select>
          {validationErrors.licenseType && (
            <span className="tp-error-text">{validationErrors.licenseType}</span>
          )}
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">
            License Number <span className="tp-required">*</span>
          </label>
          <input
            type="text"
            className={`tp-input ${validationErrors.licenseNumber ? 'tp-input-error' : ''}`}
            value={formData.licenseNumber}
            onChange={(e) => onInputChange('licenseNumber', e.target.value)}
            placeholder="e.g., 1-23-45678"
          />
          {validationErrors.licenseNumber && (
            <span className="tp-error-text">{validationErrors.licenseNumber}</span>
          )}
        </div>
      </div>

      {/* License State & Issue Date */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">License State/Region</label>
          <input
            type="text"
            className="tp-input"
            value={formData.licenseState}
            onChange={(e) => onInputChange('licenseState', e.target.value)}
            placeholder="e.g., California, Philippines"
          />
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">License Issue Date</label>
          <input
            type="date"
            className="tp-input"
            value={formData.licenseIssueDate}
            onChange={(e) => onInputChange('licenseIssueDate', e.target.value)}
          />
        </div>
      </div>

      {/* License Expiration & Years Experience */}
      <div className="tp-form-row">
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
        
        <div className="tp-input-group">
          <label className="tp-label">Years of Clinical Experience</label>
          <input
            type="number"
            className="tp-input"
            value={formData.yearsExperience}
            onChange={(e) => onInputChange('yearsExperience', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
      </div>

      {/* Employment Status */}
      <div className="tp-form-row">
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
            <option value="Per Diem">Per Diem</option>
          </select>
        </div>
        
        <div className="tp-input-group">
          {/* Empty for spacing */}
        </div>
      </div>

      {/* Clinical Specializations */}
      <div className="tp-input-group">
        <label className="tp-label">Clinical Specializations</label>
        <p className="tp-helper-text">Select all areas of expertise</p>
        <div className="tp-checkbox-grid">
          {THERAPIST_SPECIALIZATIONS.map(spec => (
            <label key={spec} className="tp-checkbox-label">
              <input
                type="checkbox"
                checked={formData.specializations.includes(spec)}
                onChange={() => onSpecializationToggle(spec)}
              />
              <span>{spec}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  );
};

export default TherapistCredentialsSection;