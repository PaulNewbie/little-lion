import { describe, it, expect } from 'vitest';
import {
  hasPermission,
  canEnrollStudents,
  getDefaultPermissions,
  PERMISSIONS,
  PERMISSION_BYPASS_ROLES,
} from './permissions';

describe('hasPermission', () => {
  it('returns false for null user', () => {
    expect(hasPermission(null, PERMISSIONS.CAN_ENROLL_STUDENTS)).toBe(false);
  });

  it('returns true for super_admin regardless of permissions', () => {
    const user = { role: 'super_admin', permissions: {} };
    expect(hasPermission(user, PERMISSIONS.CAN_ENROLL_STUDENTS)).toBe(true);
  });

  it('returns true when permission is explicitly granted', () => {
    const user = {
      role: 'teacher',
      permissions: { canEnrollStudents: true },
    };
    expect(hasPermission(user, PERMISSIONS.CAN_ENROLL_STUDENTS)).toBe(true);
  });

  it('returns false when permission is not set', () => {
    const user = { role: 'teacher', permissions: {} };
    expect(hasPermission(user, PERMISSIONS.CAN_ENROLL_STUDENTS)).toBe(false);
  });

  it('returns false when permission is explicitly false', () => {
    const user = {
      role: 'admin',
      permissions: { canEnrollStudents: false },
    };
    expect(hasPermission(user, PERMISSIONS.CAN_ENROLL_STUDENTS)).toBe(false);
  });

  it('handles missing permissions object', () => {
    const user = { role: 'teacher' };
    expect(hasPermission(user, PERMISSIONS.CAN_ENROLL_STUDENTS)).toBe(false);
  });
});

describe('canEnrollStudents', () => {
  it('delegates to hasPermission', () => {
    const superAdmin = { role: 'super_admin' };
    expect(canEnrollStudents(superAdmin)).toBe(true);

    const teacher = { role: 'teacher', permissions: {} };
    expect(canEnrollStudents(teacher)).toBe(false);

    const grantedTeacher = {
      role: 'teacher',
      permissions: { canEnrollStudents: true },
    };
    expect(canEnrollStudents(grantedTeacher)).toBe(true);
  });
});

describe('getDefaultPermissions', () => {
  it('returns empty for super_admin (bypasses checks)', () => {
    expect(getDefaultPermissions('super_admin')).toEqual({});
  });

  it('returns enrollment false for teacher', () => {
    const perms = getDefaultPermissions('teacher');
    expect(perms.canEnrollStudents).toBe(false);
  });

  it('returns enrollment false for therapist', () => {
    const perms = getDefaultPermissions('therapist');
    expect(perms.canEnrollStudents).toBe(false);
  });

  it('returns enrollment false for admin', () => {
    const perms = getDefaultPermissions('admin');
    expect(perms.canEnrollStudents).toBe(false);
  });

  it('returns empty for parent', () => {
    expect(getDefaultPermissions('parent')).toEqual({});
  });
});

describe('PERMISSION_BYPASS_ROLES', () => {
  it('includes only super_admin', () => {
    expect(PERMISSION_BYPASS_ROLES).toEqual(['super_admin']);
  });
});
