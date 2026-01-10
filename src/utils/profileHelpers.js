/**
 * PROFILE HELPER UTILITIES
 * Shared functions used across therapist, teacher, and other user profiles
 * 
 * Usage:
 * import { parseFileName, getExpirationStatus, formatDate } from '../utils/profileHelpers';
 */

// ============================================================================
// FILE UPLOAD HELPERS
// ============================================================================

/**
 * Parse filename for auto-fill suggestions
 * Works with filenames like: "Harvard_Masters_OT_2020.pdf" or "MIT-Bachelors-Psychology-2018.jpg"
 * 
 * @param {string} filename - Name of uploaded file
 * @returns {Object} { suggestedYear, suggestedDegree, suggestedInstitution }
 */
export const parseFileName = (filename) => {
  if (!filename) return { suggestedYear: '', suggestedDegree: '', suggestedInstitution: '' };
  
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(pdf|jpg|jpeg|png|doc|docx)$/i, '');
  
  // Split by common separators (underscore, hyphen, space)
  const parts = nameWithoutExt.split(/[_\-\s]+/);
  
  // Look for 4-digit year (e.g., 2020, 2018)
  const yearMatch = parts.find(part => /^\d{4}$/.test(part) && parseInt(part) >= 1950 && parseInt(part) <= 2100);
  
  // Look for degree keywords
  const degreeKeywords = {
    'bachelor': "Bachelor's",
    'bachelors': "Bachelor's",
    'ba': "Bachelor's",
    'bs': "Bachelor's",
    'bsc': "Bachelor's",
    'master': "Master's",
    'masters': "Master's",
    'ma': "Master's",
    'ms': "Master's",
    'msc': "Master's",
    'mba': "Master's",
    'phd': 'Doctorate',
    'doctorate': 'Doctorate',
    'doctoral': 'Doctorate',
    'edd': 'Doctorate',
    'jd': 'Professional Degree',
    'md': 'Professional Degree'
  };
  
  let suggestedDegree = '';
  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    if (degreeKeywords[lowerPart]) {
      suggestedDegree = degreeKeywords[lowerPart];
      break;
    }
  }
  
  // First part is usually the institution name
  // Clean it up by replacing underscores/hyphens with spaces
  const suggestedInstitution = parts[0] ? parts[0].replace(/[_-]/g, ' ') : '';
  
  return {
    suggestedYear: yearMatch ? parseInt(yearMatch) : '',
    suggestedDegree,
    suggestedInstitution
  };
};

/**
 * Validate file size
 * 
 * @param {File} file - File object
 * @param {number} maxSizeMB - Maximum file size in megabytes
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateFileSize = (file, maxSizeMB = 5) => {
  if (!file) return { isValid: false, error: 'No file provided' };
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      error: `File size must be less than ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` 
    };
  }
  
  return { isValid: true, error: null };
};

/**
 * Validate file type
 * 
 * @param {File} file - File object
 * @param {Array} allowedTypes - Array of allowed MIME types
 * @returns {Object} { isValid: boolean, error: string|null }
 */
