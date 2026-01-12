// Team Model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define('Team', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  manager_id: { type: DataTypes.INTEGER },
}, {
  tableName: 'teams',
  underscored: true,
  timestamps: true,
});

module.exports = Team;
