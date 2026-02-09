/* global jest */
const request = require('supertest');
const express = require('express');

jest.mock('../../src/models', () => ({
  Clock: {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Team: {},
}));

jest.mock('../../src/middleware/auth.middleware', () => 
  jest.fn((req, _res, next) => {
    req.user = { id: 1, role: 'manager' };
    next();
  })
);

const { Clock, User } = require('../../src/models');
const clocksRouter = require('../../src/routes/clocks.routes');

const app = express();
app.use(express.json());
app.use('/api/clocks', clocksRouter);

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

describe('Clocks Controller Unit Tests (Mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/clocks', () => {
    it('should toggle clock in (no existing clocks)', async () => {
      Clock.findOne.mockResolvedValue(null);
      User.findByPk.mockResolvedValue({ id: 1, team_id: null });
      Clock.create.mockResolvedValue({
        id: 1,
        user_id: 1,
        team_id: null,
        clock_in: new Date(),
        clock_out: null,
      });

      const res = await request(app)
        .post('/api/clocks')
        .send({ user_id: 1 });

      expect(res.statusCode).toBe(201);
      expect(res.body.clock_in).toBeTruthy();
      expect(res.body.clock_out).toBeNull();
      expect(Clock.create).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 1 })
      );
    });

    it('should toggle clock out (existing clock in)', async () => {
      Clock.findOne.mockResolvedValue({
        id: 1,
        user_id: 1,
        clock_in: new Date(),
        clock_out: null,
        save: jest.fn().mockResolvedValue(true),
      });
      User.findByPk.mockResolvedValue({ id: 1, team_id: null });

      const res = await request(app)
        .post('/api/clocks')
        .send({ user_id: 1 });

      expect(res.statusCode).toBe(200);
      expect(res.body.clock_out).toBeTruthy();
    });

    it('should return 400 for missing user_id', async () => {
      const res = await request(app)
        .post('/api/clocks')
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toBeDefined();
    });
  });

  describe('GET /api/clocks/:userId', () => {
    it('should return user clocks', async () => {
      User.findByPk.mockResolvedValue({ id: 1 });
      Clock.findAll.mockResolvedValue([
        { id: 1, user_id: 1, clock_in: new Date(), clock_out: null },
        { id: 2, user_id: 1, clock_in: new Date(), clock_out: new Date() },
      ]);

      const res = await request(app).get('/api/clocks/1');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(Clock.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ where: { user_id: '1' } })
      );
    });

    it('should return 404 for non-existent user', async () => {
      User.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/clocks/999');

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toContain('not found');
    });
  });
});
