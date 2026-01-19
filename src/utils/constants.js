export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin', 
  ADMIN: 'admin',
  TEACHER: 'teacher',
  PARENT: 'parent',
  THERAPIST: 'therapist'
};

export const SERVICE_TYPES = {
  SPEECH_THERAPY: 'Speech Therapy',
  BEHAVIORAL_THERAPY: 'Behavioral Therapy',
  OCCUPATIONAL_THERAPY: 'Occupational Therapy',
  ART_CLASS: 'Art Class',
  MUSIC_CLASS: 'Music Class',
  PHYSICAL_THERAPY: 'Physical Therapy'
};

export const ACTIVITY_TYPES = {
  ONE_ON_ONE: 'one_on_one',
  PLAY_GROUP: 'play_group'
};

export const ACCOUNT_STATUS = {
  PENDING_SETUP: 'pending_setup',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// UUID generator polyfill for browsers that don't support crypto.randomUUID
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
  });
}

// =============================================================================
// SERVICE ENROLLMENT CONSTANTS
// =============================================================================

/**
 * Service enrollment status at the student level
 */
export const SERVICE_ENROLLMENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

/**
 * Predefined reasons for staff removal/change
 */
export const STAFF_REMOVAL_REASONS = [
  { value: 'staff_transferred', label: 'Staff Transferred' },
  { value: 'scheduling_conflict', label: 'Scheduling Conflict' },
  { value: 'staff_resigned', label: 'Staff Resigned' },
  { value: 'parent_request', label: 'Parent Request' },
  { value: 'admin_decision', label: 'Administrative Decision' },
  { value: 'service_deactivated', label: 'Service Deactivated' },
  { value: 'other', label: 'Other' }
];

/**
 * Predefined reasons for service deactivation
 */
export const SERVICE_DEACTIVATION_REASONS = [
  { value: 'goal_met', label: 'IEP/Service Goal Met' },
  { value: 'no_longer_needed', label: 'Service No Longer Needed' },
  { value: 'funding_ended', label: 'Funding/Authorization Ended' },
  { value: 'student_transferred', label: 'Student Transferred' },
  { value: 'parent_request', label: 'Parent Request' },
  { value: 'temporary_hold', label: 'Temporary Hold' },
  { value: 'other', label: 'Other' }
];

/**
 * Service offering types
 */
export const SERVICE_OFFERING_TYPES = {
  THERAPY: 'Therapy',
  CLASS: 'Class'
};

/**
 * Generate a unique enrollment ID
 */
export function generateEnrollmentId() {
  return `se_${generateUUID().substring(0, 8)}`;
}

/**
 * Generate a unique staff history ID
 */
export function generateStaffHistoryId() {
  return `sh_${generateUUID().substring(0, 8)}`;
}