// Main Server Entry Point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const router = require('./routes');
const { initDatabase } = require('./config/database');
const { AppError } = require('./utils/errorHandler');
require('./models');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api', router);

// 404 Handler
app.use((req, res, next) => {
  next(new AppError(`Not Found: ${req.originalUrl}`, 404));
});

// Global Error Handler
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log errors in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR ${status}]`, message, process.env.NODE_ENV === 'development' ? err.stack : '');
  }
  
  res.status(status).json({
    error: {
      status,
      message,
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
    console.log(`\n✅ Server running on http://localhost:${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/api/health`);
    console.log(`📚 Environment: ${process.env.NODE_ENV}\n`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
}

module.exports = app;
