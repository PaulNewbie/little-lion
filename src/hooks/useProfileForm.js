import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from './useCachedData';
import { QUERY_KEYS } from '../config/queryClient';
import userService from '../services/userService';
import cloudinaryService from '../services/cloudinaryService';
import { validateProfile } from '../utils/validation';
import { parseFileName, validateFileSize, validateFileType } from '../utils/profileHelpers';

/**
 * useProfileForm Hook
 * Handles all profile form logic: loading, validation, saving, file uploads
 * Reusable across Teacher and Therapist profiles
 * OPTIMIZED: Uses cached user data to prevent re-reads
 */
export const useProfileForm = (currentUser, role, navigate) => {
  const queryClient = useQueryClient();

  // ============ CACHED: Use cached user data ============
  const { data: userData, isLoading: userLoading } = useUser(currentUser?.uid);

  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [formInitialized, setFormInitialized] = useState(false);

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
    // Therapist: multiple licenses
    licenses: [],
    // Teacher: single license fields
    licenseType: '',
    licenseNumber: '',
    licenseState: '',
    licenseIssueDate: '',
    licenseExpirationDate: '',
    teachingLicense: '',
    prcIdNumber: '',
    certificationLevel: '',
    yearsExperience: 0,
    specializations: [],
    employmentStatus: '',
    educationHistory: [],
    certifications: []
  });

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

  const [newLicense, setNewLicense] = useState({
    licenseType: '',
    licenseNumber: '',
    licenseState: '',
    licenseIssueDate: '',
    licenseExpirationDate: ''
  });

  // Populate form when cached user data is available
  useEffect(() => {
    if (userData && !formInitialized) {
      console.log('♻️ Profile: Using cached user data');
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
        // Therapist: multiple licenses
        licenses: userData.licenses || [],
        // Teacher: single license fields
        licenseType: userData.licenseType || '',
        licenseNumber: userData.licenseNumber || '',
        teachingLicense: userData.teachingLicense || '',
        prcIdNumber: userData.prcIdNumber || '',
        certificationLevel: userData.certificationLevel || '',
        licenseState: userData.licenseState || '',
        licenseIssueDate: userData.licenseIssueDate || '',
        licenseExpirationDate: userData.licenseExpirationDate || '',
        yearsExperience: userData.yearsExperience || 0,
        specializations: userData.specializations || [],
        employmentStatus: userData.employmentStatus || '',
        educationHistory: userData.educationHistory || [],
        certifications: userData.certifications || []
      });
      setFormInitialized(true);
    }
  }, [userData, formInitialized]);

  // Derive loading state from React Query
  const loading = userLoading || (!formInitialized && !!currentUser?.uid);

  // Form handlers
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  // File upload handlers
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!validateFileType(file, ['image/jpeg', 'image/jpg', 'image/png'])) {
      alert('Please upload a valid image file (JPG, PNG).');
      return;
    }

    if (!validateFileSize(file, 5)) {
      alert('File size must be less than 5MB.');
      return;
    }

    setUploadingFile('profile-photo');
    try {
      const folder = role === 'teacher' ? 'little-lions/teachers' : 'little-lions/therapists';
      const url = await cloudinaryService.uploadImage(file, folder);
      handleInputChange('profilePhoto', url);

      // Auto-save profile photo to database immediately
      await userService.updateUser(currentUser.uid, {
        profilePhoto: url,
        updatedAt: new Date().toISOString()
      });

      // Invalidate cache so the new photo shows everywhere
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(currentUser.uid) });

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

    if (!validateFileSize(file, 10)) {
      alert('File size must be less than 10MB.');
      return;
    }

    setUploadingFile('new-education-cert');
    try {
      const folder = role === 'teacher' ? 'little-lions/teachers/education' : 'little-lions/therapists/education';
      const url = await cloudinaryService.uploadImage(file, folder);
      const parsed = parseFileName(file.name);
      
      setNewEducation(prev => ({
        ...prev,
        certificateURL: url,
        institution: prev.institution || parsed.institution,
        degreeType: prev.degreeType || parsed.degreeType,
        fieldOfStudy: prev.fieldOfStudy || parsed.fieldOfStudy,
        graduationYear: prev.graduationYear || parsed.year
      }));
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

    if (!validateFileSize(file, 10)) {
      alert('File size must be less than 10MB.');
      return;
    }

    setUploadingFile('new-cert-cert');
    try {
      const folder = role === 'teacher' ? 'little-lions/teachers/certifications' : 'little-lions/therapists/certifications';
      const url = await cloudinaryService.uploadImage(file, folder);
      setNewCertification(prev => ({ ...prev, certificateURL: url }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload certificate. Please try again.');
    } finally {
      setUploadingFile(null);
    }
  };

  // Education handlers
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

  // Certification handlers
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

  // License handlers (for therapists with multiple licenses)
  const handleNewLicenseChange = (field, value) => {
    setNewLicense(prev => ({ ...prev, [field]: value }));
  };

  const handleAddLicense = () => {
    if (!newLicense.licenseType || !newLicense.licenseNumber) {
      alert('Please fill in License Type and License Number.');
      return;
    }

    const licenseEntry = {
      id: Date.now().toString(),
      licenseType: newLicense.licenseType,
      licenseNumber: newLicense.licenseNumber,
      licenseState: newLicense.licenseState,
      licenseIssueDate: newLicense.licenseIssueDate,
      licenseExpirationDate: newLicense.licenseExpirationDate
    };

    setFormData(prev => ({
      ...prev,
      licenses: [...prev.licenses, licenseEntry]
    }));

    setNewLicense({
      licenseType: '',
      licenseNumber: '',
      licenseState: '',
      licenseIssueDate: '',
      licenseExpirationDate: ''
    });
  };

  const handleRemoveLicense = (index) => {
    if (window.confirm('Are you sure you want to remove this license?')) {
      setFormData(prev => ({
        ...prev,
        licenses: prev.licenses.filter((_, i) => i !== index)
      }));
    }
  };

  // Save profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    const { isValid, errors, warnings } = validateProfile(formData, role);
    
    if (!isValid) {
      setValidationErrors(errors);
      alert(`Please fix the following errors:\n${Object.values(errors).join('\n')}`);
      
      const errorFields = Object.keys(errors);
      if (errorFields.some(f => ['firstName', 'lastName', 'phone'].includes(f))) {
        setExpandedSections(prev => ({ ...prev, personal: true }));
      } else if (errorFields.some(f => ['licenseType', 'licenseNumber', 'teachingLicense'].includes(f))) {
        setExpandedSections(prev => ({ ...prev, credentials: true }));
      }
      
      return;
    }

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

      // Invalidate user cache so fresh data is fetched next time
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(currentUser.uid) });
      // Also invalidate role-specific cache if this user is in a list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users(role) });

      alert('Profile updated successfully!');
      navigate(`/${role}/dashboard`);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    uploadingFile,
    validationErrors,
    expandedSections,
    formData,
    newEducation,
    newCertification,
    newLicense,
    handleInputChange,
    handleNestedChange,
    handleSpecializationToggle,
    toggleSection,
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
  };
};