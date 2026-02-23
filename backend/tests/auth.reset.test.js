/* global jest */
jest.mock('../src/utils/passwordReset', () => {
  const actual = jest.requireActual('../src/utils/passwordReset');
  return {
    ...actual,
    generateResetToken: jest.fn(() => 'fixed-reset-token-for-tests'),
  };
});

jest.mock('../src/utils/mailer', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}));

const request = require('supertest');
const app = require('../src/index');
const { setupTestDB, teardownTestDB } = require('./setup');
const { User } = require('../src/models');
const { hashResetToken } = require('../src/utils/passwordReset');
const { sendPasswordResetEmail } = require('../src/utils/mailer');

describe('Password Reset Endpoints', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
    jest.clearAllMocks();
  });

  const registerUser = async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'john_doe',
        email: 'john@example.com',
        password: 'Password123',
        first_name: 'John',
        last_name: 'Doe',
      });
  };

  describe('POST /api/auth/forgot-password', () => {
    it('should return 200 and persist reset token hash for existing email', async () => {
      await registerUser();

      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'john@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/If an account with that email exists/i);

      const user = await User.findOne({ where: { email: 'john@example.com' } });
      expect(user.reset_password_token_hash).toBe(hashResetToken('fixed-reset-token-for-tests'));
      expect(user.reset_password_expires_at).toBeTruthy();

      expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(expect.objectContaining({
        to: 'john@example.com',
        resetLink: expect.stringContaining('/reset-password?token=fixed-reset-token-for-tests'),
      }));
    });

    it('should return 200 for unknown email without leaking account existence', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toMatch(/If an account with that email exists/i);
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with a valid token and allow login with new password', async () => {
      await registerUser();

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'john@example.com' });

      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'fixed-reset-token-for-tests',
          newPassword: 'NewPassword123',
        });

      expect(resetRes.statusCode).toBe(200);
      expect(resetRes.body.message).toMatch(/Password reset successful/i);

      const oldLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'john_doe', password: 'Password123' });
      expect(oldLoginRes.statusCode).toBe(401);

      const newLoginRes = await request(app)
        .post('/api/auth/login')
        .send({ username: 'john_doe', password: 'NewPassword123' });
      expect(newLoginRes.statusCode).toBe(200);
      expect(newLoginRes.body).toHaveProperty('accessToken');
    });

    it('should reject invalid reset token', async () => {
      await registerUser();

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'NewPassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toMatch(/Invalid or expired reset token/i);
    });

    it('should reject expired reset token', async () => {
      await registerUser();

      await User.update({
        reset_password_token_hash: hashResetToken('expired-token-for-tests'),
        reset_password_expires_at: new Date(Date.now() - 60000),
      }, {
        where: { email: 'john@example.com' },
      });

      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'expired-token-for-tests',
          newPassword: 'NewPassword123',
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.error.message).toMatch(/Invalid or expired reset token/i);
    });
  });
});
