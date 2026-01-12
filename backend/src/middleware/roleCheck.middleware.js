// Role-Based Access Control Middleware
const { AppError } = require('../utils/errorHandler');

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
