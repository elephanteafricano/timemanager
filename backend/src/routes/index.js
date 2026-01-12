// Main Router - Combines all routes
const { Router } = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const teamsRoutes = require('./teams.routes');
const clocksRoutes = require('./clocks.routes');
const reportsRoutes = require('./reports.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/teams', teamsRoutes);
router.use('/clocks', clocksRoutes);
router.use('/reports', reportsRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'timemanager-backend', timestamp: new Date().toISOString() });
});

module.exports = router;
