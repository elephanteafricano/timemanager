import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import usersService from '../services/users.service';
import teamsService from '../services/teams.service';
import clocksService from '../services/clocks.service';
import reportsService from '../services/reports.service';
import tokenService from '../services/tokenService';
import { buildDateRange } from '../utils/dateFormat';
import {
  buildChartDataFromClocks,
  buildReportsSummaryFromResponse,
  buildTeamOverviewFromResponse,
  filterClocksByRange,
  mapUserKpisFromResponse,
  toUiClock,
} from '../utils/reportMappers';

function useData(refreshTrigger = 0) {
  const [users, setUsers] = useState([]);
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
        let fallbackTeamName = null;

        if (currentUser.role === 'manager') {
          scopedTeams = teamsData.filter((team) => team.manager_id === currentUser.id);
          fallbackTeamName = scopedTeams.length > 0 ? scopedTeams[0].name : null;
          const membersById = new Map();
          scopedTeams.forEach((team) => {
            (Array.isArray(team.members) ? team.members : []).forEach((member) => {
              if (member?.id) {
                membersById.set(member.id, member);
              }
            });
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
          chartData: buildChartDataFromClocks(dashboardClocks, scopedUsers),
          teamOverview: currentUser.role === 'manager'
            ? buildTeamOverviewFromResponse({
              reportPayload,
              users: scopedUsers,
              clocks: dashboardClocks,
              fallbackTeamName,
            })
            : null,
        });
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

  return { users, teams, clocks, reports, kpiData, loading, error, fetchUserReport };
}

export default useData;
