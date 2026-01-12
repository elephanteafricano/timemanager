// Test setup - sets NODE_ENV to test before any imports
process.env.NODE_ENV = 'test';

const { sequelize } = require('../src/config/database');

async function setupTestDB() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error.message);
    throw error;
  }
}

async function teardownTestDB() {
  try {
    await sequelize.close();
    console.log('✅ Test database teardown complete');
  } catch (error) {
    console.error('❌ Test database teardown failed:', error.message);
  }
}

module.exports = { sequelize, setupTestDB, teardownTestDB };
