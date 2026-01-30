import React from 'react';
import { getExpirationStatus, formatDate } from '../../../utils/profileHelpers';

/**
 * CertificationEntry Component
 * Displays a single certification entry or a form to add a new one
 * Reusable for both Therapist and Teacher profiles
 */
const CertificationEntry = ({ 
  certification, 
  index, 
  isNew = false,
  onChange,
  onRemove,
  onAdd,
  onFileUpload,
  uploading
}) => {
  
  if (isNew) {
    // NEW CERTIFICATION FORM
    return (
      <div className="tp-add-new-section">
        <h4 className="tp-add-new-title">Add New Certification</h4>
        
        <div className="tp-form-row">
          <div className="tp-input-group">
            <label className="tp-label">Certification Name</label>
            <input
              type="text"
              className="tp-input"
              value={certification.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="e.g., Board Certified Behavior Analyst"
            />
          </div>
          
          <div className="tp-input-group">
            <label className="tp-label">Issuing Organization</label>
            <input
              type="text"
              className="tp-input"
              value={certification.issuingOrg}
              onChange={(e) => onChange('issuingOrg', e.target.value)}
              placeholder="e.g., BACB, ASHA"
            />
          </div>
        </div>

        <div className="tp-form-row">
          <div className="tp-input-group">
            <label className="tp-label">Certification Number</label>
            <input
              type="text"
              className="tp-input"
              value={certification.certNumber}
              onChange={(e) => onChange('certNumber', e.target.value)}
              placeholder="e.g., 1-23-45678"
            />
          </div>
          
          <div className="tp-input-group">
            <label className="tp-label">Issue Date</label>
            <input
              type="date"
              className="tp-input"
              value={certification.issueDate}
              onChange={(e) => onChange('issueDate', e.target.value)}
            />
          </div>
          
          <div className="tp-input-group">
            <label className="tp-label">Expiration Date (if applicable)</label>
            <input
              type="date"
              className="tp-input"
              value={certification.expirationDate}
              onChange={(e) => onChange('expirationDate', e.target.value)}
            />
          </div>
        </div>

        <div className="tp-form-row">
          <div className="tp-input-group">
            <label className="tp-label">CEUs Completed (Optional)</label>
            <input
              type="number"
              className="tp-input"
              value={certification.ceusCompleted}
              onChange={(e) => onChange('ceusCompleted', e.target.value)}
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        <div className="tp-upload-section">
          <label className="tp-label">Certificate (Optional)</label>
          {certification.certificateURL ? (
            <div className="tp-uploaded-file">
              <a href={certification.certificateURL} target="_blank" rel="noopener noreferrer">
                📄 Certificate Uploaded
              </a>
              <button
                type="button"
                className="tp-remove-file-btn"
                onClick={() => onChange('certificateURL', '')}
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="tp-upload-btn-secondary">
              {uploading ? 'Uploading...' : '📎 Upload Certificate'}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={onFileUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          )}
        </div>

        <button
          type="button"
          className="tp-add-btn"
          onClick={onAdd}
        >
          + Add Certification
        </button>
      </div>
    );
  }

  // EXISTING CERTIFICATION ENTRY
  const status = getExpirationStatus(certification.expirationDate);
  
  return (
    <div className="tp-entry-card">
      <div className="tp-entry-header">
        <h4 className="tp-entry-title">{certification.name}</h4>
        <div className="tp-entry-actions">
          <span className={`tp-status-badge ${status === 'Active' ? 'tp-status-active' : status === 'Expiring Soon' ? 'tp-status-warning' : 'tp-status-expired'}`}>
            {status}
          </span>
          <button
            type="button"
            className="tp-remove-btn"
            onClick={() => onRemove(index)}
          >
            Remove
          </button>
        </div>
      </div>
      
      <div className="tp-entry-details">
        {certification.issuingOrg && <p><strong>Issuing Organization:</strong> {certification.issuingOrg}</p>}
        {certification.certNumber && <p><strong>Certification Number:</strong> {certification.certNumber}</p>}
        {certification.issueDate && <p><strong>Issue Date:</strong> {formatDate(certification.issueDate)}</p>}
        {certification.expirationDate && (
          <p><strong>Expiration Date:</strong> {formatDate(certification.expirationDate)}</p>
        )}
        {certification.ceusCompleted && <p><strong>CEUs Completed:</strong> {certification.ceusCompleted}</p>}
        {certification.certificateURL && (
          <a 
            href={certification.certificateURL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="tp-certificate-link"
          >
            📄 View Certificate
          </a>
        )}
      </div>
    </div>
  );
};

export default CertificationEntry;