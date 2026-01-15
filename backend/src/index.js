// Main Server Entry Point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const pinoHttp = require('pino-http');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger.config');
const router = require('./routes');
const { initDatabase } = require('./config/database');
const { AppError } = require('./utils/errorHandler');
const { validateEnv } = require('./utils/env');
const logger = require('./utils/logger');
require('./models');

dotenv.config();
validateEnv();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Structured logging with request correlation IDs
app.use(pinoHttp({
  logger,
  genReqId: (req) => req.headers['x-request-id'] || require('crypto').randomUUID(),
  customLogLevel: (_req, res) => {
    if (res.statusCode >= 500) {return 'error';}
    if (res.statusCode >= 400) {return 'warn';}
    return 'info';
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
}));

// Attach request ID to response headers
app.use((req, res, next) => {
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Routes
app.use('/api', router);

// Swagger API documentation
app.use('/api/swagger', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customCss: '.topbar { display: none }',
}));

// 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Not Found: ${req.originalUrl}`, 404));
});

// Global Error Handler
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Structured error logging
  req.log.error({
    err,
    status,
    requestId: req.id,
    path: req.path,
    method: req.method,
  }, message);
  
  res.status(status).json({
    error: {
      status,
      message,
      requestId: req.id,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

const PORT = process.env.PORT || 3000;

async function start() {
  if (process.env.NODE_ENV !== 'test') {
    const sync = process.env.DB_SYNC === 'true';
    await initDatabase({ sync });
  }
  
  app.listen(PORT, () => {
    logger.info({
      port: PORT,
      env: process.env.NODE_ENV,
      health: `http://localhost:${PORT}/api/health`,
      swagger: `http://localhost:${PORT}/api/swagger`,
    }, 'Server started successfully');
  });
}

if (require.main === module) {
  start().catch((err) => {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  });
}

module.exports = app;
