const request = require('supertest');
const app = require('../src/index');
const { _sequelize, setupTestDB, teardownTestDB } = require('./setup');
const { User, Clock, Team } = require('../src/models');

describe('Clocks Endpoints', () => {
  let employeeToken, managerToken, employeeId, managerId;

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
    managerToken = mgrRes.body.accessToken;
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

  beforeEach(async () => {
    await Clock.destroy({ where: {}, truncate: true, cascade: true });
    await Team.destroy({ where: {} });
    await User.update({ team_id: null }, { where: { id: [employeeId, managerId] } });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('POST /api/clocks', () => {
    it('should clock in (first toggle)', async () => {
      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ user_id: employeeId });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.user_id).toBe(employeeId);
      expect(res.body.clock_in).toBeTruthy();
      expect(res.body.clock_out).toBeNull();
    });

    it('should clock out (second toggle)', async () => {
      await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ user_id: employeeId });

      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ user_id: employeeId });

      expect(res.statusCode).toBe(200);
      expect(res.body.clock_out).toBeTruthy();
    });

    it('should allow manager to clock for other user', async () => {
      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ user_id: employeeId });

      expect(res.statusCode).toBe(201);
      expect(res.body.user_id).toBe(employeeId);
      expect(res.body.clock_in).toBeTruthy();
    });

    it('should reject employee clocking for other user', async () => {
      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ user_id: managerId });

      expect(res.statusCode).toBe(403);
    });

    it('should reject missing user_id', async () => {
      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .post('/api/clocks')
        .send({ user_id: employeeId });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/clocks/:userId', () => {
    beforeEach(async () => {
      // Ensure some clock records exist
      await Clock.create({
        user_id: employeeId,
        team_id: null,
        clock_in: new Date(),
        clock_out: null
      });
    });

    it('should get own clocks as employee', async () => {
      const res = await request(app)
        .get(`/api/clocks/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0].user_id).toBe(employeeId);
    });

    it('should get any user clocks as manager', async () => {
      const res = await request(app)
        .get(`/api/clocks/${employeeId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should reject employee accessing other user clocks', async () => {
      const res = await request(app)
        .get(`/api/clocks/${managerId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/clocks/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/users/:id/clocks', () => {
    beforeEach(async () => {
      await Clock.create({
        user_id: employeeId,
        team_id: null,
        clock_in: new Date(),
        clock_out: null
      });
    });

    it('should get own clocks through users alias route', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeId}/clocks`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body[0]).toHaveProperty('clock_in');
      expect(res.body[0]).toHaveProperty('clock_out');
    });
  });

  describe('PUT /api/clocks/:id', () => {
    const createManagedClock = async () => {
      const team = await Team.create({
        name: 'Managed Team',
        manager_id: managerId
      });

      await User.update({ team_id: team.id }, { where: { id: employeeId } });

      const clock = await Clock.create({
        user_id: employeeId,
        team_id: team.id,
        clock_in: new Date('2026-01-03T09:00:00Z'),
        clock_out: null
      });

      return clock;
    };

    it('should update clock as manager for managed team member', async () => {
      const clock = await createManagedClock();

      const res = await request(app)
        .put(`/api/clocks/${clock.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ clock_out: '2026-01-03T17:00:00Z' });

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(clock.id);
      expect(res.body.clock_out).toBeTruthy();
    });

    it('should reject unauthorized access', async () => {
      const clock = await createManagedClock();

      const res = await request(app)
        .put(`/api/clocks/${clock.id}`)
        .send({ clock_out: '2026-01-03T17:00:00Z' });

      expect(res.statusCode).toBe(401);
    });

    it('should reject employee updating clock', async () => {
      const clock = await createManagedClock();

      const res = await request(app)
        .put(`/api/clocks/${clock.id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ clock_out: '2026-01-03T17:00:00Z' });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent clock', async () => {
      const res = await request(app)
        .put('/api/clocks/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ clock_out: '2026-01-03T17:00:00Z' });

      expect(res.statusCode).toBe(404);
    });

    it('should reject update without clock_in or clock_out', async () => {
      const clock = await createManagedClock();

      const res = await request(app)
        .put(`/api/clocks/${clock.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
    });
  });
});
