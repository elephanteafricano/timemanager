// Database configuration
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const databaseUrl = process.env.DATABASE_URL || 'postgresql://admin:secret@localhost:5432/timemanager';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: { max: 5, min: 0, idle: 10000 }
});

async function initDatabase({ sync = false } = {}) {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    if (sync) {
      await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
      console.log('✅ Database synced');
    }
  } catch (err) {
    console.error('❌ Unable to connect to database:', err.message);
    throw err;
  }
}

module.exports = { sequelize, initDatabase };
