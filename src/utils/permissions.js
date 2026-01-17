/**
 * PERMISSIONS UTILITY
 * Centralized permission constants and helpers
 */

// Permission keys
export const PERMISSIONS = {
  CAN_ENROLL_STUDENTS: 'canEnrollStudents',
  // Future permissions:
  // CAN_EDIT_ASSESSMENTS: 'canEditAssessments',
  // CAN_ARCHIVE_STUDENTS: 'canArchiveStudents',
};

// Roles that bypass permission checks (always have full access)
export const PERMISSION_BYPASS_ROLES = ['super_admin'];

/**
 * Check if user has a specific permission
 * @param {Object} user - User object from auth context
 * @param {string} permission - Permission key from PERMISSIONS constant
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  if (!user) return false;
  
  // Super admin bypasses all permission checks
  if (PERMISSION_BYPASS_ROLES.includes(user.role)) {
    return true;
  }
  
  // Check explicit permission flag
  return user.permissions?.[permission] === true;
};

/**
 * Check if user can enroll students
 * @param {Object} user - User object from auth context
 * @returns {boolean}
 */
export const canEnrollStudents = (user) => {
  return hasPermission(user, PERMISSIONS.CAN_ENROLL_STUDENTS);
};

/**
 * Get default permissions for a new user by role
 * @param {string} role - User role
 * @returns {Object} Default permissions object
 */
export const getDefaultPermissions = (role) => {
  // Super admin doesn't need explicit permissions
  if (PERMISSION_BYPASS_ROLES.includes(role)) {
    return {};
  }
  
  // Staff (teacher/therapist) start with no enrollment permission
  if (['teacher', 'therapist'].includes(role)) {
    return {
      [PERMISSIONS.CAN_ENROLL_STUDENTS]: false,
    };
  }
  
  // Admin role - also needs explicit permission per requirements
  if (role === 'admin') {
    return {
      [PERMISSIONS.CAN_ENROLL_STUDENTS]: false,
    };
  }
  
  // Parents and others - no enrollment permissions
  return {};
};