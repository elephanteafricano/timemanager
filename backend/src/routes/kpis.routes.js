// Routes - KPIs
const { Router } = require('express');
const { getCurrentKpis } = require('../controllers/kpis.controller');
const auth = require('../middleware/auth.middleware');

const router = Router();

router.use(auth);
router.get('/current', getCurrentKpis);

module.exports = router;
