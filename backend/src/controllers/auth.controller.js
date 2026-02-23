// Authentication Controller
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { validateEmail, validatePassword, validateRequired } = require('../utils/validators');
const { AppError, asyncHandler } = require('../utils/errorHandler');
const { sanitizeUser } = require('../utils/userHelpers');
const { USER_ROLES } = require('../config/roles');
const { sendPasswordResetEmail } = require('../utils/mailer');
const { generateResetToken, hashResetToken, getResetTokenExpiry } = require('../utils/passwordReset');
const logger = require('../utils/logger');

const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'change_me_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'change_me_in_production';
const ACCESS_TTL = process.env.ACCESS_TTL || '1h';
const REFRESH_TTL = process.env.REFRESH_TTL || '7d';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
const FORGOT_PASSWORD_RESPONSE_MESSAGE = 'If an account with that email exists, a reset link has been sent.';

function signTokens(payload) {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: ACCESS_TTL });
  const refreshToken = jwt.sign({ sub: payload.sub, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TTL });
  return { accessToken, refreshToken };
}

const register = asyncHandler(async (req, res) => {
  const { username, email, password, first_name, last_name, phone_number, role = USER_ROLES.EMPLOYEE } = req.body;
  
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
      user: sanitizeUser(user), 
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
      [Op.or]: [
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
    user: sanitizeUser(user), 
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {throw new AppError('Refresh token required', 400);}
  
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
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

const forgotPassword = asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';

  if (!email || !validateEmail(email)) {
    return res.status(200).json({ message: FORGOT_PASSWORD_RESPONSE_MESSAGE });
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    return res.status(200).json({ message: FORGOT_PASSWORD_RESPONSE_MESSAGE });
  }

  const rawToken = generateResetToken();
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = getResetTokenExpiry();

  await user.update({
    reset_password_token_hash: tokenHash,
    reset_password_expires_at: expiresAt,
  });

  const resetLink = `${FRONTEND_URL}/reset-password?token=${rawToken}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      resetLink,
    });
  } catch (error) {
    logger.error({ err: error, userId: user.id }, 'Failed to send password reset email');
  }

  return res.status(200).json({ message: FORGOT_PASSWORD_RESPONSE_MESSAGE });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and newPassword are required', 400);
  }

  if (!validatePassword(newPassword)) {
    throw new AppError('Password: 8+ chars, 1 uppercase, 1 number', 400);
  }

  const tokenHash = hashResetToken(token);

  const user = await User.findOne({
    where: {
      reset_password_token_hash: tokenHash,
      reset_password_expires_at: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await user.update({
    password_hash: passwordHash,
    reset_password_token_hash: null,
    reset_password_expires_at: null,
  });

  return res.status(200).json({ message: 'Password reset successful' });
});

module.exports = { register, login, refresh, forgotPassword, resetPassword };
