// Authentication Middleware
const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Authorization header required', 401));
  }
  
  const token = header.slice(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.sub, role: decoded.role };
    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired token', 401));
  }
};

module.exports = authMiddleware;
