// Model Associations
const User = require('./user.model');
const Team = require('./team.model');
const Clock = require('./clock.model');
const TimeRule = require('./timeRule.model');

// Team ↔ User associations
Team.hasMany(User, { as: 'members', foreignKey: 'team_id', onDelete: 'SET NULL' });
User.belongsTo(Team, { as: 'team', foreignKey: 'team_id' });

// Manager ↔ Team
Team.belongsTo(User, { as: 'manager', foreignKey: 'manager_id' });
User.hasMany(Team, { as: 'managed_teams', foreignKey: 'manager_id', onDelete: 'SET NULL' });

// Team ↔ TimeRule
Team.hasOne(TimeRule, { as: 'time_rule', foreignKey: 'team_id', onDelete: 'SET NULL' });
TimeRule.belongsTo(Team, { as: 'team', foreignKey: 'team_id' });

// User ↔ Clock
User.hasMany(Clock, { as: 'clocks', foreignKey: 'user_id', onDelete: 'CASCADE' });
Clock.belongsTo(User, { as: 'user', foreignKey: 'user_id' });

module.exports = { User, Team, Clock, TimeRule };
