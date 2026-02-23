import { toValidDate } from './date';
import { toDateOnlyString } from './dateFormat';
import { toNumber, toHours } from './numberFormat';

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

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

const getWorkedSeconds = (clock) => {
  const clockIn = toValidDate(clock?.clock_in);
  const clockOut = toValidDate(clock?.clock_out);
  if (!clockIn || !clockOut || clockOut <= clockIn) return 0;
  return Math.floor((clockOut - clockIn) / 1000);
};

export const buildReportsSummaryFromResponse = (reportPayload) => {
  const reportKpis = reportPayload?.kpis || {};
  const totalWorkedSeconds = toNumber(reportKpis.totalWorkedSeconds);
  const avgWorkedSecondsPerDay = toNumber(reportKpis.avgWorkedSecondsPerDay);
  const workDays = avgWorkedSecondsPerDay > 0
    ? totalWorkedSeconds / avgWorkedSecondsPerDay
    : 0;

  return {
    totalHours: Number(toHours(totalWorkedSeconds).toFixed(2)),
    averageDailyHours: Number(toHours(avgWorkedSecondsPerDay).toFixed(2)),
    workDays: Math.round(workDays),
  };
};

export const mapUserKpisFromResponse = (reportPayload) => {
  const reportKpis = reportPayload?.kpis || {};
  const totalWorkedSeconds = toNumber(reportKpis.totalWorkedSeconds);
  const avgWorkedSecondsPerDay = toNumber(reportKpis.avgWorkedSecondsPerDay);
  const latenessRate = toNumber(reportKpis.latenessRate);
  const overtimeSeconds = toNumber(reportKpis.overtimeSeconds);
  const totalHours = toHours(totalWorkedSeconds);
  const averageDailyHours = toHours(avgWorkedSecondsPerDay);
  const workDays = avgWorkedSecondsPerDay > 0
    ? totalWorkedSeconds / avgWorkedSecondsPerDay
    : 0;
  const expectedHours = workDays * 8;
  const onTimeRate = Math.max(0, 100 - latenessRate);

  return {
    totalShifts: Math.round(workDays),
    averageShiftLength: Number(averageDailyHours.toFixed(2)),
    longestShift: 0,
    shortestShift: 0,
    latenessRate: Number(latenessRate.toFixed(1)),
    weeklyAverage: Number((averageDailyHours * 5).toFixed(2)),
    mostActiveDay: 'N/A',
    onTimeRate: Number(onTimeRate.toFixed(1)),
    earlyDepartureRate: 0,
    overtimeHours: Number(toHours(overtimeSeconds).toFixed(2)),
    scheduleComplianceRate: Number(onTimeRate.toFixed(1)),
    averageArrivalTime: 'N/A',
    averageDepartureTime: 'N/A',
    totalWorkingHours: Number(totalHours.toFixed(2)),
    expectedHours: Number(expectedHours.toFixed(2)),
    hoursVariance: Number((totalHours - expectedHours).toFixed(2)),
  };
};

