import React from 'react';

/**
 * EducationEntry Component
 * Displays a single education entry or a form to add a new one
 * Reusable for both Therapist and Teacher profiles
 */
const EducationEntry = ({ 
  education, 
  index, 
  isNew = false,
  onChange,
  onRemove,
  onAdd,
  onFileUpload,
  uploading
}) => {
  
  if (isNew) {
    // NEW EDUCATION FORM
    return (
      <div className="tp-add-new-section">
        <h4 className="tp-add-new-title">Add New Education</h4>
        
        <div className="tp-form-row">
          <div className="tp-input-group">
            <label className="tp-label">Institution Name <span className="tp-required">*</span></label>
            <input
              type="text"
              className="tp-input"
              value={education.institution}
              onChange={(e) => onChange('institution', e.target.value)}
              placeholder="e.g., Harvard University"
            />
          </div>
          
          <div className="tp-input-group">
            <label className="tp-label">Degree Type <span className="tp-required">*</span></label>
            <select
              className="tp-input"
              value={education.degreeType}
              onChange={(e) => onChange('degreeType', e.target.value)}
            >
              <option value="">Select degree type</option>
              <option value="Bachelor's">Bachelor's</option>
              <option value="Master's">Master's</option>
              <option value="Doctorate">Doctorate</option>
              <option value="Professional Degree">Professional Degree</option>
            </select>
          </div>
        </div>

        <div className="tp-form-row">
          <div className="tp-input-group">
            <label className="tp-label">Field of Study <span className="tp-required">*</span></label>
            <input
              type="text"
              className="tp-input"
              value={education.fieldOfStudy}
              onChange={(e) => onChange('fieldOfStudy', e.target.value)}
              placeholder="e.g., Occupational Therapy"
            />
          </div>
          
          <div className="tp-input-group">
            <label className="tp-label">Graduation Year <span className="tp-required">*</span></label>
            <input
              type="number"
              className="tp-input"
              value={education.graduationYear}
              onChange={(e) => onChange('graduationYear', e.target.value)}
              min="1950"
              max="2100"
              placeholder="2020"
            />
          </div>
          
          <div className="tp-input-group">
            <label className="tp-label">GPA (Optional)</label>
            <input
              type="number"
              className="tp-input"
              value={education.gpa}
              onChange={(e) => onChange('gpa', e.target.value)}
              min="0"
              max="4"
              step="0.01"
              placeholder="3.50"
            />
          </div>
        </div>

        <div className="tp-upload-section">
          <label className="tp-label">Certificate/Diploma (Optional)</label>
          {education.certificateURL ? (
            <div className="tp-uploaded-file">
              <a href={education.certificateURL} target="_blank" rel="noopener noreferrer">
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
          <small className="tp-helper-text">
            Tip: Name your file like "Harvard_Masters_OT_2020.pdf" for auto-suggestions
          </small>
        </div>

        <button
          type="button"
          className="tp-add-btn"
          onClick={onAdd}
        >
          + Add Education
        </button>
      </div>
    );
  }

  // EXISTING EDUCATION ENTRY
  return (
    <div className="tp-entry-card">
      <div className="tp-entry-header">
        <h4 className="tp-entry-title">{education.degreeType} - {education.fieldOfStudy}</h4>
        <button
          type="button"
          className="tp-remove-btn"
          onClick={() => onRemove(index)}
        >
          Remove
        </button>
      </div>
      
      <div className="tp-entry-details">
        <p><strong>Institution:</strong> {education.institution}</p>
        <p><strong>Graduation Year:</strong> {education.graduationYear}</p>
        {education.gpa && <p><strong>GPA:</strong> {education.gpa}</p>}
        {education.certificateURL && (
          <a 
            href={education.certificateURL} 
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

export default EducationEntry;