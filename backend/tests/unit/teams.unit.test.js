/* global jest */
const request = require('supertest');
const express = require('express');

jest.mock('../../src/models', () => ({
  Team: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  User: {
    update: jest.fn(),
  },
  Clock: {},
}));

jest.mock('../../src/middleware/auth.middleware', () => 
  jest.fn((req, _res, next) => {
    req.user = { id: 1, role: 'manager' };
    next();
  })
);

jest.mock('../../src/middleware/roleCheck.middleware', () => 
  jest.fn(() => (_req, _res, next) => next())
);

const { Team } = require('../../src/models');
const teamsRouter = require('../../src/routes/teams.routes');

const app = express();
app.use(express.json());
app.use('/api/teams', teamsRouter);

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

describe('Teams Controller Unit Tests (Mocked)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/teams', () => {
    it('should return all teams', async () => {
      const mockTeams = [
        { id: 1, name: 'Engineering', description: 'Dev team', manager_id: 1 },
        { id: 2, name: 'Marketing', description: 'Marketing team', manager_id: 2 },
      ];
      Team.findAll.mockResolvedValue(mockTeams);

      const res = await request(app).get('/api/teams');

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(Team.findAll).toHaveBeenCalled();
    });
  });

  describe('POST /api/teams', () => {
    it('should create a team successfully', async () => {
      const mockTeam = {
        id: 1,
        name: 'New Team',
        description: 'Test team',
        manager_id: 1,
      };
      Team.create.mockResolvedValue(mockTeam);

      const res = await request(app)
        .post('/api/teams')
        .send({
          name: 'New Team',
          description: 'Test team',
          manager_id: 1,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('New Team');
      expect(Team.create).toHaveBeenCalled();
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({ description: 'No name', manager_id: 1 });

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.message).toBeDefined();
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should return team by id', async () => {
      const mockTeam = {
        id: 1,
        name: 'Engineering',
        description: 'Dev team',
        manager_id: 1,
        users: [],
      };
      Team.findByPk.mockResolvedValue(mockTeam);

      const res = await request(app).get('/api/teams/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Engineering');
    });

    it('should return 404 for non-existent team', async () => {
      Team.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/api/teams/999');

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team successfully', async () => {
      const mockTeam = {
        id: 1,
        name: 'Old Name',
        description: 'Old desc',
        manager_id: 1,
        update: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Updated Name',
          description: 'Updated desc',
          manager_id: 1,
        }),
      };
      Team.findByPk.mockResolvedValue(mockTeam);

      const res = await request(app)
        .put('/api/teams/1')
        .send({ name: 'Updated Name', description: 'Updated desc' });

      expect(res.statusCode).toBe(200);
      expect(mockTeam.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete team successfully', async () => {
      const mockTeam = {
        id: 1,
        destroy: jest.fn().mockResolvedValue(true),
      };
      Team.findByPk.mockResolvedValue(mockTeam);

      const res = await request(app).delete('/api/teams/1');

      expect(res.statusCode).toBe(200);
      expect(mockTeam.destroy).toHaveBeenCalled();
    });
  });

  describe('PUT /api/teams/:id/members', () => {
    it('should update team members successfully', async () => {
      const mockTeam = {
        id: 1,
      };
      const { User } = require('../../src/models');
      Team.findByPk.mockResolvedValue(mockTeam);
      User.update.mockResolvedValue([3]); // Returns number of rows updated

      const res = await request(app)
        .put('/api/teams/1/members')
        .send({ userIds: [1, 2, 3] });

      expect(res.statusCode).toBe(200);
      expect(User.update).toHaveBeenCalledWith(
        { team_id: '1' },
        { where: { id: [1, 2, 3] } }
      );
    });

    it('should return 404 for non-existent team', async () => {
      Team.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/teams/999/members')
        .send({ userIds: [1] });

      expect(res.statusCode).toBe(404);
    });
  });
});
