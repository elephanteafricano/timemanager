import React from 'react';

function EditTeamForm({
  teamName,
  setTeamName,
  teamDescription,
  setTeamDescription,
  updatingTeam,
  addingMember,
  removingMemberId,
  onSubmit,
}) {
  return (
    <>
      <div className="team-edit-header">
        <h2 className="section-title">Edit team</h2>
        <p className="team-edit-subtitle">Update name and description</p>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="team-edit-fields"
      >
        <input
          className="tm-input"
          type="text"
          value={teamName}
          onChange={(event) => setTeamName(event.target.value)}
          placeholder="Team name"
          required
          disabled={updatingTeam || addingMember || removingMemberId !== null}
        />
        <textarea
          className="tm-input"
          value={teamDescription}
          onChange={(event) => setTeamDescription(event.target.value)}
          placeholder="Team description"
          rows={3}
          disabled={updatingTeam || addingMember || removingMemberId !== null}
        />
        <div className="team-edit-actions">
          <button
            type="submit"
            className="tm-btn tm-btn-primary"
            disabled={!teamName.trim() || updatingTeam || addingMember || removingMemberId !== null}
          >
            {updatingTeam ? 'Updating...' : 'Update team'}
          </button>
        </div>
      </form>
    </>
  );
}

export default EditTeamForm;
