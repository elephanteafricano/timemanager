const request = require('supertest');
const app = require('../src/index');
const { sequelize, setupTestDB, teardownTestDB } = require('./setup');
const { User } = require('../src/models');

describe('Users Endpoints', () => {
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

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/users', () => {
    it('should get all users as manager', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/users');

      expect(res.statusCode).toBe(401);
    });

    it('should reject employee access', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get own profile as employee', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('employee_user');
      expect(res.body).not.toHaveProperty('password_hash');
    });

    it('should get any user profile as manager', async () => {
      const res = await request(app)
        .get(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.username).toBe('employee_user');
    });

    it('should reject employee accessing other user profile', async () => {
      const res = await request(app)
        .get(`/api/users/${managerId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update own profile as employee', async () => {
      const res = await request(app)
        .put(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          first_name: 'UpdatedEmployee',
          phone_number: '555-1234'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.first_name).toBe('UpdatedEmployee');
      expect(res.body.phone_number).toBe('555-1234');
    });

    it('should update any user as manager', async () => {
      const res = await request(app)
        .put(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          first_name: 'ManagerUpdated',
          role: 'manager'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.first_name).toBe('ManagerUpdated');
    });

    it('should reject employee updating other user', async () => {
      const res = await request(app)
        .put(`/api/users/${managerId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ first_name: 'Hacked' });

      expect(res.statusCode).toBe(403);
    });

    it('should reject employee changing own role', async () => {
      const res = await request(app)
        .put(`/api/users/${employeeId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ role: 'manager' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as manager', async () => {
      // Create temporary user
      const tempRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'temp_user',
          email: 'temp@example.com',
          password: 'Password123',
          first_name: 'Temp',
          last_name: 'User'
        });

      const res = await request(app)
        .delete(`/api/users/${tempRes.body.user.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('deleted');
    });

    it('should reject employee deleting user', async () => {
      const res = await request(app)
        .delete(`/api/users/${managerId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .delete('/api/users/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });
  });
});
