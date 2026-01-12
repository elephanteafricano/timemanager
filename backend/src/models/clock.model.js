// Clock Model (Time Tracking)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Clock = sequelize.define('Clock', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.BOOLEAN, allowNull: false }, // true = in, false = out
}, {
  tableName: 'clocks',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Clock;
