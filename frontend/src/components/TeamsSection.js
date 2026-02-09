import React from 'react';
import TeamIcon from '../assets/svgs/teamsvg.svg';

function TeamsSection({ teams, isManager, onEditTeam, onDeleteTeam, onAddTeam }) {
  return (
    <section className="data-section">
      <div className="section-header">
        <h2 className="section-title">Teams ({teams.length})</h2>
        {isManager && (
          <button className="btn-add" onClick={onAddTeam}>
            + Add Team
          </button>
        )}
      </div>
      {teams.length === 0 ? (
        <div className="empty-state">
          <p>No teams found</p>
        </div>
      ) : (
        <div className="data-grid">
          {teams.filter(team => team && team.id).map(team => (
            <div key={team.id} className="data-card">
              <div className="card-header">
                <div className="team-icon"><img src={TeamIcon} alt="Team" /></div>
                <div className="card-title">{team.name || 'Unnamed Team'}</div>
              </div>
              <div className="card-body">
                <p className="card-detail">Manager: {team.manager_id}</p>
                <p className="card-detail">Members: {team.members?.length || team.users?.length || 0}</p>
                {isManager && (
                  <div className="card-footer">
                    <button className="action-edit" onClick={() => onEditTeam(team)}>
                      Edit
                    </button>
                    <button className="action-delete" onClick={() => onDeleteTeam(team.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default TeamsSection;
