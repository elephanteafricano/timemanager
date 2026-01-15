// Database configuration
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://admin:secret@localhost:5432/timemanager';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug({ sql: msg }, 'Database query') : false,
  pool: { max: 5, min: 0, idle: 10000 }
});

async function initDatabase({ sync = false } = {}) {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    if (sync) {
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      logger.info('Database synced');
    }
  } catch (err) {
    logger.error({ err }, 'Unable to connect to database');
    throw err;
  }
}

module.exports = { sequelize, initDatabase };
