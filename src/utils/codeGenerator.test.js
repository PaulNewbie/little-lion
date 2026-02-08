import { describe, it, expect } from 'vitest';
import {
  generateActivationCode,
  generateAdminAssistCode,
  normalizeCode,
  isValidActivationCodeFormat,
  isValidAdminCodeFormat,
  formatCodeForDisplay,
  generateSecurePassword,
} from './codeGenerator';

describe('generateActivationCode', () => {
  it('returns WORD-1234 format', () => {
    const code = generateActivationCode();
    expect(code).toMatch(/^[A-Z]{4}-\d{4}$/);
  });

  it('generates different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateActivationCode()));
    expect(codes.size).toBeGreaterThan(1);
  });

  it('uses 4-digit numbers between 1000-9999', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateActivationCode();
      const num = parseInt(code.split('-')[1]);
      expect(num).toBeGreaterThanOrEqual(1000);
      expect(num).toBeLessThanOrEqual(9999);
    }
  });
});

describe('generateAdminAssistCode', () => {
  it('returns XXX-XXX-XXX format', () => {
    const code = generateAdminAssistCode();
    expect(code).toMatch(/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/);
  });

  it('excludes confusing characters (0, O, 1, I, L)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateAdminAssistCode().replace(/-/g, '');
      expect(code).not.toMatch(/[01OIL]/);
    }
  });
});

describe('normalizeCode', () => {
  it('removes hyphens and uppercases', () => {
    expect(normalizeCode('star-1234')).toBe('STAR1234');
  });

  it('trims whitespace', () => {
    expect(normalizeCode('  LION-5678  ')).toBe('LION5678');
  });

  it('handles null/undefined', () => {
    expect(normalizeCode(null)).toBe('');
    expect(normalizeCode(undefined)).toBe('');
  });
});

describe('isValidActivationCodeFormat', () => {
  it('accepts valid WORD-1234 format', () => {
    expect(isValidActivationCodeFormat('STAR-1234')).toBe(true);
    expect(isValidActivationCodeFormat('LION-9999')).toBe(true);
  });

  it('accepts without hyphen', () => {
    expect(isValidActivationCodeFormat('STAR1234')).toBe(true);
  });

  it('accepts lowercase', () => {
    expect(isValidActivationCodeFormat('star-1234')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidActivationCodeFormat('')).toBe(false);
    expect(isValidActivationCodeFormat(null)).toBe(false);
    expect(isValidActivationCodeFormat('AB-1234')).toBe(false);
    expect(isValidActivationCodeFormat('STAR-12')).toBe(false);
    expect(isValidActivationCodeFormat('1234-STAR')).toBe(false);
  });
});

describe('isValidAdminCodeFormat', () => {
  it('accepts valid 9-char alphanumeric codes', () => {
    expect(isValidAdminCodeFormat('A7X-9K2-B4M')).toBe(true);
    expect(isValidAdminCodeFormat('ABC123DEF')).toBe(true);
  });

  it('rejects invalid formats', () => {
    expect(isValidAdminCodeFormat('')).toBe(false);
    expect(isValidAdminCodeFormat(null)).toBe(false);
    expect(isValidAdminCodeFormat('SHORT')).toBe(false);
  });
});

describe('formatCodeForDisplay', () => {
  it('formats user activation code', () => {
    expect(formatCodeForDisplay('STAR1234', 'user')).toBe('STAR-1234');
  });

  it('formats admin code', () => {
    expect(formatCodeForDisplay('A7X9K2B4M', 'admin')).toBe('A7X-9K2-B4M');
  });

  it('returns original code for wrong length', () => {
    expect(formatCodeForDisplay('SHORT', 'user')).toBe('SHORT');
    expect(formatCodeForDisplay('AB', 'admin')).toBe('AB');
  });
});

describe('generateSecurePassword', () => {
  it('generates password of requested length', () => {
    expect(generateSecurePassword(16)).toHaveLength(16);
    expect(generateSecurePassword(32)).toHaveLength(32);
  });

  it('defaults to 24 characters', () => {
    expect(generateSecurePassword()).toHaveLength(24);
  });

  it('contains mixed characters', () => {
    const pw = generateSecurePassword(100);
    expect(pw).toMatch(/[a-z]/);
    expect(pw).toMatch(/[A-Z]/);
    expect(pw).toMatch(/[0-9]/);
  });

  it('generates unique passwords', () => {
    const passwords = new Set(Array.from({ length: 10 }, () => generateSecurePassword()));
    expect(passwords.size).toBe(10);
  });
});
