const request = require('supertest');
const app = require('../src/index');
const { _sequelize, setupTestDB, teardownTestDB } = require('./setup');
const { User } = require('../src/models');

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  afterEach(async () => {
    await User.destroy({ where: {}, truncate: true, cascade: true });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'Password123',
          first_name: 'John',
          last_name: 'Doe'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.username).toBe('john_doe');
      expect(res.body.user.email).toBe('john@example.com');
      expect(res.body.user.role).toBe('employee');
      expect(res.body.user).not.toHaveProperty('password_hash');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'weak',
          first_name: 'John',
          last_name: 'Doe'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'invalid-email',
          password: 'Password123',
          first_name: 'John',
          last_name: 'Doe'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject duplicate username', async () => {
      await User.create({
        username: 'john_doe',
        email: 'existing@example.com',
        password_hash: 'hashedpass',
        first_name: 'Existing',
        last_name: 'User'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'Password123',
          first_name: 'John',
          last_name: 'Doe'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject duplicate email', async () => {
      await User.create({
        username: 'existing_user',
        email: 'john@example.com',
        password_hash: 'hashedpass',
        first_name: 'Existing',
        last_name: 'User'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'Password123',
          first_name: 'John',
          last_name: 'Doe'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com'
          // missing password, firstName, lastName
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'Password123',
          first_name: 'John',
          last_name: 'Doe'
        });
    });

    it('should login with valid credentials (username)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'john_doe',
          password: 'Password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body.user.username).toBe('john_doe');
    });

    it('should login with valid credentials (email)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'john@example.com',
          password: 'Password123'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user.email).toBe('john@example.com');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'john_doe',
          password: 'WrongPassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Password123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'john_doe'
          // missing password
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'john_doe',
          email: 'john@example.com',
          password: 'Password123',
          first_name: 'John',
          last_name: 'Doe'
        });
      refreshToken = res.body.refreshToken;
    });

    it('should refresh token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' });

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject missing refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
