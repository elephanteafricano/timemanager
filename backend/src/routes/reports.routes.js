// Routes - Reports (KPIs)
const { Router } = require('express');
const { getReports } = require('../controllers/reports.controller');
const auth = require('../middleware/auth.middleware');
const roleCheck = require('../middleware/roleCheck.middleware');

const router = Router();

router.use(auth);
router.get('/', getReports);

module.exports = router;
