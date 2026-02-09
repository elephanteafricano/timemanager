import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usersService from '../services/users.service';
import teamsService from '../services/teams.service';
import clocksService from '../services/clocks.service';
import reportsService from '../services/reports.service';
import timeRulesService from '../services/timeRules.service';
import tokenService from '../services/tokenService';
import { computeDashboardKpis, computeReportsSummary, computeUserKpisFromClocks } from '../utils/kpiCalculations';

const toUiClock = (clock) => {
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

const isWeekday = (date) => {
  const day = date.getDay();
  return day !== 0 && day !== 6;
};

const buildRecentWorkdays = (count, endDate = new Date()) => {
  const days = [];
  const cursor = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  while (days.length < count) {
    if (isWeekday(cursor)) {
      days.unshift(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return days;
};

const parseTimeToMinutes = (value) => {
  if (!value) return null;
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

const clampMinutes = (value) => Math.max(0, Math.min(23 * 60 + 59, Math.round(value)));

const buildClockTime = (day, totalMinutes) => {
  const clamped = clampMinutes(totalMinutes);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0);
};

const buildVirtualClocks = ({ users, teamId, timeRule, workdayCount = 20 }) => {
  const rule = normalizeTimeRule(timeRule);
  if (!rule || !Array.isArray(users) || users.length === 0) return [];

  const workdays = buildRecentWorkdays(workdayCount);
  const clocks = [];
  const maxShiftMinutes = rule.maxShiftHours * 60;

  users.forEach((user, userIndex) => {
    if (!user?.id) return;
    const offset = (Number(user.id) || userIndex) % 7;
    const resolvedTeamId = user.team_id || teamId || null;

    workdays.forEach((day, index) => {
      const pattern = (index + offset) % 10;
      let startMinutes = rule.workStartMinutes;
      let endMinutes = rule.workEndMinutes;

      if (pattern === 0) {
        // Late arrival but still full-day.
        startMinutes = rule.workStartMinutes + rule.startGraceMinutes + 10;
        endMinutes = rule.workEndMinutes;
      } else if (pattern === 1) {
        // Early departure.
        startMinutes = rule.workStartMinutes;
        endMinutes = rule.workEndMinutes - rule.endGraceMinutes - 30;
      } else if (pattern === 2) {
        // Overtime.
        startMinutes = rule.workStartMinutes;
        endMinutes = rule.workEndMinutes + 60;
      }

      if (endMinutes <= startMinutes + 15) {
        endMinutes = startMinutes + 60;
      }

      if (maxShiftMinutes > 0 && (endMinutes - startMinutes) > maxShiftMinutes) {
        endMinutes = startMinutes + maxShiftMinutes;
      }

      const clockIn = buildClockTime(day, startMinutes);
      const clockOut = buildClockTime(day, endMinutes);

      if (clockOut <= clockIn) return;

      clocks.push({
        id: `virtual-${user.id}-${day.getTime()}`,
        user_id: user.id,
        team_id: resolvedTeamId,
        clock_in: clockIn,
        clock_out: clockOut,
        created_at: clockIn,
      });
    });
  });

  return clocks;
};

export function useData(refreshTrigger = 0) {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [clocks, setClocks] = useState([]);
  const [reports, setReports] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [timeRule, setTimeRule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!tokenService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    const currentUser = tokenService.getUser();

    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const basePromises = [teamsService.getTeams()];

        // Only managers can list all users
        if (currentUser.role === 'manager') {
          basePromises.unshift(usersService.getUsers());
        } else {
          // For employees, fetch only their own user record
          basePromises.unshift(usersService.getUserById(currentUser.id));
        }

        const [usersRes, teamsRes] = await Promise.all(basePromises);
        const usersData = Array.isArray(usersRes.data) ? usersRes.data : [usersRes.data];
        const teamsData = Array.isArray(teamsRes.data) ? teamsRes.data : [];
        let scopedUsers = usersData;
        let scopedTeams = teamsData;
        let managerTeam = null;
        let ruleTeamId = null;
        let activeTimeRule = null;
        let dashboardClocks = [];
        let reportClocks = [];

        if (currentUser.role === 'manager') {
          managerTeam = teamsData.find(team => team.manager_id === currentUser.id) || null;
          scopedTeams = managerTeam ? [managerTeam] : [];
          scopedUsers = managerTeam?.members ? managerTeam.members : [];
          ruleTeamId = managerTeam?.id || null;
          if (managerTeam?.id) {
            const teamClocksRes = await reportsService.getReports({ teamId: managerTeam.id });
            dashboardClocks = Array.isArray(teamClocksRes.data) ? teamClocksRes.data : [];
          }

          if (currentUser?.id) {
            try {
              const userReportRes = await reportsService.getReports({ userId: currentUser.id });
              reportClocks = Array.isArray(userReportRes.data) ? userReportRes.data : [];
            } catch {
              reportClocks = [];
            }
          }

        } else {
          const employeeTeam = teamsData.find(team =>
            Array.isArray(team.members) && team.members.some(member => member.id === currentUser.id));
          ruleTeamId = employeeTeam?.id || null;
          if (currentUser?.id) {
            const clocksRes = await clocksService.getUserClocks(currentUser.id);
            dashboardClocks = Array.isArray(clocksRes.data) ? clocksRes.data : [];
            reportClocks = dashboardClocks;
          }
        }

        try {
          const timeRuleRes = await timeRulesService.getCurrent(ruleTeamId);
          activeTimeRule = timeRuleRes?.data || null;
        } catch {
          activeTimeRule = null;
        }

        if (dashboardClocks.length === 0) {
          const derivedClocks = buildVirtualClocks({
            users: scopedUsers,
            teamId: ruleTeamId,
            timeRule: activeTimeRule,
          });
          if (derivedClocks.length > 0) {
            dashboardClocks = derivedClocks;
            if (currentUser.role !== 'manager') {
              reportClocks = derivedClocks;
            }
          }
        }

        setUsers(scopedUsers);
        setTeams(scopedTeams);
        setTimeRule(activeTimeRule);
        setReports(computeReportsSummary(reportClocks, activeTimeRule));
        setKpiData(computeDashboardKpis({
          clocks: dashboardClocks,
          users: scopedUsers,
          currentUser,
          team: managerTeam,
          timeRule: activeTimeRule,
        }));
        setClocks(dashboardClocks.map(toUiClock));
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.message || 'Failed to load data';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, refreshTrigger]);

  const fetchUserReport = async (userId) => {
    const clocksRes = await clocksService.getUserClocks(userId);
    const reportClocks = Array.isArray(clocksRes.data) ? clocksRes.data : [];
    return {
      summary: computeReportsSummary(reportClocks, timeRule),
      kpis: computeUserKpisFromClocks(reportClocks, timeRule),
      clocks: reportClocks,
    };
  };

  return { users, teams, clocks, reports, kpiData, loading, error, fetchUserReport };
}

export default useData;
