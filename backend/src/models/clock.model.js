// Clock Model (Time Tracking)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Clock = sequelize.define('Clock', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  team_id: { type: DataTypes.INTEGER, allowNull: true },
  clock_in: { type: DataTypes.DATE, allowNull: false },
  clock_out: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'clocks',
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Clock;
