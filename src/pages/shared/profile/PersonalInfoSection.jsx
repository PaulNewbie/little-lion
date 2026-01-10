import React from 'react';

/**
 * PersonalInfoSection Component
 * Personal information fields section
 * Reusable for Teacher and Therapist profiles
 */
const PersonalInfoSection = ({ 
  formData, 
  validationErrors,
  onInputChange,
  onNestedChange,
  readOnlyFields = ['firstName', 'middleName', 'lastName', 'email']
}) => {
  
  const isReadOnly = (field) => readOnlyFields.includes(field);
  
  return (
    <>
      {/* Name Fields - Read Only */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">First Name</label>
          <input
            type="text"
            className="tp-input tp-input-disabled"
            value={formData.firstName}
            disabled
          />
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">Middle Name</label>
          <input
            type="text"
            className="tp-input tp-input-disabled"
            value={formData.middleName}
            disabled
          />
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">Last Name</label>
          <input
            type="text"
            className="tp-input tp-input-disabled"
            value={formData.lastName}
            disabled
          />
        </div>
      </div>

      <p className="tp-helper-text">Your name is managed by the administrator</p>

      {/* Date of Birth & Gender */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">
            Date of Birth <span className="tp-required">*</span>
          </label>
          <input
            type="date"
            className={`tp-input ${validationErrors.dateOfBirth ? 'tp-input-error' : ''}`}
            value={formData.dateOfBirth}
            onChange={(e) => onInputChange('dateOfBirth', e.target.value)}
          />
          {validationErrors.dateOfBirth && (
            <span className="tp-error-text">{validationErrors.dateOfBirth}</span>
          )}
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">Gender</label>
          <select
            className="tp-input"
            value={formData.gender}
            onChange={(e) => onInputChange('gender', e.target.value)}
          >
            <option value="">Select gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Non-binary</option>
            <option value="Prefer not to say">Prefer not to say</option>
          </select>
        </div>
      </div>

      {/* Contact Information */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">
            Phone Number <span className="tp-required">*</span>
          </label>
          <input
            type="tel"
            className={`tp-input ${validationErrors.phone ? 'tp-input-error' : ''}`}
            value={formData.phone}
            onChange={(e) => onInputChange('phone', e.target.value)}
            placeholder="123-456-7890"
          />
          {validationErrors.phone && (
            <span className="tp-error-text">{validationErrors.phone}</span>
          )}
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">Email Address</label>
          <input
            type="email"
            className="tp-input tp-input-disabled"
            value={formData.email}
            disabled
          />
        </div>
      </div>

      {/* Address */}
      <div className="tp-input-group">
        <label className="tp-label">Street Address</label>
        <input
          type="text"
          className="tp-input"
          value={formData.address.street}
          onChange={(e) => onNestedChange('address', 'street', e.target.value)}
          placeholder="123 Main St"
        />
      </div>

      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">City</label>
          <input
            type="text"
            className="tp-input"
            value={formData.address.city}
            onChange={(e) => onNestedChange('address', 'city', e.target.value)}
          />
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">State</label>
          <input
            type="text"
            className="tp-input"
            value={formData.address.state}
            onChange={(e) => onNestedChange('address', 'state', e.target.value)}
          />
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">ZIP Code</label>
          <input
            type="text"
            className="tp-input"
            value={formData.address.zip}
            onChange={(e) => onNestedChange('address', 'zip', e.target.value)}
            placeholder="12345"
          />
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="tp-form-row">
        <div className="tp-input-group">
          <label className="tp-label">Emergency Contact Name</label>
          <input
            type="text"
            className="tp-input"
            value={formData.emergencyContact.name}
            onChange={(e) => onNestedChange('emergencyContact', 'name', e.target.value)}
          />
        </div>
        
        <div className="tp-input-group">
          <label className="tp-label">Emergency Contact Phone</label>
          <input
            type="tel"
            className="tp-input"
            value={formData.emergencyContact.phone}
            onChange={(e) => onNestedChange('emergencyContact', 'phone', e.target.value)}
            placeholder="123-456-7890"
          />
        </div>
      </div>
    </>
  );
};

export default PersonalInfoSection;