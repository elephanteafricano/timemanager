const request = require('supertest');
const app = require('../src/index');
const { _sequelize, setupTestDB, teardownTestDB } = require('./setup');
const { User, Team } = require('../src/models');

describe('Teams Endpoints', () => {
  let employeeToken, managerToken, employeeId, managerId, teamId;

  beforeAll(async () => {
    await setupTestDB();

    // Create employee
    const empRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'employee_user',
        email: 'employee@example.com',
        password: 'Password123',
        first_name: 'Employee',
        last_name: 'User'
      });
    employeeToken = empRes.body.accessToken;
    employeeId = empRes.body.user.id;

    // Create manager
    const mgrRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'manager_user',
        email: 'manager@example.com',
        password: 'Password123',
        first_name: 'Manager',
        last_name: 'User'
      });
    managerId = mgrRes.body.user.id;

    // Update manager role
    await User.update({ role: 'manager' }, { where: { id: managerId } });
    
    // Re-login to get updated token with manager role
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'manager_user',
        password: 'Password123'
      });
    managerToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/teams', () => {
    it('should create team as manager', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Engineering Team',
          description: 'Backend developers',
          manager_id: managerId
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Engineering Team');
      expect(res.body.manager_id).toBe(managerId);
      teamId = res.body.id;
    });

    it('should reject employee creating team', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          name: 'Unauthorized Team',
          manager_id: employeeId
        });

      expect(res.statusCode).toBe(403);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          description: 'Missing name'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({
          name: 'No Auth Team',
          manager_id: managerId
        });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/teams', () => {
    beforeAll(async () => {
      if (!teamId) {
        const team = await Team.create({
          name: 'Test Team',
          manager_id: managerId
        });
        teamId = team.id;
      }
    });

    it('should get all teams as manager', async () => {
      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should get teams as employee', async () => {
      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/teams');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should get team by id as manager', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('id', teamId);
      expect(res.body).toHaveProperty('name');
    });

    it('should get team by id as employee', async () => {
      const res = await request(app)
        .get(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .get('/api/teams/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team as manager', async () => {
      const res = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Updated Team Name',
          description: 'Updated description'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('Updated Team Name');
      expect(res.body.description).toBe('Updated description');
    });

    it('should reject employee updating team', async () => {
      const res = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Hacked Team' });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .put('/api/teams/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Not Found' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should delete team as manager', async () => {
      // Create temporary team
      const team = await Team.create({
        name: 'Temp Team',
        manager_id: managerId
      });

      const res = await request(app)
        .delete(`/api/teams/${team.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should reject employee deleting team', async () => {
      const res = await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .delete('/api/teams/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/teams/:id/members', () => {
    it('should update team members as manager', async () => {
      const res = await request(app)
        .put(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userIds: [employeeId]
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('updated');
    });

    it('should reject employee updating members', async () => {
      const res = await request(app)
        .put(`/api/teams/${teamId}/members`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ userIds: [employeeId] });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent team', async () => {
      const res = await request(app)
        .put('/api/teams/99999/members')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ userIds: [] });

      expect(res.statusCode).toBe(404);
    });
  });
});
