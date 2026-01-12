const request = require('supertest');
const app = require('../src/index');
const { _sequelize, setupTestDB, teardownTestDB } = require('./setup');
const { User, Clock } = require('../src/models');

describe('Reports Endpoints', () => {
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

    // Create sample clock records
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    await Clock.bulkCreate([
      // Employee worked 8 hours two days ago
      { user_id: employeeId, status: true, time: new Date(twoDaysAgo.getTime()) },
      { user_id: employeeId, status: false, time: new Date(twoDaysAgo.getTime() + 8 * 60 * 60 * 1000) },
      // Employee worked 6 hours one day ago
      { user_id: employeeId, status: true, time: new Date(oneDayAgo.getTime()) },
      { user_id: employeeId, status: false, time: new Date(oneDayAgo.getTime() + 6 * 60 * 60 * 1000) },
    ]);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/reports', () => {
    it('should get own report as employee', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('userId', employeeId);
      expect(res.body).toHaveProperty('totalHours');
      expect(res.body).toHaveProperty('averageDailyHours');
      expect(res.body).toHaveProperty('workDays');
      expect(res.body.totalHours).toBeGreaterThan(0);
    });

    it('should get any user report as manager', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=${employeeId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('userId', employeeId);
      expect(res.body).toHaveProperty('totalHours');
    });

    it('should filter by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const res = await request(app)
        .get(`/api/reports?userId=${employeeId}&startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('startDate');
      expect(res.body).toHaveProperty('endDate');
    });

    it('should reject employee accessing other user report', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=${managerId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/reports?userId=99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should reject missing userId', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(400);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=${employeeId}`);

      expect(res.statusCode).toBe(401);
    });

    it('should calculate correct total hours', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      // Should be approximately 14 hours (8 + 6)
      expect(res.body.totalHours).toBeGreaterThan(13);
      expect(res.body.totalHours).toBeLessThan(15);
    });

    it('should calculate average daily hours', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.averageDailyHours).toBeGreaterThan(0);
      expect(res.body.workDays).toBeGreaterThanOrEqual(2);
    });
  });
});
