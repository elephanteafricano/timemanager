// Time Record Rules Controller
const { TimeRule } = require('../models');
const { asyncHandler } = require('../utils/errorHandler');
const { DEFAULT_TIME_RULES } = require('../config/timeRules');
const { findByIdOrFail, deleteResource, updateResource } = require('../utils/dbHelpers');

const DEFAULT_RULE = {
  id: null,
  name: 'Default Schedule',
  team_id: null,
  ...DEFAULT_TIME_RULES,
  source: 'fallback'
};

const getTimeRule = asyncHandler(async (req, res) => {
  const { teamId } = req.query;
  let rule = null;

  if (teamId) {
    rule = await TimeRule.findOne({ where: { team_id: teamId } });
  }

  if (!rule) {
    rule = await TimeRule.findOne({ where: { team_id: null }, order: [['created_at', 'DESC']] });
  }

  if (!rule) {
    try {
      rule = await TimeRule.create({
        name: DEFAULT_RULE.name,
        team_id: null,
        work_start_time: DEFAULT_RULE.work_start_time,
        work_end_time: DEFAULT_RULE.work_end_time,
        start_grace_minutes: DEFAULT_RULE.start_grace_minutes,
        end_grace_minutes: DEFAULT_RULE.end_grace_minutes,
        standard_work_hours: DEFAULT_RULE.standard_work_hours,
        max_shift_hours: DEFAULT_RULE.max_shift_hours,
      });
    } catch {
      res.json({ ...DEFAULT_RULE, team_id: teamId ? parseInt(teamId, 10) : null });
      return;
    }
  }

  res.json(rule);
});

const listTimeRules = asyncHandler(async (_req, res) => {
  const rules = await TimeRule.findAll({ order: [['created_at', 'DESC']] });
  res.json(rules);
});

const getTimeRuleById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await findByIdOrFail(TimeRule, id, 'Time rule');
  res.json(rule);
});

const createTimeRule = asyncHandler(async (req, res) => {
  const rule = await TimeRule.create(req.body);
  res.status(201).json(rule);
});

const updateTimeRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rule = await updateResource(TimeRule, id, req.body, 'Time rule');
  res.json(rule);
});

const deleteTimeRule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await deleteResource(TimeRule, id, 'Time rule');
  res.json(result);
});

module.exports = {
  getTimeRule,
  listTimeRules,
  getTimeRuleById,
  createTimeRule,
  updateTimeRule,
  deleteTimeRule,
};
