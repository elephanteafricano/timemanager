// Role-Based Access Control Middleware
// 
// NOTE: This role check is also performed on frontend routes (ProtectedRoute component).
// Frontend checks improve UX by preventing unauthorized navigation attempts.
// Backend checks are essential for API security - client-side checks can be bypassed.
const { AppError } = require('../utils/errorHandler');
const { VALID_ROLES } = require('../config/roles');

const roleCheck = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    
    return next();
  };
};

module.exports = roleCheck;
