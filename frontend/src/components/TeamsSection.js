import React from 'react';
import TeamIcon from '../assets/svgs/teamsvg.svg';
import '../styles/ui.css';

function TeamsSection({ teams, users = [], isManager, onDeleteTeam, onAddTeam, onViewTeam }) {
  const safeTeams = teams.filter((team) => team && team.id);

  return (
    <section className="data-section">
      <div className="section-header">
        <h2 className="section-title">Teams ({teams.length})</h2>
        {isManager && (
          <button className="tm-btn tm-btn-primary" onClick={onAddTeam}>
            + Add Team
          </button>
        )}
      </div>

      <div className="tm-card" style={{ overflowX: 'auto' }}>
        <table className="tm-table">
          <colgroup>
            <col />
            <col style={{ width: '240px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '260px' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Name</th>
              <th>Manager</th>
              <th><div className="tm-th-center">Members</div></th>
              <th><div className="tm-th-right">Actions</div></th>
            </tr>
          </thead>
          <tbody>
            {safeTeams.length === 0 && (
              <tr>
                <td colSpan={4} className="tm-table-empty">
                  No teams found
                </td>
              </tr>
            )}

            {safeTeams.map((team) => {
            const managerUser = users.find((u) => Number(u.id) === Number(team.manager_id));
            const managerName = managerUser
              ? ((managerUser.first_name && managerUser.last_name)
                ? `${managerUser.first_name} ${managerUser.last_name}`
                : (managerUser.username || managerUser.email || `#${team.manager_id}`))
              : `#${team.manager_id}`;
            const membersCount = team.members?.length || team.users?.length || 0;

            return (
              <tr key={team.id}>
                <td>
                  <div className="tm-team-name-cell">
                    <span className="tm-team-icon-wrap">
                      <img src={TeamIcon} alt="" />
                    </span>
                    <span>
                      <span className="tm-team-name">{team.name || 'Unnamed Team'}</span>
                      {team.description ? (
                        <span className="tm-team-subtitle">{team.description}</span>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td>{managerName}</td>
                <td className="tm-cell-center">{membersCount}</td>
                <td className="tm-cell-right">
                  {isManager ? (
                    <div className="tm-actions-wrap">
                      <button type="button" className="tm-btn tm-btn-primary" onClick={() => onViewTeam && onViewTeam(team)}>
                        Members
                      </button>
                      <button type="button" className="tm-btn tm-btn-danger" onClick={() => onDeleteTeam(team.id)}>
                        Delete
                      </button>
                    </div>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TeamsSection;
