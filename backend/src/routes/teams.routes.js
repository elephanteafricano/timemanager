// Routes - Teams
const { Router } = require('express');
const { listTeams, getTeam, createTeam, updateTeam, deleteTeam, updateTeamMembers } = require('../controllers/teams.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const { USER_ROLES } = require('../config/roles');

const router = Router();

router.use(auth);
router.get('/', listTeams);
router.get('/:id', getTeam);
router.post('/', roleCheck([USER_ROLES.MANAGER]), createTeam);
router.put('/:id', roleCheck([USER_ROLES.MANAGER]), updateTeam);
router.put('/:id/members', roleCheck([USER_ROLES.MANAGER]), updateTeamMembers);
router.delete('/:id', roleCheck([USER_ROLES.MANAGER]), deleteTeam);

module.exports = router;
