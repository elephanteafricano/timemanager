const { toDayKey } = require('./dateKey');
const { getWorkedSeconds } = require('./timeMath');

function parseTimeToMinutes(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const [hoursRaw, minutesRaw] = String(value).split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return null;
  }
  return (hours * 60) + minutes;
}

function normalizeTimeRule(rawRule) {
  if (!rawRule) {
    return null;
  }

  const workStartMinutes = parseTimeToMinutes(rawRule.work_start_time);
  const startGraceMinutes = Number(rawRule.start_grace_minutes);
  const standardWorkHours = Number(rawRule.standard_work_hours);

  if (!Number.isFinite(workStartMinutes)
    || !Number.isFinite(startGraceMinutes)
    || !Number.isFinite(standardWorkHours)) {
    return null;
  }

  return {
    workStartMinutes,
    startGraceMinutes,
    standardWorkSeconds: Math.max(0, Math.floor(standardWorkHours * 3600)),
  };
}

function resolveTimeRules(timeRules) {
  const teamRules = new Map();
  let defaultRule = null;

  timeRules.forEach((rawRule) => {
    const normalized = normalizeTimeRule(rawRule);
    if (!normalized) {
      return;
    }

    if (rawRule.team_id === null || rawRule.team_id === undefined) {
      if (!defaultRule) {
        defaultRule = normalized;
      }
      return;
    }

    const teamId = Number(rawRule.team_id);
    if (!Number.isFinite(teamId)) {
      return;
    }
    if (!teamRules.has(teamId)) {
      teamRules.set(teamId, normalized);
    }
  });

  return { defaultRule, teamRules };
}

function createAccumulator() {
  return {
    totalWorkedSeconds: 0,
    dailyWorkedSeconds: new Map(),
    completedShifts: 0,
    latenessCount: 0,
    overtimeSeconds: 0,
  };
}

function addClockToAccumulator(accumulator, clock, rule) {
  const workedSeconds = getWorkedSeconds(clock.clock_in, clock.clock_out);
  if (workedSeconds === null) {
    return;
  }

  const clockIn = new Date(clock.clock_in);
  accumulator.totalWorkedSeconds += workedSeconds;
  accumulator.completedShifts += 1;

  const dayKey = toDayKey(clockIn);
  accumulator.dailyWorkedSeconds.set(dayKey, (accumulator.dailyWorkedSeconds.get(dayKey) || 0) + workedSeconds);

  if (!rule) {
    return;
  }

  const arrivalMinutes = (clockIn.getHours() * 60) + clockIn.getMinutes();
  const latenessThreshold = rule.workStartMinutes + rule.startGraceMinutes;
  if (arrivalMinutes > latenessThreshold) {
    accumulator.latenessCount += 1;
  }

  accumulator.overtimeSeconds += Math.max(0, workedSeconds - rule.standardWorkSeconds);
}

function finalizeAccumulator(accumulator, prefix = '') {
  const avgWorkedSecondsPerDay = accumulator.dailyWorkedSeconds.size > 0
    ? accumulator.totalWorkedSeconds / accumulator.dailyWorkedSeconds.size
    : 0;

  const latenessRate = accumulator.completedShifts > 0
    ? (accumulator.latenessCount / accumulator.completedShifts) * 100
    : 0;

  const totalKey = prefix ? `${prefix}TotalWorkedSeconds` : 'totalWorkedSeconds';
  const avgKey = prefix ? `${prefix}AvgWorkedSecondsPerDay` : 'avgWorkedSecondsPerDay';

  return {
    [totalKey]: accumulator.totalWorkedSeconds,
    [avgKey]: avgWorkedSecondsPerDay,
    latenessCount: accumulator.latenessCount,
    latenessRate: Number(latenessRate.toFixed(2)),
    overtimeSeconds: accumulator.overtimeSeconds,
  };
}

function computeTeamKpiBreakdown({ clocks, teams = [], timeRules = [] }) {
  const { defaultRule, teamRules } = resolveTimeRules(timeRules);
  const globalAccumulator = createAccumulator();
  const teamAccumulators = new Map();

  teams.forEach((team) => {
    const teamId = Number(team.id);
    if (Number.isFinite(teamId) && !teamAccumulators.has(teamId)) {
      teamAccumulators.set(teamId, createAccumulator());
    }
  });

  clocks.forEach((clock) => {
    const rawTeamId = clock.team_id;
    const teamId = rawTeamId === null || rawTeamId === undefined ? null : Number(rawTeamId);
    const activeRule = Number.isFinite(teamId)
      ? (teamRules.get(teamId) || defaultRule)
      : defaultRule;

    addClockToAccumulator(globalAccumulator, clock, activeRule);

    if (Number.isFinite(teamId)) {
      if (!teamAccumulators.has(teamId)) {
        teamAccumulators.set(teamId, createAccumulator());
      }
      addClockToAccumulator(teamAccumulators.get(teamId), clock, activeRule);
    }
  });

  const teamNameById = new Map(
    teams
      .map((team) => [Number(team.id), team.name || `Team #${team.id}`])
      .filter(([id]) => Number.isFinite(id))
  );

  const teamBreakdown = Array.from(teamAccumulators.entries())
    .map(([teamId, accumulator]) => ({
      teamId,
      teamName: teamNameById.get(teamId) || `Team #${teamId}`,
      kpis: finalizeAccumulator(accumulator, 'team'),
    }))
    .sort((a, b) => a.teamId - b.teamId);

  return {
    kpis: finalizeAccumulator(globalAccumulator),
    teams: teamBreakdown,
  };
}

module.exports = { computeTeamKpiBreakdown };
