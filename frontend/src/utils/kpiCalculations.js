const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const pad2 = (value) => String(value).padStart(2, '0');

const dayKey = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

const minutesFromDate = (date) => (date.getHours() * 60) + date.getMinutes();

const parseTimeToMinutes = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return minutesFromDate(value);
  }
  const [hoursRaw, minutesRaw] = String(value).split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return (hours * 60) + minutes;
};

const normalizeTimeRule = (rule) => {
  if (!rule) return null;
  const workStartMinutes = parseTimeToMinutes(rule.work_start_time);
  const workEndMinutes = parseTimeToMinutes(rule.work_end_time);
  const startGraceMinutes = Number(rule.start_grace_minutes);
  const endGraceMinutes = Number(rule.end_grace_minutes);
  const standardWorkHours = Number(rule.standard_work_hours);
  const maxShiftHours = Number(rule.max_shift_hours);

  if (!Number.isFinite(workStartMinutes)
    || !Number.isFinite(workEndMinutes)
    || !Number.isFinite(startGraceMinutes)
    || !Number.isFinite(endGraceMinutes)
    || !Number.isFinite(standardWorkHours)
    || !Number.isFinite(maxShiftHours)) {
    return null;
  }

  return {
    workStartMinutes,
    workEndMinutes,
    startGraceMinutes,
    endGraceMinutes,
    standardWorkHours,
    maxShiftHours,
  };
};

const formatMinutes = (minutes) => {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(minutes)));
  const hours = Math.floor(clamped / 60);
  const mins = clamped % 60;
  return `${pad2(hours)}:${pad2(mins)}`;
};

const toValidDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildShift = (clock, rule) => {
  if (!rule) return null;
  const clockIn = toValidDate(clock.clock_in);
  const clockOut = toValidDate(clock.clock_out);
  if (!clockIn || !clockOut) return null;

  const durationHours = (clockOut - clockIn) / (1000 * 60 * 60);
  if (durationHours <= 0 || durationHours > rule.maxShiftHours) return null;

  const arrivalMinutes = minutesFromDate(clockIn);
  const departureMinutes = minutesFromDate(clockOut);
  const lateThreshold = rule.workStartMinutes + rule.startGraceMinutes;
  const earlyDepartureThreshold = rule.workEndMinutes - rule.endGraceMinutes;
  const isLate = arrivalMinutes > lateThreshold;
  const isEarlyDeparture = departureMinutes < earlyDepartureThreshold;
  const isCompliant = !isLate && !isEarlyDeparture && durationHours >= rule.standardWorkHours;

  return {
    user_id: clock.user_id,
    team_id: clock.team_id,
    clock_in: clockIn,
    clock_out: clockOut,
    duration: durationHours,
    arrivalMinutes,
    departureMinutes,
    isLate,
    isEarlyDeparture,
    isCompliant,
    dayKey: dayKey(clockIn),
    dayName: clockIn.toLocaleDateString('en-US', { weekday: 'long' }),
  };
};

const buildShifts = (clocks, timeRule) => {
  const rule = normalizeTimeRule(timeRule);
  if (!rule) return [];
  return clocks.map((clock) => buildShift(clock, rule)).filter(Boolean);
};

