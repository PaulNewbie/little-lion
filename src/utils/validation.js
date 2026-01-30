/**
 * VALIDATION UTILITIES
 * Centralized validation logic for all forms across the application
 * 
 * Usage:
 * import { validateProfile, validateEnrollmentStep, validateSession, validateParentAccount, validateStaffAccount, validateField, combineValidationResults, VALIDATION_RULES, VALIDATION_PATTERNS } from './utils/validation';
 */

// ============================================================================
// VALIDATION RULES BY FEATURE
// ============================================================================

export const VALIDATION_RULES = {
  /**
   * Profile validation rules for different user roles
   */
  profile: {
    therapist: {
      // Note: Therapists use licenses[] array, validated separately below
      required: ['firstName', 'lastName', 'phone'],
      requiresLicenseArray: true, // Custom flag for array-based license validation
      optional: ['middleName', 'dateOfBirth', 'gender', 'address', 'emergencyContact'],
      recommended: ['educationHistory', 'certifications', 'specializations']
    },
    teacher: {
      required: ['firstName', 'lastName', 'phone'], // Removed teachingLicense and certificationLevel
      optional: ['middleName', 'dateOfBirth', 'gender', 'address', 'emergencyContact', 'prcIdNumber', 'teachingLicense', 'certificationLevel'],
      recommended: ['educationHistory', 'certifications', 'specializations']
    },
    parent: {
      required: ['firstName', 'lastName', 'email'],
      optional: ['middleName', 'phone', 'address']
    },
    admin: {
      required: ['firstName', 'lastName', 'email'],
      optional: ['middleName', 'phone']
    }
  },

  /**
   * Enrollment form validation (9-step process)
   */
  enrollment: {
    step1: ['firstName', 'lastName', 'dateOfBirth', 'gender', 'assessmentDates', 'examiner'],
    step2: ['reasonForReferral'],
    step3: ['purposeOfAssessment'],
    step4: [
      'backgroundHistory.familyBackground',
      'backgroundHistory.familyRelationships',
      'backgroundHistory.dailyLifeActivities',
      'backgroundHistory.medicalHistory',
      'backgroundHistory.developmentalBackground',
      'backgroundHistory.schoolHistory',
      'backgroundHistory.clinicalDiagnosis',
      'backgroundHistory.interventions',
      'backgroundHistory.strengthsAndInterests',
      'backgroundHistory.socialSkills'
    ],
    step5: ['behaviorDuringAssessment'],
    step6: ['assessmentTools'],
    step7: ['assessmentTools'], // Results field
    step8: ['assessmentSummary'], // Summary and recommendations
    step9: [] // Service enrollment (validated separately)
  },

  /**
   * Therapy session validation
   */
  session: {
    required: ['studentId', 'serviceId', 'date', 'duration', 'attendanceStatus'],
    optional: ['notes', 'progressNotes', 'attachments', 'goals']
  },

  /**
   * Parent account creation
   */
  parentAccount: {
    required: ['firstName', 'lastName', 'email'],
    optional: ['middleName', 'phone', 'photo']
  },
  
  /**
   * Staff account creation (teacher/therapist/admin)
   */
  staffAccount: {
    required: ['firstName', 'lastName', 'email'],
    optional: ['middleName']
  }
};

// ============================================================================
// COMMON VALIDATION PATTERNS
// ============================================================================

export const VALIDATION_PATTERNS = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessage: 'Please enter a valid email address'
  },
  phone: {
    pattern: /^[\d\s\-\(\)]+$/,
    errorMessage: 'Please enter a valid phone number (e.g., 123-456-7890)'
  },
  zip: {
    pattern: /^\d{5}(-\d{4})?$/,
    errorMessage: 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)'
  },
  licenseNumber: {
    pattern: /^[A-Z0-9\s\-\.\/]{2,30}$/i,
    errorMessage: 'License number must be 2-30 characters (letters, numbers, spaces, hyphens, dots, slashes)'
  },
  teachingLicense: {
    pattern: /^[A-Z0-9\s\-\.\/]{2,30}$/i,
    errorMessage: 'Teaching license must be 2-30 characters (letters, numbers, spaces, hyphens, dots, slashes)'
  },
  prcId: {
    pattern: /^[A-Z0-9\-]{5,15}$/i,
    errorMessage: 'PRC ID must be 5-15 characters (letters, numbers, hyphens)'
  },
  year: {
    pattern: /^(19|20)\d{2}$/,
    errorMessage: 'Please enter a valid 4-digit year (e.g., 2020)'
  },
  gpa: {
    pattern: /^([0-3](\.\d{1,2})?|4(\.0{1,2})?)$/,
    errorMessage: 'GPA must be between 0.00 and 4.00'
  }
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate profile data for a specific role
 * 
 * @param {Object} data - Form data to validate
 * @param {string} role - User role (therapist, teacher, parent, admin)
 * @returns {Object} { isValid: boolean, errors: Object, warnings: Object }
 */
