import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCurrentUser from '../hooks/useCurrentUser';
import useTeamDetails from '../hooks/useTeamDetails';
import Sidebar from '../components/Sidebar';
import TeamMembersTable from '../components/team/TeamMembersTable';
import AddMemberPicker from '../components/team/AddMemberPicker';
import EditTeamForm from '../components/team/EditTeamForm';
import './Home.css';
import '../styles/ui.css';
import './TeamDetailsPage.css';

function TeamDetailsPage() {
  const backgroundUrl = `${process.env.PUBLIC_URL}/images/halftime.jpg`;
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const {
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
  } = useTeamDetails(id);

  if (isUserLoading) {
    return null;
  }
  if (!user) {
    return null;
  }

  return (
    <div className="dashboard tm-shell">
      <div className="tm-hero" style={{ backgroundImage: `url(${backgroundUrl})` }} aria-hidden="true" />
      <Sidebar user={user} onLogout={logout} />

      <div className="dashboard-content tm-panel">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-greeting">Members - {team?.name || 'Team'}</h1>
            <p className="dashboard-subtitle">{team?.description || 'No description'}</p>
          </div>
          <button onClick={() => navigate('/teams')} className="btn-secondary">
            Back to teams
          </button>
        </header>

        {loading && <div className="loading">Loading team...</div>}
        {error && <div className="error">{error}</div>}

        {!loading && !error && (
          <section className="data-section">
            <TeamMembersTable
              teamName={team?.name}
              members={members}
              removingMemberId={removingMemberId}
              addingMember={addingMember}
              onRemove={removeMember}
            />
            <section className="team-actions-card tm-card">
              <AddMemberPicker
                eligibleUsers={eligibleUsers}
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                isOpen={isUserPickerOpen}
                setIsOpen={setIsUserPickerOpen}
                isPickerDisabled={isPickerDisabled}
                addingMember={addingMember}
                removingMemberId={removingMemberId}
                updatingTeam={updatingTeam}
                onAdd={addMember}
              />
              <EditTeamForm
                teamName={teamName}
                setTeamName={setTeamName}
                teamDescription={teamDescription}
                setTeamDescription={setTeamDescription}
                updatingTeam={updatingTeam}
                addingMember={addingMember}
                removingMemberId={removingMemberId}
                onSubmit={updateTeam}
              />
            </section>
          </section>
        )}
      </div>
    </div>
  );
}

export default TeamDetailsPage;
