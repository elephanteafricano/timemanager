// Routes - Users
const { Router } = require('express');
const { listUsers, getUser, createUser, updateUser, deleteUser } = require('../controllers/users.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');

const router = Router();

router.use(auth);
router.get('/', roleCheck(['manager']), listUsers);
router.get('/:id', getUser);
router.post('/', roleCheck(['manager']), createUser);
router.put('/:id', updateUser);
router.delete('/:id', roleCheck(['manager']), deleteUser);

module.exports = router;
