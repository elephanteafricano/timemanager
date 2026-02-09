// Time Record Rule Model (Work Schedule)
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimeRule = sequelize.define('TimeRule', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Default Schedule' },
  team_id: { type: DataTypes.INTEGER, allowNull: true },
  work_start_time: { type: DataTypes.TIME, allowNull: false, defaultValue: '09:00' },
  work_end_time: { type: DataTypes.TIME, allowNull: false, defaultValue: '17:00' },
  start_grace_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
  end_grace_minutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
  standard_work_hours: { type: DataTypes.DECIMAL(4, 2), allowNull: false, defaultValue: 8 },
  max_shift_hours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 24 },
}, {
  tableName: 'time_record_rules',
  underscored: true,
  timestamps: true,
});

module.exports = TimeRule;
