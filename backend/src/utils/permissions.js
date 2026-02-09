// Permission utility functions
const { AppError } = require('./errorHandler');
const { USER_ROLES } = require('../config/roles');

/**
 * Check if user can access resource (managers can access all, employees only their own)
 * 
 * NOTE: This permission check is duplicated on the frontend for UX optimization.
 * Frontend checks prevent unnecessary API calls and provide instant feedback.
 * Backend checks are mandatory for security - never trust client-side validation.
 * 
 * @param {string} requesterRole - Role of the requesting user
 * @param {number} requesterId - ID of the requesting user
 * @param {number} resourceUserId - ID of the user/resource being accessed
 * @throws {AppError} If permission denied
 */
function checkUserPermission(requesterRole, requesterId, resourceUserId) {
  if (requesterRole !== USER_ROLES.MANAGER && parseInt(resourceUserId) !== requesterId) {
    throw new AppError('Insufficient permissions', 403);
  }
}

module.exports = { checkUserPermission };
