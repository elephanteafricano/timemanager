// Structured logging with Pino
const pino = require('pino');

const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level: LOG_LEVEL,
  // Pretty print in dev, JSON in production
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  },
  // Redact sensitive fields
  redact: {
    paths: ['req.headers.authorization', 'password', 'password_hash', 'token', 'accessToken', 'refreshToken'],
    censor: '[REDACTED]',
  },
  // Base context
  base: {
    env: process.env.NODE_ENV,
  },
});

module.exports = logger;
