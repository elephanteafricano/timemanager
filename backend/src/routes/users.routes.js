// Routes - Users
const { Router } = require('express');
const { listUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/users.controller');
const { getUserClocks } = require('../controllers/clocks.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');
const { USER_ROLES } = require('../config/roles');

const router = Router();

router.use(auth);
router.get('/', roleCheck([USER_ROLES.MANAGER]), listUsers);
router.get('/:id/clocks', (req, res, next) => {
  req.params.userId = req.params.id;
  return getUserClocks(req, res, next);
});
router.get('/:id', getUser);
router.post('/', roleCheck([USER_ROLES.MANAGER]), createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
