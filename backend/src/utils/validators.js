// Validation utilities with error handling
const { VALID_ROLES } = require('../config/roles');

const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};

const validateRequired = (data, fields) => {
  const missing = fields.filter(f => !data[f] || data[f].toString().trim() === '');
  return { valid: missing.length === 0, missing };
};

const validateRole = (role) => {
  return VALID_ROLES.includes(role);
};

module.exports = { validateEmail, validatePassword, validateRequired, validateRole };