export const buildTeamOverviewFromResponse = ({ reportPayload, users, clocks, fallbackTeamName }) => {
  const teams = Array.isArray(reportPayload?.teams) ? reportPayload.teams : [];
  const openClockUserIds = new Set(
    (Array.isArray(clocks) ? clocks : [])
      .filter((clock) => clock?.clock_in && !clock?.clock_out)
      .map((clock) => Number(clock.user_id))
      .filter(Number.isFinite)
  );

  const employeeStats = teams.map((team) => {
    const teamKpis = team?.kpis || {};
    const totalWorkedSeconds = toNumber(teamKpis.teamTotalWorkedSeconds);
    const avgWorkedSecondsPerDay = toNumber(teamKpis.teamAvgWorkedSecondsPerDay);
    const latenessRate = toNumber(teamKpis.latenessRate);
    const latenessCount = Math.round(toNumber(teamKpis.latenessCount));
    const workDays = avgWorkedSecondsPerDay > 0
      ? totalWorkedSeconds / avgWorkedSecondsPerDay
      : 0;
    const status = latenessRate > 20 ? 'warning' : latenessRate > 10 ? 'attention' : 'good';
    const teamId = Number(team.teamId);
    const teamUserIds = (Array.isArray(users) ? users : [])
      .filter((user) => Number(user.team_id) === teamId)
      .map((user) => Number(user.id));

    const isClockedIn = teamUserIds.some((userId) => openClockUserIds.has(userId));

    return {
      id: teamId,
      name: team.teamName || `Team #${team.teamId}`,
      email: '-',
      totalShifts: Math.round(workDays),
      lateArrivals: latenessCount,
      lateRate: latenessRate.toFixed(1),
      earlyDepartures: 0,
      avgHours: toHours(avgWorkedSecondsPerDay).toFixed(1),
      isClockedIn,
      status,
    };
  });

  const lateRateValues = employeeStats.map((employee) => Number(employee.lateRate));
  const averageLateRate = lateRateValues.length > 0
    ? (lateRateValues.reduce((sum, value) => sum + value, 0) / lateRateValues.length)
    : 0;

  const teamName = employeeStats.length === 1
    ? employeeStats[0].name
    : (fallbackTeamName || 'Managed Teams');

  return {
    teamName,
    employeeStats,
    globalStats: {
      totalEmployees: Array.isArray(users) ? users.length : 0,
      currentlyClockedIn: Array.isArray(users)
        ? users.filter((user) => openClockUserIds.has(Number(user.id))).length
        : 0,
      avgLateRate: averageLateRate.toFixed(1),
      employeesWithIssues: employeeStats.filter((employee) => employee.status !== 'good').length,
    },
  };
};

export const buildChartDataFromClocks = (clocks, users) => {
  const monthlyMap = new Map();
  const now = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const monthKey = MONTH_NAMES[monthDate.getMonth()];
    monthlyMap.set(monthKey, { hours: 0, days: new Set() });
  }

  const userHoursMap = new Map();
  (Array.isArray(users) ? users : []).forEach((user) => {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
      || user.username
      || `User #${user.id}`;
    userHoursMap.set(Number(user.id), { id: Number(user.id), name, hours: 0 });
  });

  (Array.isArray(clocks) ? clocks : []).forEach((clock) => {
    const clockIn = toValidDate(clock?.clock_in);
    if (!clockIn) return;

    const monthKey = MONTH_NAMES[clockIn.getMonth()];
    const workedSeconds = getWorkedSeconds(clock);
    const workedHours = workedSeconds / 3600;

    if (monthlyMap.has(monthKey)) {
      const bucket = monthlyMap.get(monthKey);
      bucket.hours += workedHours;
      if (workedSeconds > 0) {
        bucket.days.add(toDateOnlyString(clockIn));
      }
    }

    if (workedSeconds > 0) {
      const userId = Number(clock.user_id);
      if (!userHoursMap.has(userId)) {
        userHoursMap.set(userId, { id: userId, name: `User #${userId}`, hours: 0 });
      }
      userHoursMap.get(userId).hours += workedHours;
    }
  });

  const monthlyHours = Array.from(monthlyMap.entries()).map(([month, value]) => ({
    month,
    hours: Math.round(value.hours),
    maxHours: 200,
  }));

  const attendanceTrend = Array.from(monthlyMap.entries()).map(([month, value]) => ({
    month,
    actual: value.days.size,
    expected: 22,
  }));

  const totalHours = monthlyHours.reduce((sum, month) => sum + month.hours, 0);
  const expectedHours = attendanceTrend.reduce((sum, month) => sum + (month.expected * 8), 0);
  const productivityScore = expectedHours > 0
    ? Math.min(100, Math.round((totalHours / expectedHours) * 100))
    : 0;

  const userHours = Array.from(userHoursMap.values())
    .map((entry) => ({ ...entry, hours: Math.round(entry.hours) }))
    .sort((left, right) => right.hours - left.hours)
    .slice(0, 6);

  const maxHours = Math.max(...userHours.map((entry) => entry.hours), 1);
  userHours.forEach((entry) => {
    entry.maxHours = maxHours;
  });

  return {
    monthlyHours,
    attendanceTrend,
    productivityScore,
    userHours,
  };
};
