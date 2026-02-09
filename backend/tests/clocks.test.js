const request = require('supertest');
const app = require('../src/index');
const { _sequelize, setupTestDB, teardownTestDB } = require('./setup');
const { User, Clock } = require('../src/models');

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
});
