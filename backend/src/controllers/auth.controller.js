// Authentication Controller
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { validateEmail, validatePassword, validateRequired } = require('../utils/validators');
const { AppError, asyncHandler } = require('../utils/errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const ACCESS_TTL = '1h';
const REFRESH_TTL = '7d';

function signTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign({ sub: payload.sub, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TTL });
  return { accessToken, refreshToken };
}

function sanitize(user) {
  const { _password_hash, ...safe } = user.toJSON();
  return safe;
}

const register = asyncHandler(async (req, res) => {
  const { username, email, password, first_name, last_name, phone_number, role = 'employee' } = req.body;
  
  const { valid, missing } = validateRequired(req.body, ['username', 'email', 'password', 'first_name', 'last_name']);
  if (!valid) {throw new AppError(`Missing: ${missing.join(', ')}`, 400);}
  
  if (!validateEmail(email)) {throw new AppError('Invalid email format', 400);}
  if (!validatePassword(password)) {
    throw new AppError('Password: 8+ chars, 1 uppercase, 1 number', 400);
  }
  
  // Check for duplicate username or email
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {throw new AppError('Email already registered', 400);}
  
  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {throw new AppError('Username already taken', 400);}
  
  const hash = await bcrypt.hash(password, 10);
  
  try {
    const user = await User.create({
      username, email, password_hash: hash, first_name, last_name, phone_number, role
    });
    
    const tokens = signTokens({ sub: user.id, role: user.role });
    res.status(201).json({ 
      user: sanitize(user), 
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (error) {
    // Handle unique constraint violations
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Username or email already exists', 400);
    }
    throw error;
  }
});

const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {throw new AppError('Username/email and password required', 400);}
  
  // Allow login with username or email
  const user = await User.findOne({ 
    where: { 
      [require('sequelize').Op.or]: [
        { username },
        { email: username }
      ]
    }
  });
  if (!user) {throw new AppError('Invalid credentials', 401);}
  
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {throw new AppError('Invalid credentials', 401);}
  
  const tokens = signTokens({ sub: user.id, role: user.role });
  res.json({ 
    user: sanitize(user), 
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {throw new AppError('Refresh token required', 400);}
  
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_SECRET);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
  
  if (decoded.type !== 'refresh') {throw new AppError('Invalid refresh token', 400);}
  
  const user = await User.findByPk(decoded.sub);
  if (!user) {throw new AppError('User not found', 401);}
  
  const tokens = signTokens({ sub: user.id, role: user.role });
  res.json({ 
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
});

module.exports = { register, login, refresh };
