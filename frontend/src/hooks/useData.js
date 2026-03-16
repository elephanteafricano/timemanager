import { useState, useEffect } from 'react';
import usersService from '../services/users.service';
import teamsService from '../services/teams.service';
import { getApiErrorMessage } from '../utils/apiError';
import { getArrayData } from '../utils/arrayData';

function useData(refreshTrigger = 0) {
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [usersRes, teamsRes] = await Promise.all([usersService.getUsers(), teamsService.getTeams()]);
        const usersData = getArrayData(usersRes.data);
        const teamsData = getArrayData(teamsRes.data);
        setAllUsers(usersData);

        const membersById = new Map();
        teamsData.forEach((team) => {
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

        setUsers(Array.from(membersById.values()));
        setTeams(teamsData);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  return { users, allUsers, teams, loading, error };
}

export default useData;
