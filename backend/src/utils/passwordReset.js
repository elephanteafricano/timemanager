const crypto = require('crypto');

const RESET_TOKEN_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30);

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

const hashResetToken = (token) => crypto.createHash('sha256').update(String(token)).digest('hex');

const getResetTokenExpiry = (baseDate = new Date()) => {
  const expiresAt = new Date(baseDate);
  expiresAt.setMinutes(expiresAt.getMinutes() + RESET_TOKEN_TTL_MINUTES);
  return expiresAt;
};

module.exports = {
  generateResetToken,
  hashResetToken,
  getResetTokenExpiry,
};
