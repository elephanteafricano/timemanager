import { useNavigate, useParams } from 'react-router-dom';
import useTeamDetails from '../hooks/useTeamDetails';
import TeamMembersTable from '../components/team/TeamMembersTable';
import AddMemberPicker from '../components/team/AddMemberPicker';
import EditTeamForm from '../components/team/EditTeamForm';
import PageHeader from '../components/PageHeader';
import InlineState from '../components/InlineState';
import './TeamDetailsPage.css';

function TeamDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    team,
    loading,
    error,
    members,
    eligibleUsers,
    removingMemberId,
    addingMember,
    updatingTeam,
    isMutatingMembers,
    isBusy,
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

  return (
    <>
      <PageHeader
        title={`Members - ${team?.name || 'Team'}`}
        subtitle={team?.description || 'No description'}
        rightActions={(
          <button onClick={() => navigate('/teams')} className="btn-secondary">
            Back to teams
          </button>
        )}
      />

      <InlineState loading={loading} loadingText="Loading team..." error={error}>
        <section className="data-section">
          <TeamMembersTable
            teamName={team?.name}
            members={members}
            removingMemberId={removingMemberId}
            isMutatingMembers={isMutatingMembers}
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
              isBusy={isBusy}
              addingMember={addingMember}
              onAdd={addMember}
            />
            <EditTeamForm
              teamName={teamName}
              setTeamName={setTeamName}
              teamDescription={teamDescription}
              setTeamDescription={setTeamDescription}
              isBusy={isBusy}
              updatingTeam={updatingTeam}
              onSubmit={updateTeam}
            />
          </section>
        </section>
      </InlineState>
    </>
  );
}

export default TeamDetailsPage;
