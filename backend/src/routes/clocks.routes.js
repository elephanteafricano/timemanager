// Routes - Clocks (Time Tracking)
const { Router } = require('express');
const { toggleClock, getUserClocks } = require('../controllers/clocks.controller');
const auth = require('../middleware/auth.middleware');

const router = Router();

router.use(auth);
router.post('/', toggleClock);
router.get('/:userId', getUserClocks);

module.exports = router;
