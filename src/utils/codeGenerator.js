// src/utils/codeGenerator.js

/**
 * Friendly word list for activation codes
 * Words are short, easy to spell, and easy to say aloud
 */
const WORD_LIST = [
  'STAR', 'BLUE', 'MOON', 'RAIN', 'ROSE', 'TREE', 'BIRD', 'FISH',
  'BEAR', 'LION', 'WOLF', 'FROG', 'DUCK', 'LEAF', 'SNOW', 'WIND',
  'GOLD', 'RUBY', 'JADE', 'FIRE', 'WAVE', 'ROCK', 'SAND', 'PINE',
  'DOVE', 'HAWK', 'DEER', 'LAKE', 'HILL', 'PEAR', 'LIME', 'MINT',
  'SAGE', 'IRIS', 'LILY', 'PALM', 'FERN', 'VINE', 'DAWN', 'DUSK',
  'GLOW', 'RAYS', 'PEAK', 'COVE', 'GLEN', 'VALE', 'WOOD', 'REEF'
];

/**
 * Characters for admin-assist codes (excludes confusing chars: 0, O, 1, I, L)
 */
const ADMIN_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * Generate a user-friendly activation code
 * Format: WORD-1234 (e.g., STAR-7842)
 * @returns {string} Activation code
 */
export function generateActivationCode() {
  const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
  const numbers = String(Math.floor(1000 + Math.random() * 9000)); // 4 digits, 1000-9999
  return `${word}-${numbers}`;
}

/**
 * Generate a short-lived admin-assist code
 * Format: XXX-XXX-XXX (e.g., A7X-9K2-B4M)
 * @returns {string} Admin assist code
 */
export function generateAdminAssistCode() {
  let code = '';
  for (let i = 0; i < 9; i++) {
    code += ADMIN_CODE_CHARS[Math.floor(Math.random() * ADMIN_CODE_CHARS.length)];
  }
  return `${code.slice(0, 3)}-${code.slice(3, 6)}-${code.slice(6, 9)}`;
}

/**
 * Normalize an activation code for comparison
 * Removes hyphens, converts to uppercase
 * @param {string} code - The code to normalize
 * @returns {string} Normalized code
 */
export function normalizeCode(code) {
  if (!code) return '';
  return code.replace(/-/g, '').toUpperCase().trim();
}

/**
 * Validate activation code format
 * @param {string} code - The code to validate
 * @returns {boolean} Whether the code is valid format
 */
export function isValidActivationCodeFormat(code) {
  if (!code) return false;
  const normalized = normalizeCode(code);
  // Should be 8 characters: 4 letters + 4 numbers
  return /^[A-Z]{4}[0-9]{4}$/.test(normalized);
}

/**
 * Validate admin-assist code format
 * @param {string} code - The code to validate
 * @returns {boolean} Whether the code is valid format
 */
export function isValidAdminCodeFormat(code) {
  if (!code) return false;
  const normalized = normalizeCode(code);
  // Should be 9 alphanumeric characters
  return /^[A-Z0-9]{9}$/.test(normalized);
}

/**
 * Format code for display (add hyphens back)
 * @param {string} code - The code to format
 * @param {string} type - 'user' or 'admin'
 * @returns {string} Formatted code
 */
export function formatCodeForDisplay(code, type = 'user') {
  const normalized = normalizeCode(code);
  if (type === 'admin' && normalized.length === 9) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6, 9)}`;
  }
  if (type === 'user' && normalized.length === 8) {
    return `${normalized.slice(0, 4)}-${normalized.slice(4, 8)}`;
  }
  return code;
}

/**
 * Generate a secure random temporary password
 * This is used internally and never shown to users
 * @param {number} length - Password length
 * @returns {string} Random password
 */
export function generateSecurePassword(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export default {
  generateActivationCode,
  generateAdminAssistCode,
  normalizeCode,
  isValidActivationCodeFormat,
  isValidAdminCodeFormat,
  formatCodeForDisplay,
  generateSecurePassword
};