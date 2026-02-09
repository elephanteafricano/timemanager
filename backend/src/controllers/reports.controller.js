// Reports Controller (Raw clock data only)
const { Op } = require('sequelize');
const { Clock, User, Team } = require('../models');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const getReports = asyncHandler(async (req, res) => {
  const { userId, teamId, _team_id, startDate, endDate } = req.query;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;

  const effectiveTeamId = teamId || _team_id;

  if (!userId && !effectiveTeamId) {
    throw new AppError('userId or teamId required in query', 400);
  }

  const whereClocks = {};

  if (userId) {
    // Employees can only view their own reports
    if (requesterRole !== 'manager' && parseInt(userId) !== requesterId) {
      throw new AppError('Insufficient permissions', 403);
    }

    const user = await User.findByPk(userId);
    if (!user) {throw new AppError('User not found', 404);}

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
  }

  if (startDate || endDate) {
    whereClocks.clock_in = {};
    if (startDate) {whereClocks.clock_in[Op.gte] = new Date(startDate);}
    if (endDate) {whereClocks.clock_in[Op.lte] = new Date(endDate);}
  }

  const clocks = await Clock.findAll({ where: whereClocks, order: [['clock_in', 'ASC']] });

  res.json(clocks);
});

module.exports = { getReports };
