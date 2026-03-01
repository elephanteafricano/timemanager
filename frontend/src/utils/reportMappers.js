import { toValidDate } from './date';
import { toNumber, toHours } from './numberFormat';

export const toUiClock = (clock) => {
  const clockIn = clock?.clock_in ? new Date(clock.clock_in) : null;
  const clockOut = clock?.clock_out ? new Date(clock.clock_out) : null;

  const date = clockIn ? clockIn.toLocaleDateString() : '';
  const startTime = clockIn ? clockIn.toLocaleTimeString() : '';
  const endTime = clockOut ? clockOut.toLocaleTimeString() : '';
  const time = clockOut || clockIn || null;
  const status = !!(clockIn && !clockOut);

  return {
    ...clock,
    date,
    startTime,
    endTime,
    time,
    status,
  };
};

export const filterClocksByRange = (clocks, fromDate, toDate) =>
  (Array.isArray(clocks) ? clocks : []).filter((clock) => {
    const clockIn = toValidDate(clock?.clock_in);
    return clockIn && clockIn >= fromDate && clockIn <= toDate;
  });

const toHoursRounded = (secondsValue) => Number(toHours(toNumber(secondsValue)).toFixed(2));
const toPercentRounded = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(1)) : null;
};
const toOptionalHours = (secondsValue) => {
  if (secondsValue === null || secondsValue === undefined || secondsValue === '') {
    return null;
  }
  return toHoursRounded(secondsValue);
};
const toOptionalCount = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const toTrendValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return clamp(Math.round(parsed), 0, 25);
};

export const buildReportsSummaryFromResponse = (reportPayload) => {
  const reportKpis = reportPayload?.kpis || {};

  return {
    totalHours: toHoursRounded(reportKpis.totalWorkedSeconds),
    averageDailyHours: toHoursRounded(reportKpis.avgWorkedSecondsPerDay),
    workDays: toOptionalCount(reportKpis.workDays) || 0,
  };
};

export const mapUserKpisFromResponse = (reportPayload) => {
  const reportKpis = reportPayload?.kpis || {};

  return {
    totalShifts: toOptionalCount(reportKpis.totalShifts) || 0,
    averageShiftLength: toHoursRounded(reportKpis.avgWorkedSecondsPerDay),
    longestShift: toOptionalHours(reportKpis.longestShiftSeconds),
    shortestShift: toOptionalHours(reportKpis.shortestShiftSeconds),
    latenessRate: toPercentRounded(reportKpis.latenessRate),
    weeklyAverage: toOptionalHours(reportKpis.weeklyAverageSeconds),
    mostActiveDay: reportKpis.mostActiveDay || 'N/A',
    onTimeRate: toPercentRounded(reportKpis.onTimeRate),
    earlyDepartureRate: toPercentRounded(reportKpis.earlyDepartureRate),
    overtimeHours: toHoursRounded(reportKpis.overtimeSeconds),
    scheduleComplianceRate: toPercentRounded(reportKpis.scheduleComplianceRate),
    averageArrivalTime: reportKpis.averageArrivalTime || 'N/A',
    averageDepartureTime: reportKpis.averageDepartureTime || 'N/A',
    totalWorkingHours: toHoursRounded(reportKpis.totalWorkedSeconds),
    expectedHours: toOptionalHours(reportKpis.expectedSeconds),
    hoursVariance: toOptionalHours(reportKpis.hoursVarianceSeconds),
  };
};