const computeUserKpis = (shifts, timeRule) => {
  const rule = normalizeTimeRule(timeRule);
  if (!rule || !shifts || shifts.length === 0) {
    return {
      totalShifts: 0,
      averageShiftLength: 0,
      longestShift: 0,
      shortestShift: 0,
      latenessRate: 0,
      weeklyAverage: 0,
      mostActiveDay: 'N/A',
      onTimeRate: 0,
      earlyDepartureRate: 0,
      overtimeHours: 0,
      scheduleComplianceRate: 0,
      averageArrivalTime: 'N/A',
      averageDepartureTime: 'N/A',
      totalWorkingHours: 0,
      expectedHours: 0,
      hoursVariance: 0,
    };
  }

  const totalShifts = shifts.length;
  const durations = shifts.map((s) => s.duration);
  const totalWorkingHours = durations.reduce((sum, d) => sum + d, 0);
  const averageShiftLength = totalWorkingHours / totalShifts;
  const longestShift = Math.max(...durations);
  const shortestShift = Math.min(...durations);

  const lateShifts = shifts.filter((s) => s.isLate).length;
  const earlyDepartures = shifts.filter((s) => s.isEarlyDeparture).length;
  const compliantShifts = shifts.filter((s) => s.isCompliant).length;

  const latenessRate = totalShifts > 0 ? (lateShifts / totalShifts) * 100 : 0;
  const onTimeRate = totalShifts > 0 ? ((totalShifts - lateShifts) / totalShifts) * 100 : 0;
  const earlyDepartureRate = totalShifts > 0 ? (earlyDepartures / totalShifts) * 100 : 0;
  const scheduleComplianceRate = totalShifts > 0 ? (compliantShifts / totalShifts) * 100 : 0;

  const overtimeHours = shifts.reduce((sum, s) => sum + Math.max(0, s.duration - rule.standardWorkHours), 0);

  const arrivalAvgMinutes = shifts.reduce((sum, s) => sum + s.arrivalMinutes, 0) / totalShifts;
  const departureAvgMinutes = shifts.reduce((sum, s) => sum + s.departureMinutes, 0) / totalShifts;

  const uniqueDays = new Set(shifts.map((s) => s.dayKey));
  const expectedHours = uniqueDays.size * rule.standardWorkHours;
  const hoursVariance = totalWorkingHours - expectedHours;

  const sortedByDate = [...shifts].sort((a, b) => a.clock_in - b.clock_in);
  const firstDate = sortedByDate[0]?.clock_in;
  const lastDate = sortedByDate[sortedByDate.length - 1]?.clock_in;
  const weeks = firstDate && lastDate
    ? Math.max(1, (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 7))
    : 1;
  const weeklyAverage = totalWorkingHours / weeks;

  const dayCounts = {};
  shifts.forEach((s) => {
    dayCounts[s.dayName] = (dayCounts[s.dayName] || 0) + 1;
  });
  const mostActiveDay = Object.keys(dayCounts).length > 0
    ? Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0][0]
    : 'N/A';

  return {
    totalShifts,
    averageShiftLength: Number(averageShiftLength.toFixed(2)),
    longestShift: Number(longestShift.toFixed(2)),
    shortestShift: Number(shortestShift.toFixed(2)),
    latenessRate: Number(latenessRate.toFixed(1)),
    weeklyAverage: Number(weeklyAverage.toFixed(2)),
    mostActiveDay,
    onTimeRate: Number(onTimeRate.toFixed(1)),
    earlyDepartureRate: Number(earlyDepartureRate.toFixed(1)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
    scheduleComplianceRate: Number(scheduleComplianceRate.toFixed(1)),
    averageArrivalTime: formatMinutes(arrivalAvgMinutes),
    averageDepartureTime: formatMinutes(departureAvgMinutes),
    totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
    expectedHours: Number(expectedHours.toFixed(2)),
    hoursVariance: Number(hoursVariance.toFixed(2)),
  };
};

const computeChartData = (shiftsByUser, users, timeRule) => {
  const rule = normalizeTimeRule(timeRule);
  const standardWorkHours = rule ? rule.standardWorkHours : 0;
  const today = new Date();
  const monthlyData = {};

  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = MONTH_NAMES[date.getMonth()];
    monthlyData[key] = { hours: 0, daySet: new Set() };
  }

  Object.values(shiftsByUser).forEach((shifts) => {
    shifts.forEach((shift) => {
      const monthKey = MONTH_NAMES[shift.clock_in.getMonth()];
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].hours += shift.duration;
        monthlyData[monthKey].daySet.add(shift.dayKey);
      }
    });
  });

  const monthlyHours = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    hours: Math.round(data.hours),
    maxHours: 200,
  }));

  const attendanceTrend = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    actual: data.daySet.size,
    expected: 22,
  }));

  const allShifts = Object.values(shiftsByUser).flat();
  const totalPossibleHours = (standardWorkHours * 20) * 6;
  const totalActualHours = monthlyHours.reduce((sum, m) => sum + m.hours, 0);
  const lateShifts = allShifts.filter((s) => s.isLate).length;
  const totalShifts = allShifts.length;
  const hoursScore = totalPossibleHours > 0
    ? Math.min(100, (totalActualHours / totalPossibleHours) * 100)
    : 0;
  const punctualityScore = totalShifts > 0
    ? ((totalShifts - lateShifts) / totalShifts) * 100
    : 100;
  const productivityScore = Math.round((hoursScore * 0.6) + (punctualityScore * 0.4));

  const userHoursMap = {};
  (users || []).forEach((user) => {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
    userHoursMap[user.id] = {
      id: user.id,
      name: fullName || user.username || `User #${user.id}`,
      hours: 0,
    };
  });

  Object.entries(shiftsByUser).forEach(([userId, shifts]) => {
    const total = shifts.reduce((sum, s) => sum + s.duration, 0);
    if (!userHoursMap[userId]) {
      userHoursMap[userId] = { id: userId, name: `User #${userId}`, hours: 0 };
    }
    userHoursMap[userId].hours += total;
  });

  const userHours = Object.values(userHoursMap)
    .map((user) => ({ id: user.id, name: user.name, hours: Math.round(user.hours) }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6);

  const maxUserHours = Math.max(...userHours.map((u) => u.hours), 1);
  userHours.forEach((user) => { user.maxHours = maxUserHours; });

  return { monthlyHours, attendanceTrend, productivityScore, userHours };
};

