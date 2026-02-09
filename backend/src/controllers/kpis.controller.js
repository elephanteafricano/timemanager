// KPIs Controller (Raw clock data only)
const { Op } = require('sequelize');
const { Clock, Team } = require('../models');
const { asyncHandler } = require('../utils/errorHandler');
const { USER_ROLES } = require('../config/roles');

const getCurrentKpis = asyncHandler(async (req, res) => {
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  const { startDate, endDate } = req.query;

  const where = {};

  if (requesterRole === USER_ROLES.MANAGER) {
    const teams = await Team.findAll({
      where: { manager_id: requesterId },
      attributes: ['id'],
    });
    const teamIds = teams.map((team) => team.id);
    if (teamIds.length === 0) {
      res.json([]);
      return;
    }
    where.team_id = { [Op.in]: teamIds };
  } else {
    where.user_id = requesterId;
  }

  if (startDate || endDate) {
    where.clock_in = {};
    if (startDate) {where.clock_in[Op.gte] = new Date(startDate);}
    if (endDate) {where.clock_in[Op.lte] = new Date(endDate);}
  }

  const clocks = await Clock.findAll({ where, order: [['clock_in', 'ASC']] });
  res.json(clocks);
});

module.exports = { getCurrentKpis };
