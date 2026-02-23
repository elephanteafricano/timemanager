const request = require('supertest');
const app = require('../src/index');
const { setupTestDB, teardownTestDB } = require('./setup');
const { User, Team, Clock } = require('../src/models');

describe('KPIs Endpoints', () => {
  let employeeToken;
  let managerToken;
  let employeeId;
  let otherEmployeeId;
  let managerId;

  beforeAll(async () => {
    await setupTestDB();

    const employeeRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'kpi_employee',
        email: 'kpi.employee@example.com',
        password: 'Password123',
        first_name: 'Kpi',
        last_name: 'Employee',
      });
    employeeToken = employeeRes.body.accessToken;
    employeeId = employeeRes.body.user.id;

    const otherEmployeeRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'kpi_other_employee',
        email: 'kpi.other@example.com',
        password: 'Password123',
        first_name: 'Other',
        last_name: 'Employee',
      });
    otherEmployeeId = otherEmployeeRes.body.user.id;

    const managerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'kpi_manager',
        email: 'kpi.manager@example.com',
        password: 'Password123',
        first_name: 'Kpi',
        last_name: 'Manager',
      });
    managerId = managerRes.body.user.id;

    await User.update({ role: 'manager' }, { where: { id: managerId } });
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'kpi_manager',
        password: 'Password123',
      });
    managerToken = loginRes.body.accessToken;
  });

  beforeEach(async () => {
    await Clock.destroy({ where: {}, truncate: true, cascade: true });
    await Team.destroy({ where: {} });
    await User.update({ team_id: null }, { where: { id: [employeeId, otherEmployeeId] } });
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/kpis/current', () => {
    it('should return only own clocks for employee', async () => {
      await Clock.bulkCreate([
        {
          user_id: employeeId,
          team_id: null,
          clock_in: new Date('2026-01-10T09:00:00Z'),
          clock_out: new Date('2026-01-10T17:00:00Z'),
        },
        {
          user_id: otherEmployeeId,
          team_id: null,
          clock_in: new Date('2026-01-10T08:00:00Z'),
          clock_out: new Date('2026-01-10T16:00:00Z'),
        },
      ]);

      const res = await request(app)
        .get('/api/kpis/current')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].user_id).toBe(employeeId);
    });

    it('should return team clocks for manager managed teams', async () => {
      const managedTeam = await Team.create({
        name: 'KPI Team',
        manager_id: managerId,
      });

      await User.update({ team_id: managedTeam.id }, { where: { id: employeeId } });

      await Clock.bulkCreate([
        {
          user_id: employeeId,
          team_id: managedTeam.id,
          clock_in: new Date('2026-01-11T09:00:00Z'),
          clock_out: new Date('2026-01-11T17:00:00Z'),
        },
        {
          user_id: otherEmployeeId,
          team_id: null,
          clock_in: new Date('2026-01-11T08:00:00Z'),
          clock_out: new Date('2026-01-11T16:00:00Z'),
        },
      ]);

      const res = await request(app)
        .get('/api/kpis/current')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].team_id).toBe(managedTeam.id);
    });

    it('should return empty array for manager without managed teams', async () => {
      const res = await request(app)
        .get('/api/kpis/current')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get('/api/kpis/current');

      expect(res.statusCode).toBe(401);
    });
  });
});
