// Routes - Reports (KPIs)
const { Router } = require('express');
const { getReports } = require('../controllers/reports.controller');
const auth = require('../middleware/auth.middleware');

const router = Router();

router.use(auth);
router.get('/', getReports);

module.exports = router;
