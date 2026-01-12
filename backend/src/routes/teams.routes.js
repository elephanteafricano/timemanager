// Routes - Teams
const { Router } = require('express');
const { listTeams, getTeam, createTeam, updateTeam, deleteTeam, updateTeamMembers } = require('../controllers/teams.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');

const router = Router();

router.use(auth);
router.get('/', listTeams);
router.get('/:id', getTeam);
router.post('/', roleCheck(['manager']), createTeam);
router.put('/:id', roleCheck(['manager']), updateTeam);
router.put('/:id/members', roleCheck(['manager']), updateTeamMembers);
router.delete('/:id', roleCheck(['manager']), deleteTeam);

module.exports = router;
