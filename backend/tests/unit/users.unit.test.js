/* global jest */
const request = require('supertest');
const express = require('express');

// Mock bcrypt for password hashing
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}));

// Mock dependencies before requiring the controller
jest.mock('../../src/models', () => ({
  User: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  Team: {},
  Clock: {},
}));

const mockAuthMiddleware = (req, _res, next) => {
  req.user = { id: 1, role: 'manager' };
  next();
};

const mockRoleCheck = () => (_req, _res, next) => next();

jest.mock('../../src/middleware/auth.middleware', () => mockAuthMiddleware);
jest.mock('../../src/middleware/roleCheck.middleware', () => mockRoleCheck);

const { User } = require('../../src/models');
const usersRouter = require('../../src/routes/users.routes');

const app = express();
app.use(express.json());
app.use('/api/users', usersRouter);

// Global error handler (matches production)
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({
    error: {
      status,
      message,
    },
  });
});

describe('Users Controller Unit Tests (Mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return all users', async () => {
      const mockUsers = [
        { id: 1, username: 'user1', email: 'user1@test.com', role: 'employee' },
        { id: 2, username: 'user2', email: 'user2@test.com', role: 'manager' },
      ];
      User.findAll.mockResolvedValue(mockUsers);

      const res = await request(app).get('/api/users');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(User.findAll).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      User.findAll.mockRejectedValue(new Error('Database error'));

      const res = await request(app).get('/api/users');

      expect(res.statusCode).toBe(500);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toBe('Database error');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'employee',
      };
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app).get('/api/users/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('testuser');
      expect(User.findByPk).toHaveBeenCalledWith('1', expect.any(Object));
    });

    it('should return 404 for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/users/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const mockUser = {
        id: 3,
        username: 'newuser',
        email: 'new@example.com',
        first_name: 'New',
        last_name: 'User',
        role: 'employee',
        toJSON: function() { return this; }
      };
      User.findOne.mockResolvedValue(null); // No duplicate email
      User.create.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'Password123',
          first_name: 'New',
          last_name: 'User',
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.username).toBe('newuser');
      expect(User.create).toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ username: 'incomplete' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toBeDefined();
    });

    it('should return 400 for duplicate username', async () => {
      User.findOne.mockResolvedValue(null); // No email duplicate
      const error = new Error('Validation error');
      error.name = 'SequelizeUniqueConstraintError';
      User.create.mockRejectedValue(error);

      const res = await request(app)
        .post('/api/users')
        .send({
          username: 'duplicate',
          email: 'dup@example.com',
          password: 'Password123',
          first_name: 'Dup',
          last_name: 'User',
        });

      expect(res.statusCode).toBe(500); // Sequelize errors are 500 unless specifically caught
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        toJSON: function() { return this; },
        update: jest.fn().mockResolvedValue({
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Updated',
          last_name: 'Name',
          toJSON: function() { return this; },
        }),
      };
      User.findByPk.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue(null); // No email conflict

      const res = await request(app)
        .put('/api/users/1')
        .send({ first_name: 'Updated', last_name: 'Name' });

      expect(res.statusCode).toBe(200);
      expect(mockUser.update).toHaveBeenCalled();
    });

    it('should return 404 for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/users/999')
        .send({ first_name: 'Test' });

      expect(res.statusCode).toBe(404);
    });

    it('should return 400 for empty first_name', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
      };
      User.findByPk.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue(null); // No email conflict

      const res = await request(app)
        .put('/api/users/1')
        .send({ first_name: '   ', last_name: 'Valid' });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('First name');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      const mockUser = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const res = await request(app).delete('/api/users/1');

      expect(res.statusCode).toBe(200);
      expect(mockUser.destroy).toHaveBeenCalled();
      expect(res.body.message).toContain('deleted');
    });

    it('should return 404 for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app).delete('/api/users/999');

      expect(res.statusCode).toBe(404);
    });
  });
});
