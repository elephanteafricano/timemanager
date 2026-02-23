const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/index');
const { setupTestDB, teardownTestDB } = require('./setup');
const { User, Clock, Team } = require('../src/models');

describe('Reports Endpoints', () => {
  let employeeToken;
  let managerToken;
  let employeeId;
  let secondEmployeeId;
  let managerId;
  const RANGE_FROM = '2026-01-01';
  const RANGE_TO = '2026-01-02';
  const EXPECTED_TOTAL_SECONDS = (8 * 60 * 60) + (6 * 60 * 60);
  const EXPECTED_AVG_SECONDS_PER_DAY = EXPECTED_TOTAL_SECONDS / 2;

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

    const secondEmpRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'employee_two',
        email: 'employee.two@example.com',
        password: 'Password123',
        first_name: 'Employee',
        last_name: 'Two'
      });
    secondEmployeeId = secondEmpRes.body.user.id;

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
    await User.update({ team_id: null }, { where: { id: [employeeId, secondEmployeeId] } });
    await Clock.bulkCreate([
      // Included in requested range
      { user_id: employeeId, team_id: null, clock_in: new Date('2026-01-01T09:00:00'), clock_out: new Date('2026-01-01T17:00:00') },
      { user_id: employeeId, team_id: null, clock_in: new Date('2026-01-02T10:00:00'), clock_out: new Date('2026-01-02T16:00:00') },
      // Incomplete pair (must be ignored)
      { user_id: employeeId, team_id: null, clock_in: new Date('2026-01-02T18:00:00'), clock_out: null },
      // Out of requested range
      { user_id: employeeId, team_id: null, clock_in: new Date('2026-01-10T10:00:00'), clock_out: new Date('2026-01-10T11:00:00') },
    ]);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  describe('GET /api/reports', () => {
    it('should return KPI aggregation for own report as employee', async () => {
      const res = await request(app)
        .get(`/api/reports?from=${RANGE_FROM}&to=${RANGE_TO}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(expect.objectContaining({
        range: { from: RANGE_FROM, to: RANGE_TO },
        kpis: {
          totalWorkedSeconds: EXPECTED_TOTAL_SECONDS,
          avgWorkedSecondsPerDay: EXPECTED_AVG_SECONDS_PER_DAY,
          latenessCount: 0,
          latenessRate: 0,
          overtimeSeconds: 0,
        },
        teams: [],
      }));
    });

    it('should return KPI aggregation for manager querying a user', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=${employeeId}&from=${RANGE_FROM}&to=${RANGE_TO}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.kpis.totalWorkedSeconds).toBe(EXPECTED_TOTAL_SECONDS);
      expect(res.body.kpis.avgWorkedSecondsPerDay).toBe(EXPECTED_AVG_SECONDS_PER_DAY);
      expect(Array.isArray(res.body.teams)).toBe(true);
    });

    it('should default to last 7 days when from/to are missing', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('range');
      expect(res.body).toHaveProperty('kpis');
      expect(res.body).toHaveProperty('teams');
      expect(res.body.range.from).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(res.body.range.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof res.body.kpis.totalWorkedSeconds).toBe('number');
      expect(typeof res.body.kpis.avgWorkedSecondsPerDay).toBe('number');
    });

    it('should reject employee accessing other user report', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=${managerId}&from=${RANGE_FROM}&to=${RANGE_TO}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should reject employee querying team report scope', async () => {
      const team = await Team.create({
        name: 'Unauthorized Team Query',
        manager_id: managerId,
      });

      const res = await request(app)
        .get(`/api/reports?teamId=${team.id}&from=${RANGE_FROM}&to=${RANGE_TO}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get(`/api/reports?userId=99999&from=${RANGE_FROM}&to=${RANGE_TO}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(404);
    });

    it('should reject unauthorized access', async () => {
      const res = await request(app)
        .get(`/api/reports?from=${RANGE_FROM}&to=${RANGE_TO}`);

      expect(res.statusCode).toBe(401);
    });

    it('should return per-team dynamic KPI breakdown with different team values for manager', async () => {
      const teamA = await Team.create({
        name: 'Team A',
        manager_id: managerId,
      });

      const teamB = await Team.create({
        name: 'Team B',
        manager_id: managerId,
      });

      await User.update({ team_id: teamA.id }, { where: { id: employeeId } });
      await User.update({ team_id: teamB.id }, { where: { id: secondEmployeeId } });

      await Clock.destroy({ where: {}, truncate: true, cascade: true });
      await Clock.bulkCreate([
        // Team A: 16 hours over two days
        {
          user_id: employeeId,
          team_id: teamA.id,
          clock_in: new Date('2026-01-01T09:00:00'),
          clock_out: new Date('2026-01-01T17:00:00'),
        },
        {
          user_id: employeeId,
          team_id: teamA.id,
          clock_in: new Date('2026-01-02T09:00:00'),
          clock_out: new Date('2026-01-02T17:00:00'),
        },
        // Team B: 4 hours over one day
        {
          user_id: secondEmployeeId,
          team_id: teamB.id,
          clock_in: new Date('2026-01-02T09:00:00'),
          clock_out: new Date('2026-01-02T13:00:00'),
        },
      ]);

      const res = await request(app)
        .get(`/api/reports?from=${RANGE_FROM}&to=${RANGE_TO}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.kpis.totalWorkedSeconds).toBe((16 * 60 * 60) + (4 * 60 * 60));
      expect(Array.isArray(res.body.teams)).toBe(true);
      expect(res.body.teams).toHaveLength(2);

      const teamAResult = res.body.teams.find((entry) => entry.teamId === teamA.id);
      const teamBResult = res.body.teams.find((entry) => entry.teamId === teamB.id);

      expect(teamAResult).toBeDefined();
      expect(teamBResult).toBeDefined();

      expect(teamAResult.kpis.teamTotalWorkedSeconds).toBe(16 * 60 * 60);
      expect(teamAResult.kpis.teamAvgWorkedSecondsPerDay).toBe(8 * 60 * 60);
      expect(teamBResult.kpis.teamTotalWorkedSeconds).toBe(4 * 60 * 60);
      expect(teamBResult.kpis.teamAvgWorkedSecondsPerDay).toBe(4 * 60 * 60);
      expect(teamAResult.kpis.teamTotalWorkedSeconds).toBeGreaterThan(teamBResult.kpis.teamTotalWorkedSeconds);
    });
  });

  describe('KPI persistence guard', () => {
    it('should not define a Sequelize model for persisted KPI values', () => {
      const modelsDir = path.resolve(process.cwd(), 'src/models');
      const modelFiles = fs.readdirSync(modelsDir);
      const kpiModelFiles = modelFiles.filter((filename) => /kpi/i.test(filename));

      expect(kpiModelFiles).toEqual([]);
    });
  });
});
