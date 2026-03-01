import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useData from '../hooks/useData';
import useCurrentUser from '../hooks/useCurrentUser';
import { isManagerRole } from '../utils/roles';
import teamsService from '../services/teams.service';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import TeamForm from '../components/TeamForm';
import TeamsSection from '../components/TeamsSection';
import './Data.css';

function Data({ mode = 'dashboard' }) {
  const backgroundUrl = `${process.env.PUBLIC_URL}/images/halftime.jpg`;
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamFormLoading, setTeamFormLoading] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    userIds: [],
  });
  const [formError, setFormError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { users, allUsers, teams, reports, kpiData, loading, error } = useData(isUserLoading ? undefined : user, refreshTrigger);

  const confirmAndDelete = async ({ confirmMessage, action, onSuccess }) => {
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await action();
      onSuccess();
    } catch (err) {
      setFormError(err.response?.data?.message || err.message);
    }
  };

  const handleCreateTeam = async () => {
    if (!isManager) {
      setFormError('Only managers can create or edit teams');
      return;
    }

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
      setFormError(err.response?.data?.message || err.message);
    } finally {
      setTeamFormLoading(false);
    }
  };

  const handleDeleteTeam = (teamId) => {
    if (!isManager) {
      setFormError('Only managers can delete teams');
      return;
    }

    confirmAndDelete({
      confirmMessage: 'Are you sure you want to delete this team?',
      action: () => teamsService.deleteTeam(teamId),
      onSuccess: () => setRefreshTrigger(prev => prev + 1),
    });
  };

  if (isUserLoading) return null;
  if (!user) return null;

  const isManager = isManagerRole(user);

  const isDashboardView = mode === 'dashboard';
  const isTeamsView = mode === 'teams';

  const pageTitle = isTeamsView
      ? 'Teams'
      : 'Data Dashboard';
  const pageSubtitle = isTeamsView
      ? 'Manage teams in your scope.'
      : 'View and manage your time tracking data.';
  const reportKpis = kpiData?.userKpis || {};

  return (
    <div className="dashboard tm-shell">
      <div className="tm-hero" style={{ backgroundImage: `url(${backgroundUrl})` }} aria-hidden="true" />
      <Sidebar user={user} onLogout={logout} />
      
      <div className="dashboard-content tm-panel">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">{pageTitle}</h1>
            <p className="dashboard-subtitle">{pageSubtitle}</p>
          </div>
          <button onClick={() => navigate('/clocking')} className="btn-secondary">
            Back to Clocking
          </button>
        </header>

        {loading && <div className="loading">Loading data...</div>}
        {error && <div className="error">{error}</div>}
        {formError && <div className="error">{formError}</div>}

        {!loading && !error && (
          <>
            {isDashboardView && (
              <section className="data-section">
                <h2 className="section-title">KPI Report</h2>
                <div className="table-container tm-card">
                  <table className="employee-table">
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Total worked hours</td>
                        <td>{Number.isFinite(reports?.totalHours) ? `${reports.totalHours}h` : '--'}</td>
                      </tr>
                      <tr>
                        <td>Average worked hours / day</td>
                        <td>{Number.isFinite(reports?.averageDailyHours) ? `${reports.averageDailyHours}h` : '--'}</td>
                      </tr>
                      <tr>
                        <td>Lateness rate</td>
                        <td>{Number.isFinite(reportKpis.latenessRate) ? `${reportKpis.latenessRate}%` : '--'}</td>
                      </tr>
                      <tr>
                        <td>Overtime</td>
                        <td>{Number.isFinite(reportKpis.overtimeHours) ? `${reportKpis.overtimeHours}h` : '--'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {isManager && isTeamsView && (
              <TeamsSection
                teams={teams}
                users={allUsers}
                isManager={isManager}
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
            )}
          </>
        )}
      </div>

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
    </div>
  );
}

export default Data;
