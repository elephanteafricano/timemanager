import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useData from '../hooks/useData';
import useOutletUser from '../hooks/useOutletUser';
import teamsService from '../services/teams.service';
import Modal from '../components/Modal';
import TeamForm from '../components/TeamForm';
import TeamsSection from '../components/TeamsSection';
import PageHeader from '../components/PageHeader';
import InlineState from '../components/InlineState';
import { getApiErrorMessage } from '../utils/apiError';
import './Data.css';

function Data() {
  const user = useOutletUser();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamFormLoading, setTeamFormLoading] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    userIds: [],
  });
  const [formError, setFormError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const navigate = useNavigate();
  const { users, allUsers, teams, loading, error } = useData(refreshTrigger);

  const handleCreateTeam = async () => {
    setTeamFormLoading(true);
    setFormError('');

    try {
      const newTeamResponse = await teamsService.createTeam({
        name: teamFormData.name,
        description: teamFormData.description,
        manager_id: user.id,
      });
      const teamId = newTeamResponse.data?.id;

      if (teamId && teamFormData.userIds && teamFormData.userIds.length > 0) {
        await teamsService.updateTeamMembers(teamId, teamFormData.userIds);
      }

      setShowTeamModal(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setTeamFormLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) {
      return;
    }

    try {
      await teamsService.deleteTeam(teamId);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    }
  };

  const pageTitle = 'Teams';
  const pageSubtitle = 'Manage teams in your scope.';

  return (
    <>
      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
        rightActions={(
          <button onClick={() => navigate('/clocking')} className="btn-secondary">
            Back to Clocking
          </button>
        )}
      />

      {formError && <div className="error">{formError}</div>}

      <InlineState loading={loading} loadingText="Loading data..." error={error}>
        <TeamsSection
          teams={teams}
          users={allUsers}
          onViewTeam={(team) => navigate(`/teams/${team.id}`)}
          onDeleteTeam={handleDeleteTeam}
          onAddTeam={() => {
            setTeamFormData({
              name: '',
              description: '',
              userIds: [],
            });
            setShowTeamModal(true);
          }}
        />
      </InlineState>

      <Modal
        isOpen={showTeamModal}
        title="Create New Team"
        onClose={() => { setShowTeamModal(false); }}
        onSubmit={handleCreateTeam}
      >
        <TeamForm
          team={null}
          users={users}
          onChange={setTeamFormData}
          loading={teamFormLoading}
        />
      </Modal>
    </>
  );
}

export default Data;