export const validateProfile = (data, role) => {
  const rules = VALIDATION_RULES.profile[role];
  
  if (!rules) {
    return { 
      isValid: false, 
      errors: { role: 'Invalid role specified' },
      warnings: {}
    };
  }
  
  const errors = {};
  const warnings = {};
  
  // Check required fields
  rules.required.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors[field] = `${formatFieldName(field)} is required`;
    }
  });
  
  // Check nested objects (address, emergencyContact)
  if (data.address) {
    if (!data.address.street && !data.address.city && !data.address.state && !data.address.zip) {
      warnings.address = 'Adding your address is recommended for emergency contacts';
    }
  }
  
  if (data.emergencyContact) {
    if (!data.emergencyContact.name || !data.emergencyContact.phone) {
      warnings.emergencyContact = 'Emergency contact information is recommended';
    }
  }
  
  // Role-specific validation
  if (role === 'therapist' || role === 'teacher') {
    // Therapist: Check licenses array (required)
    if (rules.requiresLicenseArray) {
      if (!data.licenses || data.licenses.length === 0) {
        errors.licenses = 'At least one license is required';
      } else {
        // Validate each license entry
        data.licenses.forEach((license, index) => {
          if (!license.licenseType || !license.licenseNumber) {
            errors[`license_${index}`] = `License ${index + 1} is incomplete (type and number required)`;
          }
          // Validate license number format
          if (license.licenseNumber && !VALIDATION_PATTERNS.licenseNumber.pattern.test(license.licenseNumber)) {
            errors[`license_${index}_number`] = `License ${index + 1}: ${VALIDATION_PATTERNS.licenseNumber.errorMessage}`;
          }
        });
      }
    }

    // Check education history
    if (!data.educationHistory || data.educationHistory.length === 0) {
      warnings.educationHistory = 'Adding your education history is recommended';
    } else {
      // Validate each education entry
      data.educationHistory.forEach((edu, index) => {
        if (!edu.institution || !edu.degreeType || !edu.fieldOfStudy || !edu.graduationYear) {
          errors[`education_${index}`] = `Education entry ${index + 1} is incomplete`;
        }
      });
    }
    
    // Check certifications
    if (!data.certifications || data.certifications.length === 0) {
      warnings.certifications = 'Adding certifications is recommended';
    } else {
      // Validate each certification entry
      data.certifications.forEach((cert, index) => {
        if (!cert.name || !cert.issuingOrg || !cert.issueDate) {
          errors[`certification_${index}`] = `Certification entry ${index + 1} is incomplete`;
        }
      });
    }
    
    // License expiration check (teacher/therapist specific)
    const expirationField = role === 'teacher' ? 'licenseExpirationDate' : 'licenseExpirationDate';
    if (data[expirationField]) {
      const expDate = new Date(data[expirationField]);
      const today = new Date();
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(today.getDate() + 60);
      
      if (expDate < today) {
        errors[expirationField] = 'Your license has expired. Please renew immediately.';
      } else if (expDate < sixtyDaysFromNow) {
        warnings[expirationField] = 'Your license expires within 60 days. Please renew soon.';
      }
    }
    
    // Teacher-specific validations
    if (role === 'teacher') {
      // Validate teaching license format
      if (data.teachingLicense && !VALIDATION_PATTERNS.teachingLicense.pattern.test(data.teachingLicense)) {
        errors.teachingLicense = VALIDATION_PATTERNS.teachingLicense.errorMessage;
      }
      
      // Validate PRC ID format (if provided)
      if (data.prcIdNumber && data.prcIdNumber !== '' && !VALIDATION_PATTERNS.prcId.pattern.test(data.prcIdNumber)) {
        errors.prcIdNumber = VALIDATION_PATTERNS.prcId.errorMessage;
      }
    }
    
    // Therapist-specific validations
    if (role === 'therapist') {
      if (data.licenseNumber && !VALIDATION_PATTERNS.licenseNumber.pattern.test(data.licenseNumber)) {
        errors.licenseNumber = VALIDATION_PATTERNS.licenseNumber.errorMessage;
      }
    }
  }
  
  // Email validation
  if (data.email && !VALIDATION_PATTERNS.email.pattern.test(data.email)) {
    errors.email = VALIDATION_PATTERNS.email.errorMessage;
  }
  
  // Phone validation
  if (data.phone && !VALIDATION_PATTERNS.phone.pattern.test(data.phone)) {
    errors.phone = VALIDATION_PATTERNS.phone.errorMessage;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
};

