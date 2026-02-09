// Users Controller
const bcrypt = require('bcrypt');
const { User } = require('../models');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { sanitizeUser } = require('../utils/userHelpers');
const { checkUserPermission } = require('../utils/permissions');
const { findByIdOrFail, deleteResource } = require('../utils/dbHelpers');
const { USER_ROLES } = require('../config/roles');

const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
  res.json(users);
});

const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  // Employees can only view their own profile
  checkUserPermission(requesterRole, requesterId, id);
  
  const user = await findByIdOrFail(User, id, 'User', { attributes: { exclude: ['password_hash'] } });
  
  res.json(user);
});

const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, first_name, last_name, phone_number, role = USER_ROLES.EMPLOYEE, team_id } = req.body;
  
  if (!username || !email || !password) {
    throw new AppError('Missing required fields: username, email, password', 400);
  }
  
  const exists = await User.findOne({ where: { email } });
  if (exists) {throw new AppError('Email already used', 409);}
  
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    username, email, password_hash: hash, first_name: first_name || '', last_name: last_name || '', phone_number, role, team_id
  });
  
  res.status(201).json(sanitizeUser(user));
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  // Employees can only update themselves
  checkUserPermission(requesterRole, requesterId, id);
  
  const user = await findByIdOrFail(User, id, 'User');
  
  // Exclude fields that should not be updated
  const { password, role, username: _username, ...rest } = req.body;
  
  // Ensure first_name and last_name are provided
  if (!rest.first_name || rest.first_name.trim() === '') {
    throw new AppError('First name is required', 400);
  }
  if (!rest.last_name || rest.last_name.trim() === '') {
    throw new AppError('Last name is required', 400);
  }
  
  // Ensure body was provided
  if (!req.body || Object.keys(req.body).length === 0) {
    throw new AppError('Request body is required', 400);
  }
  
  // Employees cannot change roles (even their own)
  if (role && requesterRole !== USER_ROLES.MANAGER) {
    throw new AppError('Insufficient permissions', 403);
  }
  
  // Check if email is being changed and if it already exists
  if (rest.email && rest.email !== user.email) {
    const emailExists = await User.findOne({ where: { email: rest.email } });
    if (emailExists) {throw new AppError('Email already in use', 409);}
  }
  
  if (password) {
    rest.password_hash = await bcrypt.hash(password, 10);
  }
  
  if (role && requesterRole === USER_ROLES.MANAGER) {
    rest.role = role;
  }
  
  try {
    await user.update(rest);
    res.json(sanitizeUser(user));
  } catch (updateErr) {
    if (updateErr.name === 'SequelizeValidationError') {
      const errors = updateErr.errors.map(e => e.message).join(', ');
      throw new AppError(`Validation error: ${errors}`, 400);
    }
    throw updateErr;
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteResource(User, id, 'User');
  res.json(result);
});

module.exports = { listUsers, getUser, createUser, updateUser, deleteUser };
