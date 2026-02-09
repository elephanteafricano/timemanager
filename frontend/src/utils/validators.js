// Frontend validation utilities matching backend rules
// These validations match backend/src/utils/validators.js for consistency

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validate password strength
 * Requirements: minimum 8 characters, at least one uppercase letter, at least one digit
 * @param {string} password - Password to validate
 * @returns {boolean} True if password meets strength requirements
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};

/**
 * Get password validation error message
 * @param {string} password - Password to validate
 * @returns {string|null} Error message or null if valid
 */
export const getPasswordError = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one digit';
  return null;
};

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array<string>} fields - Field names to check
 * @returns {Object} { valid: boolean, missing: Array<string> }
 */
export const validateRequired = (data, fields) => {
  const missing = fields.filter(f => !data[f] || data[f].toString().trim() === '');
  return { valid: missing.length === 0, missing };
};

/**
 * Validate role value
 * @param {string} role - Role to validate
 * @returns {boolean} True if valid role
 */
export const validateRole = (role) => {
  return ['employee', 'manager'].includes(role);
};