export const validateFileType = (file, allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']) => {
  if (!file) return { isValid: false, error: 'No file provided' };
  
  if (!allowedTypes.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Invalid file type. Allowed types: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}` 
    };
  }
  
  return { isValid: true, error: null };
};

// ============================================================================
// DATE & STATUS HELPERS
// ============================================================================

/**
 * Calculate expiration status for licenses or certifications
 * 
 * @param {string} expirationDate - ISO date string (YYYY-MM-DD)
 * @returns {string} 'Active', 'Expiring Soon', 'Expired', or 'Unknown'
 */
export const getExpirationStatus = (expirationDate) => {
  if (!expirationDate) return 'Unknown';
  
  const expDate = new Date(expirationDate);
  const today = new Date();
  
  // Set time to midnight for accurate day comparison
  expDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // Already expired
  if (expDate < today) {
    return 'Expired';
  }
  
  // Calculate days until expiration
  const daysUntilExpiration = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  
  // Expiring within 60 days
  if (daysUntilExpiration <= 60) {
    return 'Expiring Soon';
  }
  
  return 'Active';
};

/**
 * Get expiration status with detailed information
 * 
 * @param {string} expirationDate - ISO date string
 * @returns {Object} { status, daysRemaining, message, severity }
 */
export const getExpirationDetails = (expirationDate) => {
  if (!expirationDate) {
    return {
      status: 'Unknown',
      daysRemaining: null,
      message: 'No expiration date set',
      severity: 'info'
    };
  }
  
  const expDate = new Date(expirationDate);
  const today = new Date();
  
  expDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const daysRemaining = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
  
  if (daysRemaining < 0) {
    return {
      status: 'Expired',
      daysRemaining: 0,
      message: `Expired ${Math.abs(daysRemaining)} days ago`,
      severity: 'error'
    };
  }
  
  if (daysRemaining === 0) {
    return {
      status: 'Expiring Today',
      daysRemaining: 0,
      message: 'Expires today',
      severity: 'error'
    };
  }
  
  if (daysRemaining <= 30) {
    return {
      status: 'Expiring Soon',
      daysRemaining,
      message: `Expires in ${daysRemaining} days`,
      severity: 'warning'
    };
  }
  
  if (daysRemaining <= 60) {
    return {
      status: 'Expiring Soon',
      daysRemaining,
      message: `Expires in ${daysRemaining} days`,
      severity: 'info'
    };
  }
  
  return {
    status: 'Active',
    daysRemaining,
    message: `Active for ${daysRemaining} more days`,
    severity: 'success'
  };
};

/**
 * Format date for display
 * 
 * @param {string} dateString - ISO date string or Date object
 * @param {string} format - 'short', 'long', or 'medium' (default)
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, format = 'medium') => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  const options = {
    short: { year: 'numeric', month: 'numeric', day: 'numeric' },
    medium: { year: 'numeric', month: 'long', day: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  };
  
  return date.toLocaleDateString('en-US', options[format] || options.medium);
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * 
 * @param {string|Date} date - Date string or Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Calculate age from date of birth
 * 
 * @param {string} dateOfBirth - ISO date string
 * @returns {number|null} Age in years
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  if (isNaN(birthDate.getTime())) return null;
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Calculate age at a specific date (for assessments)
 * 
 * @param {string} dateOfBirth - ISO date string
 * @param {string} assessmentDate - ISO date string
 * @returns {string} Age in format "X years, Y months"
 */
export const calculateAgeAtAssessment = (dateOfBirth, assessmentDate) => {
  if (!dateOfBirth || !assessmentDate) return '';
  
  const birth = new Date(dateOfBirth);
  const assessment = new Date(assessmentDate);
  
  if (isNaN(birth.getTime()) || isNaN(assessment.getTime())) return '';
  
  let years = assessment.getFullYear() - birth.getFullYear();
  let months = assessment.getMonth() - birth.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return `${years} years, ${months} months`;
};

// ============================================================================
// PROFILE DATA HELPERS
// ============================================================================

/**
 * Check if profile is complete based on required fields
 * 
 * @param {Object} profileData - User profile data
 * @param {string} role - User role (therapist, teacher, etc.)
 * @returns {Object} { isComplete: boolean, missingFields: Array, completionPercentage: number }
 */
export const checkProfileCompleteness = (profileData, role) => {
  const requiredFields = {
    therapist: ['firstName', 'lastName', 'licenseType', 'licenseNumber', 'phone', 'educationHistory', 'certifications'],
    teacher: ['firstName', 'lastName', 'teachingLicense', 'certificationLevel', 'phone', 'educationHistory'],
    parent: ['firstName', 'lastName', 'email', 'phone'],
    admin: ['firstName', 'lastName', 'email']
  };
  
  const fields = requiredFields[role] || requiredFields.therapist;
  const missingFields = [];
  
  fields.forEach(field => {
    const value = profileData[field];
    
    if (Array.isArray(value)) {
      if (value.length === 0) {
        missingFields.push(field);
      }
    } else if (!value || value === '') {
      missingFields.push(field);
    }
  });
  
  const completionPercentage = Math.round(((fields.length - missingFields.length) / fields.length) * 100);
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    completionPercentage
  };
};

/**
 * Generate display name from profile data
 * 
 * @param {Object} profileData - User profile data
 * @param {boolean} includeMiddle - Include middle name if available
 * @returns {string} Full name
 */
export const getFullName = (profileData, includeMiddle = false) => {
  if (!profileData) return '';
  
  const { firstName, middleName, lastName } = profileData;
  
  if (includeMiddle && middleName) {
    return `${firstName} ${middleName} ${lastName}`.trim();
  }
  
  return `${firstName || ''} ${lastName || ''}`.trim();
};

/**
 * Generate initials from name
 * 
 * @param {Object} profileData - User profile data
 * @returns {string} Initials (e.g., "JS" for John Smith)
 */
export const getInitials = (profileData) => {
  if (!profileData) return '';
  
  const { firstName, lastName } = profileData;
  
  const firstInitial = firstName ? firstName.charAt(0).toUpperCase() : '';
  const lastInitial = lastName ? lastName.charAt(0).toUpperCase() : '';
  
  return `${firstInitial}${lastInitial}`;
};

// ============================================================================
// ARRAY HELPERS (for education and certifications)
// ============================================================================

/**
 * Sort education history by graduation year (newest first)
 * 
 * @param {Array} educationHistory - Array of education entries
 * @returns {Array} Sorted array
 */
export const sortEducationByYear = (educationHistory) => {
  if (!Array.isArray(educationHistory)) return [];
  
  return [...educationHistory].sort((a, b) => {
    const yearA = a.graduationYear || 0;
    const yearB = b.graduationYear || 0;
    return yearB - yearA; // Newest first
  });
};

/**
 * Sort certifications by issue date (newest first)
 * 
 * @param {Array} certifications - Array of certification entries
 * @returns {Array} Sorted array
 */
export const sortCertificationsByDate = (certifications) => {
  if (!Array.isArray(certifications)) return [];
  
  return [...certifications].sort((a, b) => {
    const dateA = a.issueDate ? new Date(a.issueDate) : new Date(0);
    const dateB = b.issueDate ? new Date(b.issueDate) : new Date(0);
    return dateB - dateA; // Newest first
  });
};

/**
 * Filter active certifications only
 * 
 * @param {Array} certifications - Array of certification entries
 * @returns {Array} Active certifications only
 */
export const getActiveCertifications = (certifications) => {
  if (!Array.isArray(certifications)) return [];
  
  return certifications.filter(cert => {
    if (!cert.expirationDate) return true; // No expiration = always active
    return getExpirationStatus(cert.expirationDate) !== 'Expired';
  });
};

// ============================================================================
// PHONE NUMBER HELPERS
// ============================================================================

/**
 * Format phone number for display
 * 
 * @param {string} phone - Raw phone number
 * @returns {string} Formatted phone number (e.g., (123) 456-7890)
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  // Return as-is if not 10 digits
  return phone;
};

/**
 * Clean phone number (remove formatting)
 * 
 * @param {string} phone - Formatted phone number
 * @returns {string} Digits only
 */
export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  // File helpers
  parseFileName,
  validateFileSize,
  validateFileType,
  
  // Date & status helpers
  getExpirationStatus,
  getExpirationDetails,
  formatDate,
  formatDateForInput,
  calculateAge,
  calculateAgeAtAssessment,
  
  // Profile helpers
  checkProfileCompleteness,
  getFullName,
  getInitials,
  
  // Array helpers
  sortEducationByYear,
  sortCertificationsByDate,
  getActiveCertifications,
  
  // Phone helpers
  formatPhoneNumber,
  cleanPhoneNumber
};