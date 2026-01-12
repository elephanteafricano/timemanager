// Reports Controller (KPIs)
const { Op } = require('sequelize');
const { Clock, User, Team } = require('../models');
const { asyncHandler, AppError } = require('../utils/errorHandler');

function computeTotalHours(records) {
  const sorted = [...records].sort((a, b) => new Date(a.time) - new Date(b.time));
  let totalMs = 0;
  
  for (let i = 0; i < sorted.length; i += 2) {
    const inEvent = sorted[i];
    const outEvent = sorted[i + 1];
    if (inEvent?.status === true && outEvent?.status === false) {
      totalMs += new Date(outEvent.time) - new Date(inEvent.time);
    }
  }
  
  return parseFloat((totalMs / (1000 * 60 * 60)).toFixed(2));
}

const getReports = asyncHandler(async (req, res) => {
  const { userId, team_id, startDate, endDate } = req.query;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  if (!userId) throw new AppError('userId required in query', 400);
  
  // Employees can only view their own reports
  if (requesterRole !== 'manager' && parseInt(userId) !== requesterId) {
    throw new AppError('Insufficient permissions', 403);
  }
  
  // Check if user exists
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  
  const whereClocks = { user_id: userId };
  
  if (startDate || endDate) {
    whereClocks.time = {};
    if (startDate) whereClocks.time[Op.gte] = new Date(startDate);
    if (endDate) whereClocks.time[Op.lte] = new Date(endDate);
  }
  
  const clocks = await Clock.findAll({ where: whereClocks, order: [['time', 'ASC']] });
  
  const totalHours = computeTotalHours(clocks);
  const workDays = new Set(clocks.map(r => new Date(r.time).toISOString().slice(0, 10))).size || 1;
  const averageDailyHours = parseFloat((totalHours / workDays).toFixed(2));
  
  res.json({
    userId: parseInt(userId),
    totalHours,
    averageDailyHours,
    workDays,
    startDate: startDate || null,
    endDate: endDate || null
  });
});

module.exports = { getReports };
