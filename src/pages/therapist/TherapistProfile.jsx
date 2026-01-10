import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import userService from '../../services/userService';
import cloudinaryService from '../../services/cloudinaryService';
import Loading from '../../components/common/Loading';
import TherapistSidebar from '../../components/sidebar/TherapistSidebar';

// Import small components
import EducationEntry from './components/EducationEntry';
import CertificationEntry from './components/CertificationEntry';

// Import utilities
import { validateProfile } from '../../utils/validation';
import { 
  parseFileName, 
  getExpirationStatus,
  validateFileSize,
  validateFileType,
  checkProfileCompleteness
} from '../../utils/profileHelpers';

import './css/TherapistProfile.css';

const TherapistProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  
  // Section collapse states
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    credentials: true,
    education: true,
    certifications: true
  });

  const [formData, setFormData] = useState({
    profilePhoto: '',
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    email: '',
    address: { street: '', city: '', state: '', zip: '' },
    emergencyContact: { name: '', phone: '' },
    licenseType: '',
    licenseNumber: '',
    licenseState: '',
    licenseIssueDate: '',
    licenseExpirationDate: '',
    yearsExperience: 0,
    specializations: [],
    employmentStatus: '',
    educationHistory: [],
    certifications: []
  });

  // Temporary inputs for adding new items
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degreeType: '',
    fieldOfStudy: '',
    graduationYear: '',
    gpa: '',
    certificateURL: ''
  });

  const [newCertification, setNewCertification] = useState({
    name: '',
    issuingOrg: '',
    certNumber: '',
    issueDate: '',
    expirationDate: '',
    certificateURL: '',
    ceusCompleted: ''
  });

  // ============================================================================
  // LOAD PROFILE DATA
  // ============================================================================
  
  useEffect(() => {
    const loadProfile = async () => {
      if (currentUser?.uid) {
        try {
          const userData = await userService.getUserById(currentUser.uid);
          
          setFormData({
            profilePhoto: userData.profilePhoto || '',
            firstName: userData.firstName || '',
            middleName: userData.middleName || '',
            lastName: userData.lastName || '',
            dateOfBirth: userData.dateOfBirth || '',
            gender: userData.gender || '',
            phone: userData.phone || '',
            email: userData.email || '',
            address: userData.address || { street: '', city: '', state: '', zip: '' },
            emergencyContact: userData.emergencyContact || { name: '', phone: '' },
            licenseType: userData.licenseType || '',
            licenseNumber: userData.licenseNumber || '',
            licenseState: userData.licenseState || '',
            licenseIssueDate: userData.licenseIssueDate || '',
            licenseExpirationDate: userData.licenseExpirationDate || '',
            yearsExperience: userData.yearsExperience || 0,
            specializations: userData.specializations || [],
            employmentStatus: userData.employmentStatus || '',
            educationHistory: userData.educationHistory || [],
            certifications: userData.certifications || []
          });
        } catch (error) {
          console.error("Error loading profile:", error);
          alert("Failed to load profile data. Please refresh the page.");
        } finally {
          setLoading(false);
        }
      }
    };
    loadProfile();
  }, [currentUser]);

  // ============================================================================
  // FORM HANDLERS
  // ============================================================================
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleSpecializationToggle = (specialization) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // ============================================================================
  // FILE UPLOAD HANDLERS
  // ============================================================================
  
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const sizeCheck = validateFileSize(file, 5);
    if (!sizeCheck.isValid) {
      alert(sizeCheck.error);
      return;
    }

    const typeCheck = validateFileType(file, ['image/jpeg', 'image/png']);
    if (!typeCheck.isValid) {
      alert(typeCheck.error);
      return;
    }

    setUploadingFile('profile-photo');
    try {
      const url = await cloudinaryService.uploadImage(file, 'therapist-profiles');
      handleInputChange('profilePhoto', url);
      alert('Profile photo uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleEducationCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeCheck = validateFileSize(file, 5);
    if (!sizeCheck.isValid) {
      alert(sizeCheck.error);
      return;
    }

    setUploadingFile('new-education-cert');
    
    try {
      const url = await cloudinaryService.uploadImage(file, 'therapist-credentials/education');
      const parsed = parseFileName(file.name);
      
      setNewEducation(prev => ({
        ...prev,
        certificateURL: url,
        // Auto-suggest values if fields are empty
        institution: prev.institution || parsed.suggestedInstitution,
        graduationYear: prev.graduationYear || parsed.suggestedYear,
        degreeType: prev.degreeType || parsed.suggestedDegree
      }));
      
      alert('Certificate uploaded successfully! Check the auto-filled fields.');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload certificate. Please try again.');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleCertificationCertificateUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const sizeCheck = validateFileSize(file, 5);
    if (!sizeCheck.isValid) {
      alert(sizeCheck.error);
      return;
    }

    setUploadingFile('new-cert-cert');
    
    try {
      const url = await cloudinaryService.uploadImage(file, 'therapist-credentials/certifications');
      setNewCertification(prev => ({ ...prev, certificateURL: url }));
      alert('Certificate uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload certificate. Please try again.');
    } finally {
      setUploadingFile(null);
    }
  };

  // ============================================================================
  // EDUCATION HANDLERS
  // ============================================================================
  
  const handleNewEducationChange = (field, value) => {
    setNewEducation(prev => ({ ...prev, [field]: value }));
  };

  const handleAddEducation = () => {
    if (!newEducation.institution || !newEducation.degreeType || !newEducation.fieldOfStudy || !newEducation.graduationYear) {
      alert('Please fill in all required education fields (Institution, Degree Type, Field of Study, Graduation Year).');
      return;
    }

    const educationEntry = {
      id: Date.now().toString(),
      institution: newEducation.institution,
      degreeType: newEducation.degreeType,
      fieldOfStudy: newEducation.fieldOfStudy,
      graduationYear: parseInt(newEducation.graduationYear),
      gpa: newEducation.gpa ? parseFloat(newEducation.gpa) : null,
      certificateURL: newEducation.certificateURL
    };

    setFormData(prev => ({
      ...prev,
      educationHistory: [...prev.educationHistory, educationEntry]
    }));

    // Reset form
    setNewEducation({
      institution: '',
      degreeType: '',
      fieldOfStudy: '',
      graduationYear: '',
      gpa: '',
      certificateURL: ''
    });
  };

  const handleRemoveEducation = (index) => {
    if (window.confirm('Are you sure you want to remove this education entry?')) {
      setFormData(prev => ({
        ...prev,
        educationHistory: prev.educationHistory.filter((_, i) => i !== index)
      }));
    }
  };

  // ============================================================================
  // CERTIFICATION HANDLERS
  // ============================================================================
  
  const handleNewCertificationChange = (field, value) => {
    setNewCertification(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCertification = () => {
    if (!newCertification.name || !newCertification.issuingOrg || !newCertification.issueDate) {
      alert('Please fill in all required certification fields (Name, Issuing Organization, Issue Date).');
      return;
    }

    const certEntry = {
      id: Date.now().toString(),
      name: newCertification.name,
      issuingOrg: newCertification.issuingOrg,
      certNumber: newCertification.certNumber,
      issueDate: newCertification.issueDate,
      expirationDate: newCertification.expirationDate,
      certificateURL: newCertification.certificateURL,
      ceusCompleted: newCertification.ceusCompleted ? parseInt(newCertification.ceusCompleted) : null
    };

    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, certEntry]
    }));

    // Reset form
    setNewCertification({
      name: '',
      issuingOrg: '',
      certNumber: '',
      issueDate: '',
      expirationDate: '',
      certificateURL: '',
      ceusCompleted: ''
    });
  };

  const handleRemoveCertification = (index) => {
    if (window.confirm('Are you sure you want to remove this certification?')) {
      setFormData(prev => ({
        ...prev,
        certifications: prev.certifications.filter((_, i) => i !== index)
      }));
    }
  };

  // ============================================================================
  // SAVE PROFILE
  // ============================================================================
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Validate profile using validation.js
    const { isValid, errors, warnings } = validateProfile(formData, 'therapist');
    
    if (!isValid) {
      setValidationErrors(errors);
      alert(`Please fix the following errors:\n${Object.values(errors).join('\n')}`);
      
      // Auto-expand first section with errors
      const errorFields = Object.keys(errors);
      if (errorFields.some(f => ['firstName', 'lastName', 'phone'].includes(f))) {
        setExpandedSections(prev => ({ ...prev, personal: true }));
      } else if (errorFields.some(f => ['licenseType', 'licenseNumber'].includes(f))) {
        setExpandedSections(prev => ({ ...prev, credentials: true }));
      }
      
      return;
    }

    // Show warnings (optional)
    if (Object.keys(warnings).length > 0) {
      console.log('Profile warnings:', warnings);
    }

    setSaving(true);
    try {
      await userService.updateUser(currentUser.uid, {
        ...formData,
        profileCompleted: true,
        updatedAt: new Date().toISOString()
      });

      alert('Profile updated successfully!');
      navigate('/therapist/dashboard');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (loading) return <Loading />;

  const licenseStatus = getExpirationStatus(formData.licenseExpirationDate);
  const profileCompletion = checkProfileCompleteness(formData, 'therapist');

  return (
    <div className="therapist-profile-container">
      <TherapistSidebar />
      
      <div className="therapist-profile-main">
        {/* Header */}
        <div className="tp-header">
          <button 
            className="tp-back-btn"
            onClick={() => navigate('/therapist/dashboard')}
          >
            ← Back to Dashboard
          </button>
          
          <div className="tp-header-content">
            <h1 className="tp-title">Edit Profile</h1>
            <p className="tp-subtitle">
              Manage your professional information and credentials ({profileCompletion.completionPercentage}% complete)
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="tp-form">
          
          {/* Profile Photo Section */}
          <div className="tp-profile-header">
            <div className="tp-avatar">
              {formData.profilePhoto ? (
                <img src={formData.profilePhoto} alt="Profile" className="tp-avatar-img" />
              ) : (
                <div className="tp-avatar-placeholder">👤</div>
              )}
            </div>
            
            <div className="tp-profile-info">
              <h2 className="tp-name">
                {formData.firstName || formData.lastName 
                  ? `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim()
                  : 'Therapist Name'}
              </h2>
              <p className="tp-role">{formData.licenseType || 'License Type'}</p>
              
              <label className="tp-upload-btn">
                {uploadingFile === 'profile-photo' ? 'Uploading...' : 'Change Photo'}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  disabled={uploadingFile === 'profile-photo'}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* SECTION 1: Personal Information */}
          <div className="tp-section">
            <div 
              className="tp-section-header"
              onClick={() => toggleSection('personal')}
            >
              <h3 className="tp-section-title">1. Personal Information</h3>
              <span className="tp-section-toggle">
                {expandedSections.personal ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.personal && (
              <div className="tp-section-content">
                <div className="tp-form-row">
                  <div className="tp-input-group">
                    <label className="tp-label">
                      First Name <span className="tp-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`tp-input ${validationErrors.firstName ? 'tp-input-error' : ''}`}
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      required
                    />
                    {validationErrors.firstName && (
                      <small className="tp-error-text">{validationErrors.firstName}</small>
                    )}
                  </div>
                  
                  <div className="tp-input-group">
                    <label className="tp-label">Middle Name</label>
                    <input
                      type="text"
                      className="tp-input"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                      placeholder="Enter middle name"
                    />
                  </div>
                  
                  <div className="tp-input-group">
                    <label className="tp-label">
                      Last Name <span className="tp-required">*</span>
                    </label>
                    <input
                      type="text"
                      className={`tp-input ${validationErrors.lastName ? 'tp-input-error' : ''}`}
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      required
                    />
                    {validationErrors.lastName && (
                      <small className="tp-error-text">{validationErrors.lastName}</small>
                    )}
                  </div>
                </div>

                <div className="tp-form-row">
                  <div className="tp-input-group">
                    <label className="tp-label">Date of Birth</label>
                    <input
                      type="date"
                      className="tp-input"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    />
                  </div>
                  
                  <div className="tp-input-group">
                    <label className="tp-label">Gender</label>
                    <select
                      className="tp-input"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  
                  <div className="tp-input-group">
                    <label className="tp-label">Phone Number</label>
                    <input
                      type="tel"
                      className={`tp-input ${validationErrors.phone ? 'tp-input-error' : ''}`}
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="(123) 456-7890"
                    />
                    {validationErrors.phone && (
                      <small className="tp-error-text">{validationErrors.phone}</small>
                    )}
                  </div>
                </div>

                <div className="tp-form-row">
                  <div className="tp-input-group tp-full-width">
                    <label className="tp-label">Email Address</label>
                    <input
                      type="email"
                      className="tp-input tp-disabled"
                      value={formData.email}
                      disabled
                    />
                    <small className="tp-helper-text">Email cannot be changed. Contact admin if needed.</small>
                  </div>
                </div>

                <div className="tp-subsection">
                  <h4 className="tp-subsection-title">Address</h4>
                  <div className="tp-input-group">
                    <label className="tp-label">Street Address</label>
                    <input
                      type="text"
                      className="tp-input"
                      value={formData.address.street}
                      onChange={(e) => handleNestedChange('address', 'street', e.target.value)}
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
                        onChange={(e) => handleNestedChange('address', 'city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    
                    <div className="tp-input-group">
                      <label className="tp-label">State</label>
                      <input
                        type="text"
                        className="tp-input"
                        value={formData.address.state}
                        onChange={(e) => handleNestedChange('address', 'state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    
                    <div className="tp-input-group">
                      <label className="tp-label">ZIP Code</label>
                      <input
                        type="text"
                        className="tp-input"
                        value={formData.address.zip}
                        onChange={(e) => handleNestedChange('address', 'zip', e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>

                <div className="tp-subsection">
                  <h4 className="tp-subsection-title">Emergency Contact</h4>
                  <div className="tp-form-row">
                    <div className="tp-input-group">
                      <label className="tp-label">Contact Name</label>
                      <input
                        type="text"
                        className="tp-input"
                        value={formData.emergencyContact.name}
                        onChange={(e) => handleNestedChange('emergencyContact', 'name', e.target.value)}
                        placeholder="Emergency contact name"
                      />
                    </div>
                    
                    <div className="tp-input-group">
                      <label className="tp-label">Contact Phone</label>
                      <input
                        type="tel"
                        className="tp-input"
                        value={formData.emergencyContact.phone}
                        onChange={(e) => handleNestedChange('emergencyContact', 'phone', e.target.value)}
                        placeholder="(123) 456-7890"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Professional Credentials */}
          <div className="tp-section">
            <div 
              className="tp-section-header"
              onClick={() => toggleSection('credentials')}
            >
              <h3 className="tp-section-title">2. Professional Credentials</h3>
              <span className="tp-section-toggle">
                {expandedSections.credentials ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.credentials && (
              <div className="tp-section-content">
                <div className="tp-form-row">
                  <div className="tp-input-group">
                    <label className="tp-label">
                      License Type <span className="tp-required">*</span>
                    </label>
                    <select
                      className={`tp-input ${validationErrors.licenseType ? 'tp-input-error' : ''}`}
                      value={formData.licenseType}
                      onChange={(e) => handleInputChange('licenseType', e.target.value)}
                      required
                    >
                      <option value="">Select license type</option>
                      <option value="PT">PT - Physical Therapist</option>
                      <option value="OT">OT - Occupational Therapist</option>
                      <option value="SLP">SLP - Speech-Language Pathologist</option>
                      <option value="BCaBA">BCaBA - Board Certified Assistant Behavior Analyst</option>
                      <option value="BCBA">BCBA - Board Certified Behavior Analyst</option>
                      <option value="RBT">RBT - Registered Behavior Technician</option>
                      <option value="Other">Other</option>
                    </select>
                    {validationErrors.licenseType && (
                      <small className="tp-error-text">{validationErrors.licenseType}</small>
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
                      onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                      placeholder="Enter license number"
                      required
                    />
                    {validationErrors.licenseNumber && (
                      <small className="tp-error-text">{validationErrors.licenseNumber}</small>
                    )}
                  </div>
                  
                  <div className="tp-input-group">
                    <label className="tp-label">License State</label>
                    <input
                      type="text"
                      className="tp-input"
                      value={formData.licenseState}
                      onChange={(e) => handleInputChange('licenseState', e.target.value)}
                      placeholder="e.g., CA, NY"
                    />
                  </div>
                </div>

                <div className="tp-form-row">
                  <div className="tp-input-group">
                    <label className="tp-label">License Issue Date</label>
                    <input
                      type="date"
                      className="tp-input"
                      value={formData.licenseIssueDate}
                      onChange={(e) => handleInputChange('licenseIssueDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="tp-input-group">
                    <label className="tp-label">License Expiration Date</label>
                    <input
                      type="date"
                      className="tp-input"
                      value={formData.licenseExpirationDate}
                      onChange={(e) => handleInputChange('licenseExpirationDate', e.target.value)}
                    />
                  </div>
                  
                  <div className="tp-input-group">
                    <label className="tp-label">License Status</label>
                    <div className={`tp-status-badge ${licenseStatus === 'Active' ? 'tp-status-active' : licenseStatus === 'Expiring Soon' ? 'tp-status-warning' : 'tp-status-expired'}`}>
                      {licenseStatus}
                    </div>
                  </div>
                </div>

                <div className="tp-form-row">
                  <div className="tp-input-group">
                    <label className="tp-label">Years of Experience</label>
                    <input
                      type="number"
                      className="tp-input"
                      value={formData.yearsExperience}
                      onChange={(e) => handleInputChange('yearsExperience', parseInt(e.target.value) || 0)}
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="tp-input-group">
                    <label className="tp-label">Employment Status</label>
                    <select
                      className="tp-input"
                      value={formData.employmentStatus}
                      onChange={(e) => handleInputChange('employmentStatus', e.target.value)}
                    >
                      <option value="">Select status</option>
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                    </select>
                  </div>
                </div>

                <div className="tp-input-group">
                  <label className="tp-label">Specializations</label>
                  <div className="tp-checkbox-grid">
                    {[
                      'Autism Spectrum Disorder',
                      'Behavioral Therapy',
                      'Motor Skills Development',
                      'Speech & Language',
                      'Sensory Integration',
                      'Early Intervention',
                      'Social Skills Training',
                      'Adaptive Skills'
                    ].map(spec => (
                      <label key={spec} className="tp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={formData.specializations.includes(spec)}
                          onChange={() => handleSpecializationToggle(spec)}
                        />
                        <span>{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: Education History */}
          <div className="tp-section">
            <div 
              className="tp-section-header"
              onClick={() => toggleSection('education')}
            >
              <h3 className="tp-section-title">3. Education History</h3>
              <span className="tp-section-toggle">
                {expandedSections.education ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.education && (
              <div className="tp-section-content">
                <p className="tp-section-description">College and Graduate Education</p>
                
                {/* Existing Education Entries */}
                {formData.educationHistory.length > 0 && (
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

                {/* Add New Education Form */}
                <EducationEntry
                  education={newEducation}
                  isNew={true}
                  onChange={handleNewEducationChange}
                  onAdd={handleAddEducation}
                  onFileUpload={handleEducationCertificateUpload}
                  uploading={uploadingFile === 'new-education-cert'}
                />
              </div>
            )}
          </div>

          {/* SECTION 4: Certifications */}
          <div className="tp-section">
            <div 
              className="tp-section-header"
              onClick={() => toggleSection('certifications')}
            >
              <h3 className="tp-section-title">4. Certifications</h3>
              <span className="tp-section-toggle">
                {expandedSections.certifications ? '−' : '+'}
              </span>
            </div>
            
            {expandedSections.certifications && (
              <div className="tp-section-content">
                {/* Existing Certifications */}
                {formData.certifications.length > 0 && (
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

                {/* Add New Certification Form */}
                <CertificationEntry
                  certification={newCertification}
                  isNew={true}
                  onChange={handleNewCertificationChange}
                  onAdd={handleAddCertification}
                  onFileUpload={handleCertificationCertificateUpload}
                  uploading={uploadingFile === 'new-cert-cert'}
                />
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="tp-actions">
            <button
              type="button"
              className="tp-cancel-btn"
              onClick={() => navigate('/therapist/dashboard')}
              disabled={saving}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="tp-save-btn"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TherapistProfile;