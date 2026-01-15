// Environment validation utility
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'DATABASE_URL',
];

const MIN_SECRET_LEN = 32;

const validateEnv = () => {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const weakSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET']
    .filter(key => (process.env[key] || '').length < MIN_SECRET_LEN);
  if (weakSecrets.length > 0) {
    throw new Error(`JWT secrets must be at least ${MIN_SECRET_LEN} characters: ${weakSecrets.join(', ')}`);
  }
};

module.exports = { validateEnv };