export const buildTeamOverviewFromResponse = ({ reportPayload, users, fallbackTeamName }) => {
  const teams = Array.isArray(reportPayload?.teams) ? reportPayload.teams : [];
  const reportKpis = reportPayload?.kpis || {};

  const employeeStats = teams.map((team) => {
    const teamKpis = team?.kpis || {};
    const latenessRate = toPercentRounded(teamKpis.latenessRate) || 0;
    const latenessCount = Math.round(toNumber(teamKpis.latenessCount));
    const status = latenessRate > 20 ? 'warning' : latenessRate > 10 ? 'attention' : 'good';

    return {
      id: Number(team.teamId),
      name: team.teamName || `Team #${team.teamId}`,
      email: '-',
      totalShifts: toOptionalCount(teamKpis.totalShifts) || 0,
      lateArrivals: latenessCount,
      lateRate: latenessRate.toFixed(1),
      earlyDepartures: toOptionalCount(teamKpis.earlyDepartureCount) || 0,
      avgHours: toHours(toNumber(teamKpis.teamAvgWorkedSecondsPerDay)).toFixed(1),
      isClockedIn: false,
      status,
    };
  });

  const teamName = employeeStats.length === 1
    ? employeeStats[0].name
    : (fallbackTeamName || 'Managed Teams');

  return {
    teamName,
    employeeStats,
    globalStats: {
      totalEmployees: Array.isArray(users) ? users.length : 0,
      currentlyClockedIn: 0,
      avgLateRate: (toPercentRounded(reportKpis.latenessRate) || 0).toFixed(1),
      employeesWithIssues: employeeStats.filter((employee) => employee.status !== 'good').length,
    },
  };
};

export const buildChartDataFromResponse = (reportPayload) => {
  const reportKpis = reportPayload?.kpis || {};
  const teams = Array.isArray(reportPayload?.teams) ? reportPayload.teams : [];

  const teamHours = teams
    .map((team) => ({
      id: Number(team.teamId),
      name: team.teamName || `Team #${team.teamId}`,
      hours: Math.round(toHours(toNumber(team?.kpis?.teamTotalWorkedSeconds))),
      latenessRate: toNumber(team?.kpis?.latenessRate),
    }))
    .filter((entry) => Number.isFinite(entry.id));

  const fallbackTotalHours = Math.round(toHours(toNumber(reportKpis.totalWorkedSeconds)));
  const fallbackAvgHours = Math.round(toHours(toNumber(reportKpis.avgWorkedSecondsPerDay)));

  let monthlyHours = teamHours.slice(0, 6).map((entry) => ({
    month: entry.name.slice(0, 3).toUpperCase(),
    hours: entry.hours,
  }));
  if (monthlyHours.length === 0) {
    monthlyHours = [
      { month: 'TOT', hours: fallbackTotalHours },
      { month: 'AVG', hours: fallbackAvgHours },
    ];
  } else if (monthlyHours.length === 1) {
    monthlyHours = [...monthlyHours, { ...monthlyHours[0], month: 'AVG' }];
  }
  const maxMonthlyHours = Math.max(...monthlyHours.map((entry) => entry.hours), 1);
  monthlyHours = monthlyHours.map((entry) => ({ ...entry, maxHours: maxMonthlyHours }));

  const globalLateness = toTrendValue(reportKpis.latenessRate);
  let attendanceTrend = teamHours
    .slice(0, 6)
    .map((entry) => ({
      month: entry.name.slice(0, 3).toUpperCase(),
      actual: toTrendValue(entry.latenessRate),
      expected: globalLateness,
    }));
  if (attendanceTrend.length === 0) {
    attendanceTrend = [
      { month: 'KPI', actual: globalLateness, expected: globalLateness },
      { month: 'NOW', actual: globalLateness, expected: globalLateness },
    ];
  } else if (attendanceTrend.length === 1) {
    attendanceTrend = [...attendanceTrend, { ...attendanceTrend[0], month: 'NOW' }];
  }

  const userHoursBase = teamHours.length > 0
    ? teamHours
    : [{ id: 0, name: 'Total', hours: fallbackTotalHours }];
  const maxUserHours = Math.max(...userHoursBase.map((entry) => entry.hours), 1);
  const userHours = userHoursBase
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      hours: entry.hours,
      maxHours: maxUserHours,
    }))
    .sort((left, right) => right.hours - left.hours)
    .slice(0, 6);

  const rawProductivity = Number(reportKpis.productivityScore);
  const productivityScore = Number.isFinite(rawProductivity)
    ? clamp(Math.round(rawProductivity), 0, 100)
    : clamp(Math.round(toNumber(reportKpis.latenessRate)), 0, 100);

  return {
    monthlyHours,
    attendanceTrend,
    productivityScore,
    userHours,
  };
};
