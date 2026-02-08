import { describe, it, expect } from 'vitest';
import {
  validateProfile,
  validateEnrollmentStep,
  validateSession,
  validateParentAccount,
  validateStaffAccount,
  validateField,
  combineValidationResults,
  VALIDATION_PATTERNS
} from './validation';

// ── validateProfile ──

describe('validateProfile', () => {
  it('returns invalid for unknown role', () => {
    const result = validateProfile({}, 'unknown_role');
    expect(result.isValid).toBe(false);
    expect(result.errors.role).toBeDefined();
  });

  it('validates required fields for parent', () => {
    const result = validateProfile({}, 'parent');
    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
    expect(result.errors.lastName).toBeDefined();
    expect(result.errors.email).toBeDefined();
  });

  it('passes with valid parent data', () => {
    const result = validateProfile({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    }, 'parent');
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('rejects invalid email format', () => {
    const result = validateProfile({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'not-an-email',
    }, 'parent');
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBe(VALIDATION_PATTERNS.email.errorMessage);
  });

  it('rejects invalid phone format', () => {
    const result = validateProfile({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      phone: 'abc-xyz',
    }, 'parent');
    expect(result.isValid).toBe(false);
    expect(result.errors.phone).toBe(VALIDATION_PATTERNS.phone.errorMessage);
  });

  it('validates required fields for teacher', () => {
    const result = validateProfile({}, 'teacher');
    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
    expect(result.errors.lastName).toBeDefined();
    expect(result.errors.phone).toBeDefined();
  });

  it('validates therapist license requirement', () => {
    const result = validateProfile({
      firstName: 'Dr.',
      lastName: 'Smith',
      phone: '123-456-7890',
      licenses: [],
    }, 'therapist');
    expect(result.isValid).toBe(false);
    expect(result.errors.licenses).toBeDefined();
  });

  it('validates required fields for admin', () => {
    const result = validateProfile({}, 'admin');
    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
    expect(result.errors.lastName).toBeDefined();
    expect(result.errors.email).toBeDefined();
  });
});

// ── validateSession ──

describe('validateSession', () => {
  const validSession = {
    studentId: 'student-1',
    serviceId: 'service-1',
    date: new Date().toISOString().split('T')[0],
    duration: '60',
    attendanceStatus: 'Present',
  };

  it('passes with valid session', () => {
    const result = validateSession(validSession);
    expect(result.isValid).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = validateSession({});
    expect(result.isValid).toBe(false);
    expect(result.errors.studentId).toBeDefined();
    expect(result.errors.serviceId).toBeDefined();
    expect(result.errors.date).toBeDefined();
    expect(result.errors.duration).toBeDefined();
    expect(result.errors.attendanceStatus).toBeDefined();
  });

  it('rejects future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 5);
    const result = validateSession({
      ...validSession,
      date: future.toISOString(),
    });
    expect(result.errors.date).toContain('future');
  });

  it('rejects duration out of range', () => {
    const tooShort = validateSession({ ...validSession, duration: '5' });
    expect(tooShort.errors.duration).toBeDefined();

    const tooLong = validateSession({ ...validSession, duration: '300' });
    expect(tooLong.errors.duration).toBeDefined();
  });

  it('rejects invalid attendance status', () => {
    const result = validateSession({
      ...validSession,
      attendanceStatus: 'Invalid',
    });
    expect(result.errors.attendanceStatus).toBeDefined();
  });
});

// ── validateParentAccount ──

describe('validateParentAccount', () => {
  it('passes with valid data', () => {
    const result = validateParentAccount({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });
    expect(result.isValid).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = validateParentAccount({});
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3);
  });

  it('rejects invalid email', () => {
    const result = validateParentAccount({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'bad',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
  });
});

// ── validateStaffAccount ──

describe('validateStaffAccount', () => {
  it('passes with valid data', () => {
    const result = validateStaffAccount({
      firstName: 'John',
      lastName: 'Smith',
      email: 'john@school.org',
    });
    expect(result.isValid).toBe(true);
  });

  it('rejects missing fields', () => {
    const result = validateStaffAccount({});
    expect(result.isValid).toBe(false);
  });
});

// ── validateField ──

describe('validateField', () => {
  it('validates required fields', () => {
    expect(validateField('Name', '', { required: true })).toBe('Name is required');
    expect(validateField('Name', 'Alice', { required: true })).toBeNull();
  });

  it('validates min/max length', () => {
    expect(validateField('Code', 'AB', { minLength: 3 })).toContain('at least 3');
    expect(validateField('Code', 'ABCDEF', { maxLength: 4 })).toContain('less than 4');
  });

  it('validates numeric min/max', () => {
    expect(validateField('Age', '5', { min: 10 })).toContain('at least 10');
    expect(validateField('Age', '200', { max: 100 })).toContain('at most 100');
  });

  it('validates pattern', () => {
    const result = validateField('Zip', 'abc', {
      pattern: /^\d{5}$/,
      errorMessage: 'Invalid zip',
    });
    expect(result).toBe('Invalid zip');
  });

  it('runs custom validator', () => {
    const result = validateField('Age', '15', {
      custom: (v) => parseInt(v) < 18 ? 'Must be 18+' : null,
    });
    expect(result).toBe('Must be 18+');
  });

  it('skips validations for empty non-required fields', () => {
    expect(validateField('Code', '', { minLength: 3 })).toBeNull();
  });
});

// ── combineValidationResults ──

describe('combineValidationResults', () => {
  it('combines multiple results', () => {
    const r1 = { isValid: false, errors: { a: 'err' }, warnings: { w1: 'warn' } };
    const r2 = { isValid: true, errors: {}, warnings: {} };
    const combined = combineValidationResults(r1, r2);
    expect(combined.isValid).toBe(false);
    expect(combined.errors.a).toBe('err');
    expect(combined.warnings.w1).toBe('warn');
  });

  it('is valid when all results are valid', () => {
    const r1 = { isValid: true, errors: {}, warnings: {} };
    const r2 = { isValid: true, errors: {}, warnings: {} };
    const combined = combineValidationResults(r1, r2);
    expect(combined.isValid).toBe(true);
  });
});

// ── validateEnrollmentStep ──

describe('validateEnrollmentStep', () => {
  it('returns valid for unknown step', () => {
    const result = validateEnrollmentStep(99, {});
    expect(result.isValid).toBe(true);
  });

  it('validates step 1 required fields', () => {
    const result = validateEnrollmentStep(1, {});
    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toBeDefined();
    expect(result.errors.lastName).toBeDefined();
  });

  it('rejects future date of birth in step 1', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = validateEnrollmentStep(1, {
      firstName: 'A',
      lastName: 'B',
      dateOfBirth: future.toISOString(),
      gender: 'Male',
      assessmentDates: '2025-01-01',
      examiner: 'Dr. X',
    });
    expect(result.errors.dateOfBirth).toContain('future');
  });

  it('validates step 9 requires at least one service', () => {
    const result = validateEnrollmentStep(9, {
      oneOnOneServices: [],
      groupClassServices: [],
    });
    expect(result.errors.services).toBeDefined();
  });
});
