import React from 'react';
import { getExpirationStatus } from '../../../utils/profileHelpers';

/**
 * TherapistCredentialsSection Component
 * Supports multiple licenses for therapists
 * Note: Specializations are managed by admin from the dashboard
 */
const TherapistCredentialsSection = ({
  formData,
  validationErrors,
  newLicense,
  onInputChange,
  onNewLicenseChange,
  onAddLicense,
  onRemoveLicense
}) => {

  return (
    <>
      <p className="tp-section-description">
        Professional licenses and clinical credentials
      </p>

      {/* Existing Licenses List */}
      {formData.licenses?.length > 0 && (
        <div className="tp-licenses-list">
          <label className="tp-label">Your Licenses</label>
          {formData.licenses.map((license, index) => {
            const licenseStatus = license.licenseExpirationDate
              ? getExpirationStatus(license.licenseExpirationDate)
              : null;

            return (
              <div key={license.id || index} className="tp-license-card">
                <div className="tp-license-card__header">
                  <span className="tp-license-card__type">{license.licenseType}</span>
                  <button
                    type="button"
                    className="tp-btn tp-btn--icon tp-btn--danger"
                    onClick={() => onRemoveLicense(index)}
                    title="Remove license"
                  >
                    &times;
                  </button>
                </div>
                <div className="tp-license-card__details">
                  <span><strong>License #:</strong> {license.licenseNumber}</span>
                  {license.licenseState && (
                    <span><strong>State/Region:</strong> {license.licenseState}</span>
                  )}
                  {license.licenseIssueDate && (
                    <span><strong>Issued:</strong> {license.licenseIssueDate}</span>
                  )}
                  {license.licenseExpirationDate && (
                    <span>
                      <strong>Expires:</strong> {license.licenseExpirationDate}
                      {licenseStatus === 'Expiring Soon' && (
                        <span className="tp-warning-badge"> (Expiring Soon)</span>
                      )}
                      {licenseStatus === 'Expired' && (
                        <span className="tp-error-badge"> (Expired)</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add New License Form */}
      <div className="tp-add-license-section">
        <label className="tp-label">
          {formData.licenses?.length > 0 ? 'Add Another License' : 'Add License'} <span className="tp-required">*</span>
        </label>

        {/* License Type & License Number */}
        <div className="tp-form-row">
          <div className="tp-input-group">
            <label className="tp-label tp-label--small">License Type</label>
            <select
              className={`tp-input ${validationErrors.licenses ? 'tp-input-error' : ''}`}
              value={newLicense.licenseType}
              onChange={(e) => onNewLicenseChange('licenseType', e.target.value)}
            >
              <option value="">Select license type</option>
              <option value="BCBA">BCBA (Board Certified Behavior Analyst)</option>
              <option value="BCaBA">BCaBA (Board Certified Assistant Behavior Analyst)</option>
              <option value="RBT">RBT (Registered Behavior Technician)</option>
              <option value="SLP">SLP (Speech-Language Pathologist)</option>
              <option value="OT">OT (Occupational Therapist)</option>
              <option value="PT">PT (Physical Therapist)</option>
              <option value="LMFT">LMFT (Licensed Marriage & Family Therapist)</option>
              <option value="LPCC">LPCC (Licensed Professional Clinical Counselor)</option>
              <option value="SPED">SPED (Special Education Teacher)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="tp-input-group">
            <label className="tp-label tp-label--small">License Number</label>
            <input
              type="text"
              className="tp-input"
              value={newLicense.licenseNumber}
              onChange={(e) => onNewLicenseChange('licenseNumber', e.target.value)}
              placeholder="e.g., 1-23-45678"
            />
          </div>
        </div>

        {/* License State & Issue Date */}
        <div className="tp-form-row">
          <div className="tp-input-group">
            <label className="tp-label tp-label--small">State/Region</label>
            <input
              type="text"
              className="tp-input"
              value={newLicense.licenseState}
              onChange={(e) => onNewLicenseChange('licenseState', e.target.value)}
              placeholder="e.g., California, Philippines"
            />
          </div>

          <div className="tp-input-group">
            <label className="tp-label tp-label--small">Issue Date</label>
            <input
              type="date"
              className="tp-input"
              value={newLicense.licenseIssueDate}
              onChange={(e) => onNewLicenseChange('licenseIssueDate', e.target.value)}
            />
          </div>
        </div>

        {/* Expiration Date & Add Button */}
        <div className="tp-form-row">
          <div className="tp-input-group">
            <label className="tp-label tp-label--small">Expiration Date</label>
            <input
              type="date"
              className="tp-input"
              value={newLicense.licenseExpirationDate}
              onChange={(e) => onNewLicenseChange('licenseExpirationDate', e.target.value)}
            />
          </div>

          <div className="tp-input-group tp-input-group--button">
            <button
              type="button"
              className="tp-btn tp-btn--secondary"
              onClick={onAddLicense}
            >
              + Add License
            </button>
          </div>
        </div>

        {validationErrors.licenses && (
          <span className="tp-error-text">{validationErrors.licenses}</span>
        )}
      </div>

      {/* Years Experience & Employment Status */}
      <div className="tp-form-row" style={{ marginTop: '24px' }}>
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
      </div>
    </>
  );
};

export default TherapistCredentialsSection;
