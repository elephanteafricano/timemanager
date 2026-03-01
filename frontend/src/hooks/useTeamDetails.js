import { useCallback, useEffect, useMemo, useState } from 'react';
import teamsService from '../services/teams.service';
import usersService from '../services/users.service';
import { getApiErrorMessage } from '../utils/apiError';

function useTeamDetails(teamId) {
  const [team, setTeam] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [addingMember, setAddingMember] = useState(false);
  const [updatingTeam, setUpdatingTeam] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');

  const fetchTeam = useCallback(async () => {
    if (!teamId) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [teamResponse, usersResponse] = await Promise.all([
        teamsService.getTeamById(teamId),
        usersService.getUsers(),
      ]);
      setTeam(teamResponse?.data || null);
      setAllUsers(Array.isArray(usersResponse?.data) ? usersResponse.data : []);
    } catch (fetchError) {
      setError(getApiErrorMessage(fetchError, 'Failed to load team'));
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    setTeamName(team?.name || '');
    setTeamDescription(team?.description || '');
  }, [team]);

  const members = useMemo(() => (
    Array.isArray(team?.members)
      ? team.members
      : Array.isArray(team?.users)
        ? team.users
        : []
  ), [team]);

  const eligibleUsers = useMemo(() => {
    const memberIds = new Set(members.map((member) => Number(member.id)));
    return allUsers.filter((candidate) => (
      candidate?.role === 'employee' &&
      candidate?.id &&
      !memberIds.has(Number(candidate.id))
    ));
  }, [allUsers, members]);

  const isPickerDisabled = addingMember || removingMemberId !== null || updatingTeam || eligibleUsers.length === 0;

  const removeMember = useCallback(async (memberId) => {
    if (!team?.id || removingMemberId !== null) {
      return;
    }

    setRemovingMemberId(memberId);
    setError('');

    try {
      const remainingUserIds = members
        .filter((member) => member.id !== memberId)
        .map((member) => member.id);
      await teamsService.updateTeamMembers(team.id, remainingUserIds);
      await fetchTeam();
    } catch (removeError) {
      setError(getApiErrorMessage(removeError, 'Failed to remove member'));
    } finally {
      setRemovingMemberId(null);
    }
  }, [team, removingMemberId, members, fetchTeam]);

  const addMember = useCallback(async () => {
    if (!team?.id || !selectedUserId || addingMember) {
      return;
    }

    setAddingMember(true);
    setError('');

    try {
      const selectedId = Number(selectedUserId);
      const newUserIds = Array.from(new Set([
        ...members.map((member) => member.id),
        selectedId,
      ]));
      await teamsService.updateTeamMembers(team.id, newUserIds);
      await fetchTeam();
      setSelectedUserId('');
      setIsUserPickerOpen(false);
    } catch (addError) {
      setError(getApiErrorMessage(addError, 'Failed to add member'));
    } finally {
      setAddingMember(false);
    }
  }, [team, selectedUserId, addingMember, members, fetchTeam]);

  const updateTeam = useCallback(async () => {
    if (!team?.id || updatingTeam) {
      return;
    }

    setUpdatingTeam(true);
    setError('');

    try {
      await teamsService.updateTeam(team.id, {
        name: teamName,
        description: teamDescription,
      });
      await fetchTeam();
    } catch (updateError) {
      setError(getApiErrorMessage(updateError, 'Failed to update team'));
    } finally {
      setUpdatingTeam(false);
    }
  }, [team, updatingTeam, teamName, teamDescription, fetchTeam]);

  return {
    team,
    loading,
    error,
    members,
    eligibleUsers,
    removingMemberId,
    addingMember,
    updatingTeam,
    selectedUserId,
    setSelectedUserId,
    isUserPickerOpen,
    setIsUserPickerOpen,
    teamName,
    setTeamName,
    teamDescription,
    setTeamDescription,
    isPickerDisabled,
    removeMember,
    addMember,
    updateTeam,
  };
}

export default useTeamDetails;