/**
 * Validate a specific enrollment step
 * 
 * @param {number} stepNumber - Step number (1-9)
 * @param {Object} data - Form data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateEnrollmentStep = (stepNumber, data) => {
  const requiredFields = VALIDATION_RULES.enrollment[`step${stepNumber}`];
  
  if (!requiredFields) {
    return { isValid: true, errors: {} };
  }
  
  const errors = {};
  
  requiredFields.forEach(fieldPath => {
    const value = getNestedValue(data, fieldPath);
    
    if (Array.isArray(value)) {
      // Check if array has at least one valid entry
      if (value.length === 0) {
        errors[fieldPath] = `${formatFieldName(fieldPath)} requires at least one entry`;
      } else {
        // Check if array entries are complete
        const isValid = value.every(item => {
          if (typeof item === 'object') {
            return Object.values(item).some(v => v !== '' && v !== null && v !== undefined);
          }
          return item !== '' && item !== null && item !== undefined;
        });
        
        if (!isValid) {
          errors[fieldPath] = `${formatFieldName(fieldPath)} has incomplete entries`;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Check if object has at least some filled fields
      const hasData = Object.values(value).some(v => v !== '' && v !== null && v !== undefined);
      if (!hasData) {
        errors[fieldPath] = `${formatFieldName(fieldPath)} is required`;
      }
    } else {
      // Simple value check
      if (!value || value === '') {
        errors[fieldPath] = `${formatFieldName(fieldPath)} is required`;
      }
    }
  });
  
  // Step-specific validation
  switch (stepNumber) {
    case 1:
      // Date of birth should not be in the future
      if (data.dateOfBirth && new Date(data.dateOfBirth) > new Date()) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      }
      // Assessment date validation
      if (data.assessmentDates && new Date(data.assessmentDates) > new Date()) {
        errors.assessmentDates = 'Assessment date cannot be in the future';
      }
      break;
      
    case 3:
      // Purpose of assessment should have at least one item
      if (!data.purposeOfAssessment || data.purposeOfAssessment.length === 0) {
        errors.purposeOfAssessment = 'Please select at least one purpose for assessment';
      }
      break;
      
    case 9:
      // At least one service (therapy or class) should be assigned
      const hasTherapy = data.oneOnOneServices && data.oneOnOneServices.length > 0;
      const hasClass = data.groupClassServices && data.groupClassServices.length > 0;
      
      if (!hasTherapy && !hasClass) {
        errors.services = 'Please assign at least one therapy service or group class';
      }
      
      // Validate therapy services
      if (hasTherapy) {
        data.oneOnOneServices.forEach((service, index) => {
          if (!service.serviceId || !service.staffId) {
            errors[`therapy_${index}`] = `Therapy service ${index + 1} is incomplete`;
          }
        });
      }
      
      // Validate group classes
      if (hasClass) {
        data.groupClassServices.forEach((service, index) => {
          if (!service.serviceId || !service.staffId) {
            errors[`class_${index}`] = `Group class ${index + 1} is incomplete`;
          }
        });
      }
      break;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate therapy session data
 * 
 * @param {Object} data - Session data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateSession = (data) => {
  const errors = {};
  
  // Check required fields
  VALIDATION_RULES.session.required.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors[field] = `${formatFieldName(field)} is required`;
    }
  });
  
  // Date validation
  if (data.date) {
    const sessionDate = new Date(data.date);
    const today = new Date();
    
    if (sessionDate > today) {
      errors.date = 'Session date cannot be in the future';
    }
    
    // Check if date is more than 30 days in the past
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    if (sessionDate < thirtyDaysAgo) {
      errors.date = 'Session date cannot be more than 30 days in the past';
    }
  }
  
  // Duration validation
  if (data.duration) {
    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration < 15 || duration > 240) {
      errors.duration = 'Session duration must be between 15 and 240 minutes';
    }
  }
  
  // Attendance status validation
  if (data.attendanceStatus && !['Present', 'Absent', 'Late', 'Cancelled'].includes(data.attendanceStatus)) {
    errors.attendanceStatus = 'Invalid attendance status';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate parent account creation
 * 
 * @param {Object} data - Parent account data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateParentAccount = (data) => {
  const errors = {};
  
  // Check required fields
  VALIDATION_RULES.parentAccount.required.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors[field] = `${formatFieldName(field)} is required`;
    }
  });
  
  // Email validation
  if (data.email && !VALIDATION_PATTERNS.email.pattern.test(data.email)) {
    errors.email = VALIDATION_PATTERNS.email.errorMessage;
  }
  
  // Phone validation (if provided)
  if (data.phone && !VALIDATION_PATTERNS.phone.pattern.test(data.phone)) {
    errors.phone = VALIDATION_PATTERNS.phone.errorMessage;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validate staff account creation (teacher/therapist/admin)
 * 
 * @param {Object} data - Staff account data
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export const validateStaffAccount = (data) => {
  const errors = {};
  
  const required = ['firstName', 'lastName', 'email'];
  required.forEach(field => {
    if (!data[field] || data[field] === '') {
      errors[field] = `${formatFieldName(field)} is required`;
    }
  });
  
  if (data.email && !VALIDATION_PATTERNS.email.pattern.test(data.email)) {
    errors.email = VALIDATION_PATTERNS.email.errorMessage;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Generic field validator with custom rules
 * 
 * @param {string} fieldName - Field name for error messages
 * @param {any} value - Field value
 * @param {Object} rules - Validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validateField = (fieldName, value, rules = {}) => {
  // Required validation
  if (rules.required && (!value || value === '')) {
    return `${fieldName} is required`;
  }
  
  // Skip other validations if value is empty and not required
  if (!value || value === '') return null;
  
  // Min length validation
  if (rules.minLength && value.length < rules.minLength) {
    return `${fieldName} must be at least ${rules.minLength} characters`;
  }
  
  // Max length validation
  if (rules.maxLength && value.length > rules.maxLength) {
    return `${fieldName} must be less than ${rules.maxLength} characters`;
  }
  
  // Min value validation (for numbers)
  if (rules.min !== undefined && parseFloat(value) < rules.min) {
    return `${fieldName} must be at least ${rules.min}`;
  }
  
  // Max value validation (for numbers)
  if (rules.max !== undefined && parseFloat(value) > rules.max) {
    return `${fieldName} must be at most ${rules.max}`;
  }
  
  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    return rules.errorMessage || `${fieldName} format is invalid`;
  }
  
  // Custom validation function
  if (rules.custom && typeof rules.custom === 'function') {
    const customError = rules.custom(value);
    if (customError) return customError;
  }
  
  return null; // No error
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get nested value from object using dot notation
 * 
 * @param {Object} obj - Object to search
 * @param {string} path - Dot-notated path (e.g., "backgroundHistory.familyBackground")
 * @returns {any} Value at path or undefined
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

/**
 * Format field name for display in error messages
 * 
 * @param {string} fieldName - Field name (camelCase or dot.notation)
 * @returns {string} Formatted field name
 */
function formatFieldName(fieldName) {
  // Remove nested path prefixes
  const name = fieldName.split('.').pop();
  
  // Convert camelCase to Title Case
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Combine multiple validation results
 * 
 * @param  {...Object} validationResults - Multiple validation result objects
 * @returns {Object} Combined validation result
 */
export const combineValidationResults = (...validationResults) => {
  const combinedErrors = {};
  const combinedWarnings = {};
  
  validationResults.forEach(result => {
    Object.assign(combinedErrors, result.errors || {});
    Object.assign(combinedWarnings, result.warnings || {});
  });
  
  return {
    isValid: Object.keys(combinedErrors).length === 0,
    errors: combinedErrors,
    warnings: combinedWarnings
  };
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  validateProfile,
  validateEnrollmentStep,
  validateSession,
  validateParentAccount,
  validateStaffAccount,
  validateField,
  combineValidationResults,
  VALIDATION_RULES,
  VALIDATION_PATTERNS
};