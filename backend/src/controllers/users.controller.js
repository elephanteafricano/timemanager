// Users Controller
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { asyncHandler, AppError } = require('../utils/errorHandler');

function sanitize(user) {
  const { _password_hash, ...safe } = user.toJSON();
  return safe;
}

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
  res.json(users);
});

const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  // Employees can only view their own profile
  if (requesterRole !== 'manager' && parseInt(id) !== requesterId) {
    throw new AppError('Insufficient permissions', 403);
  }
  
  const user = await User.findByPk(id, { attributes: { exclude: ['password_hash'] } });
  if (!user) {throw new AppError('User not found', 404);}
  
  res.json(user);
});

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, first_name, last_name, phone_number, role = 'employee', team_id } = req.body;
  
  if (!username || !email || !password || !first_name || !last_name) {
    throw new AppError('Missing required fields', 400);
  }
  
  const exists = await User.findOne({ where: { email } });
  if (exists) {throw new AppError('Email already used', 409);}
  
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username, email, password_hash: hash, first_name, last_name, phone_number, role, team_id
  });
  
  res.status(201).json(sanitize(user));
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  // Employees can only update themselves
  if (requesterRole !== 'manager' && parseInt(id) !== requesterId) {
    throw new AppError('Insufficient permissions', 403);
  }
  
  const user = await User.findByPk(id);
  if (!user) {throw new AppError('User not found', 404);}
  
  const { password, role, ...rest } = req.body;
  
  // Employees cannot change roles (even their own)
  if (role && requesterRole !== 'manager') {
    throw new AppError('Insufficient permissions', 403);
  }
  
  if (password) {
    rest.password_hash = await bcrypt.hash(password, 10);
  }
  
  if (role && requesterRole === 'manager') {
    rest.role = role;
  }
  
  await user.update(rest);
  res.json(sanitize(user));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);
  if (!user) {throw new AppError('User not found', 404);}
  
  await user.destroy();
  res.json({ message: 'User deleted successfully' });
});

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };
