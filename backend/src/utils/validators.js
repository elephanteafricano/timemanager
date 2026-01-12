// Validation utilities with error handling
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
  return ['employee', 'manager'].includes(role);
};

module.exports = { validateEmail, validatePassword, validateRequired, validateRole };
