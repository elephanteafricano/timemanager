// Routes - Time Record Rules
const { Router } = require('express');
const {
	getTimeRule,
	listTimeRules,
	getTimeRuleById,
	createTimeRule,
	updateTimeRule,
	deleteTimeRule,
} = require('../controllers/timeRules.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const { USER_ROLES } = require('../config/roles');

const router = Router();

router.use(auth);
// Current effective rule (team-aware)
router.get('/current', getTimeRule);

// Admin CRUD
router.get('/', roleCheck([USER_ROLES.MANAGER]), listTimeRules);
router.get('/:id', roleCheck([USER_ROLES.MANAGER]), getTimeRuleById);
router.post('/', roleCheck([USER_ROLES.MANAGER]), createTimeRule);
router.put('/:id', roleCheck([USER_ROLES.MANAGER]), updateTimeRule);
router.delete('/:id', roleCheck([USER_ROLES.MANAGER]), deleteTimeRule);

module.exports = router;
