// User utility functions

/**
 * Remove password_hash from user object for safe API responses
 * @param {Object} user - Sequelize user instance
 * @returns {Object} Sanitized user object
 */
function sanitizeUser(user) {
  const { password_hash, ...safe } = user.toJSON();
  return safe;
}

module.exports = { sanitizeUser };
