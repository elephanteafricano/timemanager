// User Model
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  first_name: { type: DataTypes.STRING, allowNull: false },
  last_name: { type: DataTypes.STRING, allowNull: false },
  phone_number: { type: DataTypes.STRING },
  role: { type: DataTypes.ENUM('employee', 'manager'), defaultValue: 'employee', allowNull: false },
}, {
  tableName: 'users',
  underscored: true,
  timestamps: true,
});

module.exports = User;
