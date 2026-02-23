const request = require('supertest');
const app = require('../src/index');
const { setupTestDB, teardownTestDB } = require('./setup');
const { User, TimeRule } = require('../src/models');

describe('Time Rules Endpoints', () => {
  let employeeToken;
  let managerToken;
  let managerId;

  beforeAll(async () => {
    await setupTestDB();

    const employeeRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'timerule_employee',
        email: 'timerule.employee@example.com',
        password: 'Password123',
        first_name: 'TimeRule',
        last_name: 'Employee',
      });
    employeeToken = employeeRes.body.accessToken;

    const managerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'timerule_manager',
        email: 'timerule.manager@example.com',
        password: 'Password123',
        first_name: 'TimeRule',
        last_name: 'Manager',
      });
    managerId = managerRes.body.user.id;

    await User.update({ role: 'manager' }, { where: { id: managerId } });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'timerule_manager',
        password: 'Password123',
      });
    managerToken = loginRes.body.accessToken;
  });

  beforeEach(async () => {
    await TimeRule.destroy({ where: {}, truncate: true, cascade: true });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/time-rules/current', () => {
    it('should return current rule for authenticated user', async () => {
      const res = await request(app)
        .get('/api/time-rules/current')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('work_start_time');
      expect(res.body).toHaveProperty('work_end_time');
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/time-rules/current');

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/time-rules', () => {
    it('should list rules as manager', async () => {
      await TimeRule.create({ name: 'Morning Shift' });

      const res = await request(app)
        .get('/api/time-rules')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject employee access', async () => {
      const res = await request(app)
        .get('/api/time-rules')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/time-rules/:id', () => {
    it('should get a rule by id as manager', async () => {
      const rule = await TimeRule.create({ name: 'ById Rule' });

      const res = await request(app)
        .get(`/api/time-rules/${rule.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.id).toBe(rule.id);
    });

    it('should reject employee access', async () => {
      const rule = await TimeRule.create({ name: 'Forbidden Rule' });

      const res = await request(app)
        .get(`/api/time-rules/${rule.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent rule', async () => {
      const res = await request(app)
        .get('/api/time-rules/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/time-rules', () => {
    it('should create rule as manager', async () => {
      const res = await request(app)
        .post('/api/time-rules')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Custom Rule',
          work_start_time: '08:00',
          work_end_time: '16:00',
          start_grace_minutes: 10,
          end_grace_minutes: 10,
          standard_work_hours: 8,
          max_shift_hours: 12,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe('Custom Rule');
      expect(res.body.work_start_time).toContain('08:00');
    });

    it('should reject employee access', async () => {
      const res = await request(app)
        .post('/api/time-rules')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Nope' });

      expect(res.statusCode).toBe(403);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .post('/api/time-rules')
        .send({ name: 'No Auth' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('PUT /api/time-rules/:id', () => {
    it('should update rule as manager', async () => {
      const rule = await TimeRule.create({ name: 'Before Update' });

      const res = await request(app)
        .put(`/api/time-rules/${rule.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'After Update' });

      expect(res.statusCode).toBe(200);
      expect(res.body.name).toBe('After Update');
    });

    it('should reject employee access', async () => {
      const rule = await TimeRule.create({ name: 'Employee Cannot Update' });

      const res = await request(app)
        .put(`/api/time-rules/${rule.id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Blocked' });

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent rule', async () => {
      const res = await request(app)
        .put('/api/time-rules/99999')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Missing' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/time-rules/:id', () => {
    it('should delete rule as manager', async () => {
      const rule = await TimeRule.create({ name: 'Delete Me' });

      const res = await request(app)
        .delete(`/api/time-rules/${rule.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should reject employee access', async () => {
      const rule = await TimeRule.create({ name: 'Cannot Delete' });

      const res = await request(app)
        .delete(`/api/time-rules/${rule.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent rule', async () => {
      const res = await request(app)
        .delete('/api/time-rules/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
