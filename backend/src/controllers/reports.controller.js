// Reports Controller (KPI aggregation)
const { Op } = require('sequelize');
const { Clock, User, Team, TimeRule } = require('../models');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { computeTeamKpiBreakdown } = require('../utils/teamKpis');
const { checkUserPermission } = require('../utils/permissions');

function toDateOnlyString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value, endOfDay = false) {
  const source = String(value || '').slice(0, 10);
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);

  if (Number.isNaN(parsed.getTime())) {
    throw new AppError('Invalid date format. Use YYYY-MM-DD', 400);
  }

  return parsed;
}

function getLastSevenDaysRange(now = new Date()) {
  const toDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const fromDate = new Date(toDate);
  fromDate.setDate(fromDate.getDate() - 6);
  fromDate.setHours(0, 0, 0, 0);
  return { fromDate, toDate };
}

const getReports = asyncHandler(async (req, res) => {
  const { userId, teamId, _team_id } = req.query;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  let selectedUser = null;
  let scopedTeams = [];

  const effectiveTeamId = teamId || _team_id;
  const fromQuery = req.query.from || req.query.startDate;
  const toQuery = req.query.to || req.query.endDate;

  const whereClocks = {};

  if (userId) {
    // Employees can only view their own reports
    checkUserPermission(requesterRole, requesterId, userId);

    const user = await User.findByPk(userId);
    if (!user) {throw new AppError('User not found', 404);}
    selectedUser = user;

    whereClocks.user_id = userId;
  } else if (effectiveTeamId) {
    if (requesterRole !== 'manager') {
      throw new AppError('Insufficient permissions', 403);
    }

    const managedTeam = await Team.findOne({
      where: { id: effectiveTeamId, manager_id: requesterId }
    });
    if (!managedTeam) {throw new AppError('Insufficient permissions', 403);}

    whereClocks.team_id = effectiveTeamId;
    scopedTeams = [managedTeam];
  } else if (requesterRole === 'manager') {
    const managedTeams = await Team.findAll({
      where: { manager_id: requesterId },
      attributes: ['id', 'name']
    });
    const managedTeamIds = managedTeams.map((team) => team.id);
    if (managedTeamIds.length === 0) {
      const { fromDate, toDate } = getLastSevenDaysRange();
      const empty = computeTeamKpiBreakdown({ clocks: [], teams: [], timeRules: [] });
      res.json({
        range: { from: toDateOnlyString(fromDate), to: toDateOnlyString(toDate) },
        kpis: empty.kpis,
        teams: empty.teams,
      });
      return;
    }
    whereClocks.team_id = { [Op.in]: managedTeamIds };
    scopedTeams = managedTeams;
  } else {
    whereClocks.user_id = requesterId;
  }

  let fromDate;
  let toDate;

  if (!fromQuery && !toQuery) {
    ({ fromDate, toDate } = getLastSevenDaysRange());
  } else {
    fromDate = fromQuery ? parseDateOnly(fromQuery, false) : parseDateOnly(toQuery, false);
    toDate = toQuery ? parseDateOnly(toQuery, true) : parseDateOnly(fromQuery, true);
  }

  if (fromDate > toDate) {
    throw new AppError('Invalid date range: from must be before or equal to to', 400);
  }

  whereClocks.clock_in = {
    [Op.gte]: fromDate,
    [Op.lte]: toDate
  };

  const clocks = await Clock.findAll({ where: whereClocks, order: [['clock_in', 'ASC']] });
  const teamIdsFromClocks = [
    ...new Set(
      clocks
        .map((clock) => clock.team_id)
        .filter((teamKey) => teamKey !== null && teamKey !== undefined)
        .map((teamKey) => Number(teamKey))
        .filter(Number.isFinite)
    ),
  ];

  if (scopedTeams.length === 0) {
    if (selectedUser?.team_id) {
      const userTeam = await Team.findByPk(selectedUser.team_id, { attributes: ['id', 'name'] });
      if (userTeam) {
        scopedTeams = [userTeam];
      }
    } else if (teamIdsFromClocks.length > 0) {
      scopedTeams = await Team.findAll({
        where: { id: { [Op.in]: teamIdsFromClocks } },
        attributes: ['id', 'name'],
      });
    }
  }

  const scopedTeamIds = [
    ...new Set(
      scopedTeams
        .map((team) => Number(team.id))
        .filter(Number.isFinite)
    ),
  ];

  const timeRuleWhere = scopedTeamIds.length > 0
    ? {
      [Op.or]: [
        { team_id: null },
        { team_id: { [Op.in]: scopedTeamIds } },
      ],
    }
    : { team_id: null };

  const timeRules = await TimeRule.findAll({
    where: timeRuleWhere,
    order: [['created_at', 'DESC']],
  });

  const { kpis, teams } = computeTeamKpiBreakdown({
    clocks,
    teams: scopedTeams,
    timeRules,
  });

  res.json({
    range: { from: toDateOnlyString(fromDate), to: toDateOnlyString(toDate) },
    kpis,
    teams,
  });
});

module.exports = { getReports };
