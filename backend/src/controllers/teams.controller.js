// Teams Controller
const { Team, User } = require('../models');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { findByIdOrFail, deleteResource, updateResource } = require('../utils/dbHelpers');

const listTeams = asyncHandler(async (_req, res) => {
  const teams = await Team.findAll({
    include: [{ model: User, as: 'members', attributes: { exclude: ['password_hash'] } }]
  });
  res.json(teams);
});

const getTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const team = await findByIdOrFail(Team, id, 'Team', {
    include: [{ model: User, as: 'members', attributes: { exclude: ['password_hash'] } }]
  });
  
  res.json(team);
});

const createTeam = asyncHandler(async (req, res) => {
  const { name, description, manager_id } = req.body;
  if (!name) {throw new AppError('Team name required', 400);}
  
  const team = await Team.create({ name, description, manager_id });
  res.status(201).json(team);
});

const updateTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const team = await updateResource(Team, id, req.body, 'Team');
  res.json(team);
});

const deleteTeam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteResource(Team, id, 'Team');
  res.json(result);
});

const updateTeamMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userIds } = req.body;
  
  await findByIdOrFail(Team, id, 'Team');
  
  // Update all users in userIds array to belong to this team
  if (userIds && Array.isArray(userIds)) {
    await User.update({ team_id: id }, { where: { id: userIds } });
  }
  
  res.json({ message: 'Team members updated successfully' });
});

module.exports = { listTeams, getTeam, createTeam, updateTeam, deleteTeam, updateTeamMembers };
