// Clocks Controller (Time Tracking)
const { Op } = require('sequelize');
const { Clock } = require('../models');
const { asyncHandler, AppError } = require('../utils/errorHandler');

function _computeTotalHours(records) {
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

const toggleClock = asyncHandler(async (req, res) => {
  const { user_id } = req.body;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  if (!user_id) {throw new AppError('user_id required', 400);}
  
  // Employees can only clock for themselves
  if (requesterRole !== 'manager' && parseInt(user_id) !== requesterId) {
    throw new AppError('Insufficient permissions', 403);
  }
  
  const last = await Clock.findOne({
    where: { user_id },
    order: [['time', 'DESC']],
  });
  
  const nextStatus = !last || last.status === false;
  const clock = await Clock.create({
    user_id,
    status: nextStatus,
    time: new Date(),
  });
  
  res.status(201).json(clock);
});

const getUserClocks = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { start_date, end_date } = req.query;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  // Employees can only view their own clocks
  if (requesterRole !== 'manager' && parseInt(userId) !== requesterId) {
    throw new AppError('Insufficient permissions', 403);
  }
  
  // Check if user exists
  const { User } = require('../models');
  const user = await User.findByPk(userId);
  if (!user) {throw new AppError('User not found', 404);}
  
  const where = { user_id: userId };
  if (start_date || end_date) {
    where.time = {};
    if (start_date) {where.time[Op.gte] = new Date(start_date);}
    if (end_date) {where.time[Op.lte] = new Date(end_date);}
  }
  
  const clocks = await Clock.findAll({ where, order: [['time', 'ASC']] });
  
  res.json(clocks);
});

module.exports = { toggleClock, getUserClocks };
