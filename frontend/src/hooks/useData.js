import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usersService from '../services/users.service';
import teamsService from '../services/teams.service';
import clocksService from '../services/clocks.service';
import reportsService from '../services/reports.service';
import { buildDateRange } from '../utils/dateFormat';
import { getApiErrorMessage } from '../utils/apiError';
import {
  buildChartDataFromResponse,
  buildReportsSummaryFromResponse,
  buildTeamOverviewFromResponse,
  filterClocksByRange,
  mapUserKpisFromResponse,
  toUiClock,
} from '../utils/reportMappers';

function useData(currentUser, refreshTrigger = 0) {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [clocks, setClocks] = useState([]);
  const [reports, setReports] = useState({
    totalHours: 0,
    averageDailyHours: 0,
    workDays: 0,
  });
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser === undefined) {
      return;
    }

    if (!currentUser) {
      navigate('/login');
      return;
    }

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
        setAllUsers(usersData);
        let scopedUsers = usersData;
        let scopedTeams = teamsData;
        let fallbackTeamName = null;

        if (currentUser.role === 'manager') {
          scopedTeams = teamsData;
          fallbackTeamName = scopedTeams.length > 0 ? scopedTeams[0].name : null;
          const membersById = new Map();
          scopedTeams.forEach((team) => {
            (Array.isArray(team.members) ? team.members : []).forEach((member) => {
              if (member?.id) {
                membersById.set(member.id, member);
              }
            });
          });
          usersData
            .filter((user) =>
              user?.role === 'employee' &&
              (user.team_id === null || user.team_id === undefined))
            .forEach((user) => {
              if (user?.id && !membersById.has(user.id)) {
                membersById.set(user.id, user);
              }
            });
          scopedUsers = Array.from(membersById.values());
        } else {
          const employeeTeam = teamsData.find((team) =>
            Array.isArray(team.members) && team.members.some((member) => member.id === currentUser.id));
          scopedTeams = employeeTeam ? [employeeTeam] : [];
        }

        const range = buildDateRange();
        const reportsRes = await reportsService.getReports({
          from: range.from,
          to: range.to,
        });
        const reportPayload = reportsRes?.data || {};

        let dashboardClocks = [];
        if (currentUser.role === 'manager') {
          const clockResponses = await Promise.all(
            scopedUsers.map(async (scopedUser) => {
              try {
                const response = await clocksService.getUserClocks(scopedUser.id);
                return Array.isArray(response.data) ? response.data : [];
              } catch {
                return [];
              }
            })
          );
          dashboardClocks = clockResponses.flat();
        } else if (currentUser?.id) {
          const clocksRes = await clocksService.getUserClocks(currentUser.id);
          dashboardClocks = Array.isArray(clocksRes.data) ? clocksRes.data : [];
        }

        dashboardClocks = filterClocksByRange(dashboardClocks, range.fromDate, range.toDate);

        setUsers(scopedUsers);
        setTeams(scopedTeams);
        setReports(buildReportsSummaryFromResponse(reportPayload));
        setKpiData({
          userKpis: mapUserKpisFromResponse(reportPayload),
          chartData: buildChartDataFromResponse(reportPayload),
          teamOverview: currentUser.role === 'manager'
            ? buildTeamOverviewFromResponse({
              reportPayload,
              users: scopedUsers,
              fallbackTeamName,
            })
            : null,
        });
        setClocks(dashboardClocks.map(toUiClock));
      } catch (err) {
        const msg = getApiErrorMessage(err, 'Failed to load data');
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, navigate, refreshTrigger]);

  const fetchUserReport = async (userId) => {
    const range = buildDateRange();
    const [reportsRes, clocksRes] = await Promise.all([
      reportsService.getReports({ userId, from: range.from, to: range.to }),
      clocksService.getUserClocks(userId),
    ]);
    const reportPayload = reportsRes?.data || {};
    const reportClocks = filterClocksByRange(
      Array.isArray(clocksRes.data) ? clocksRes.data : [],
      range.fromDate,
      range.toDate
    );

    return {
      summary: buildReportsSummaryFromResponse(reportPayload),
      kpis: mapUserKpisFromResponse(reportPayload),
      clocks: reportClocks,
    };
  };

  return { users, allUsers, teams, clocks, reports, kpiData, loading, error, fetchUserReport };
}

export default useData;
