// Clocks Controller (Time Tracking)
const { Op } = require('sequelize');
const { Clock, User, Team } = require('../models');
const { asyncHandler, AppError } = require('../utils/errorHandler');

const toggleClock = asyncHandler(async (req, res) => {
  const { user_id } = req.body;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;
  
  if (!user_id) {throw new AppError('user_id required', 400);}
  
  // Employees can only clock for themselves
  if (requesterRole !== 'manager' && parseInt(user_id) !== requesterId) {
    throw new AppError('Insufficient permissions', 403);
  }

  const user = await User.findByPk(user_id);
  if (!user) {throw new AppError('User not found', 404);}

  const openClock = await Clock.findOne({
    where: { user_id, clock_out: null },
    order: [['clock_in', 'DESC']],
  });

  if (openClock) {
    openClock.clock_out = new Date();
    await openClock.save();
    res.status(200).json(openClock);
    return;
  }

  const clock = await Clock.create({
    user_id,
    team_id: user.team_id || null,
    clock_in: new Date(),
    clock_out: null,
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
    where.clock_in = {};
    if (start_date) {where.clock_in[Op.gte] = new Date(start_date);}
    if (end_date) {where.clock_in[Op.lte] = new Date(end_date);}
  }
  
  const clocks = await Clock.findAll({ where, order: [['clock_in', 'ASC']] });
  
  res.json(clocks);
});

const updateClock = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const requesterId = req.user.id;
  const requesterRole = req.user.role;

  if (requesterRole !== 'manager') {
    throw new AppError('Insufficient permissions', 403);
  }

  const clock = await Clock.findByPk(id);
  if (!clock) {throw new AppError('Clock record not found', 404);}

  const user = await User.findByPk(clock.user_id);
  if (!user) {throw new AppError('User not found', 404);}
  if (!user.team_id) {throw new AppError('Insufficient permissions', 403);}

  const managedTeam = await Team.findOne({ where: { id: user.team_id, manager_id: requesterId } });
  if (!managedTeam) {throw new AppError('Insufficient permissions', 403);}

  const { clock_in, clock_out } = req.body;
  const hasClockIn = Object.prototype.hasOwnProperty.call(req.body, 'clock_in');
  const hasClockOut = Object.prototype.hasOwnProperty.call(req.body, 'clock_out');
  if (!hasClockIn && !hasClockOut) {
    throw new AppError('clock_in or clock_out required', 400);
  }

  const updates = {};
  if (hasClockIn) {
    const parsedIn = new Date(clock_in);
    if (Number.isNaN(parsedIn.getTime())) {throw new AppError('Invalid clock_in', 400);}
    updates.clock_in = parsedIn;
  }
  if (hasClockOut) {
    if (clock_out === null) {
      updates.clock_out = null;
    } else {
      const parsedOut = new Date(clock_out);
      if (Number.isNaN(parsedOut.getTime())) {throw new AppError('Invalid clock_out', 400);}
      updates.clock_out = parsedOut;
    }
  }

  const effectiveClockIn = Object.prototype.hasOwnProperty.call(updates, 'clock_in')
    ? updates.clock_in
    : clock.clock_in;
  const effectiveClockOut = Object.prototype.hasOwnProperty.call(updates, 'clock_out')
    ? updates.clock_out
    : clock.clock_out;
  if (effectiveClockIn && effectiveClockOut && effectiveClockOut < effectiveClockIn) {
    throw new AppError('clock_out must be after clock_in', 400);
  }

  // Historical integrity: overwrite timestamps only; never delete clock rows.
  await clock.update(updates);
  res.json(clock);
});

module.exports = { toggleClock, getUserClocks, updateClock };
