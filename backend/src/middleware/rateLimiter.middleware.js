// Rate limiting middleware
const rateLimit = require('express-rate-limit');

// Skip rate limiting in test environment
const skip = () => process.env.NODE_ENV === 'test';

// Global rate limiter: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip,
  message: { error: { status: 429, message: 'Too many requests, please try again later.' } },
  handler: (req, res) => {
    req.log.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
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
  skip,
  skipSuccessfulRequests: false,
  message: { error: { status: 429, message: 'Too many authentication attempts, please try again later.' } },
  handler: (req, res) => {
    req.log.warn({ ip: req.ip, path: req.path }, 'Auth rate limit exceeded');
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
