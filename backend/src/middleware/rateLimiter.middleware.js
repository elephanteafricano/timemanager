// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const disabled = process.env.DISABLE_RATE_LIMIT === 'true';
const passthroughLimiter = (_req, _res, next) => next();

if (isDev || disabled) {
  module.exports = {
    globalLimiter: passthroughLimiter,
    authLimiter: passthroughLimiter,
  };
} else {
  const skipInTest = () => isTest;

  // Global rate limiter: 100 requests per 15 minutes per IP
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    message: { error: { status: 429, message: 'Too many requests, please try again later.' } },
    handler: (req, res) => {
      logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
      res.status(429).json({ 
        error: { 
          status: 429, 
          message: 'Too many requests, please try again later.', 
          requestId: req.id 
        } 
      });
    },
  });

  // Stricter rate limiter for auth endpoints: 10 requests per 15 minutes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    skipSuccessfulRequests: false,
    message: { error: { status: 429, message: 'Too many authentication attempts, please try again later.' } },
    handler: (req, res) => {
      logger.warn({ ip: req.ip, path: req.path }, 'Auth rate limit exceeded');
      res.status(429).json({ 
        error: { 
          status: 429, 
          message: 'Too many authentication attempts, please try again later.', 
          requestId: req.id 
        } 
      });
    },
  });

  module.exports = { globalLimiter, authLimiter };
}