const computeTeamOverview = (users, shiftsByUser, clocksByUser, team) => {
  const employeeStats = (users || []).map((user) => {
    const shifts = shiftsByUser[user.id] || [];
    const totalShifts = shifts.length;
    const lateArrivals = shifts.filter((s) => s.isLate).length;
    const earlyDepartures = shifts.filter((s) => s.isEarlyDeparture).length;
    const totalHours = shifts.reduce((sum, s) => sum + s.duration, 0);
    const lateRate = totalShifts > 0 ? ((lateArrivals / totalShifts) * 100) : 0;
    const avgHours = totalShifts > 0 ? (totalHours / totalShifts) : 0;
    const status = lateRate > 20 ? 'warning' : lateRate > 10 ? 'attention' : 'good';

    const userClocks = clocksByUser[user.id] || [];
    const isClockedIn = userClocks.some((clock) => clock && clock.clock_in && !clock.clock_out);

    const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || `User #${user.id}`;

    return {
      id: user.id,
      name,
      email: user.email,
      totalShifts,
      lateArrivals,
      lateRate: lateRate.toFixed(1),
      earlyDepartures,
      avgHours: avgHours.toFixed(1),
      isClockedIn,
      status,
    };
  }).sort((a, b) => parseFloat(b.lateRate) - parseFloat(a.lateRate));

  const totalEmployees = employeeStats.length;
  const currentlyClockedIn = employeeStats.filter((e) => e.isClockedIn).length;
  const avgLateRate = totalEmployees > 0
    ? (employeeStats.reduce((sum, e) => sum + parseFloat(e.lateRate), 0) / totalEmployees).toFixed(1)
    : '0.0';
  const employeesWithIssues = employeeStats.filter((e) => e.status !== 'good').length;

  return {
    teamId: team?.id || null,
    teamName: team?.name || null,
    employeeStats,
    globalStats: {
      totalEmployees,
      currentlyClockedIn,
      avgLateRate,
      employeesWithIssues,
    },
  };
};

const computeDashboardKpis = ({ clocks, users, currentUser, team, timeRule }) => {
  const clocksByUser = {};
  (clocks || []).forEach((clock) => {
    if (!clock || !clock.user_id) return;
    if (!clocksByUser[clock.user_id]) clocksByUser[clock.user_id] = [];
    clocksByUser[clock.user_id].push(clock);
  });

  const shiftsByUser = {};
  Object.entries(clocksByUser).forEach(([userId, userClocks]) => {
    shiftsByUser[userId] = buildShifts(userClocks, timeRule);
  });

  const allShifts = Object.values(shiftsByUser).flat();
  const userKpis = computeUserKpis(allShifts, timeRule);
  const chartData = computeChartData(shiftsByUser, users, timeRule);

  const teamOverview = currentUser?.role === 'manager'
    ? computeTeamOverview(users, shiftsByUser, clocksByUser, team)
    : null;

  return { userKpis, chartData, teamOverview };
};

const computeReportsSummary = (clocks, timeRule) => {
  const shifts = buildShifts(clocks || [], timeRule);
  if (shifts.length === 0) {
    return { totalHours: 0, averageDailyHours: 0, workDays: 0 };
  }

  const totalHours = shifts.reduce((sum, s) => sum + s.duration, 0);
  const workDays = new Set(shifts.map((s) => s.dayKey)).size;
  const averageDailyHours = workDays > 0 ? totalHours / workDays : 0;

  return {
    totalHours: Number(totalHours.toFixed(2)),
    averageDailyHours: Number(averageDailyHours.toFixed(2)),
    workDays,
  };
};

const computeUserKpisFromClocks = (clocks, timeRule) =>
  computeUserKpis(buildShifts(clocks || [], timeRule), timeRule);

export {
  computeDashboardKpis,
  computeReportsSummary,
  computeUserKpisFromClocks,
};
