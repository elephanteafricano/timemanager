import { getUserDisplayName } from '../../utils/userDisplay';

function TeamMembersTable({ teamName, members, removingMemberId, isMutatingMembers, onRemove }) {
  return (
    <div className="team-members-card tm-card">
      <table className="team-members-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Assigned</th>
            <th className="member-actions-header">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => {
            const memberDisplayName = getUserDisplayName(member);
            const memberSubtitle = member?.username || member?.role || '-';

            return (
              <tr key={member.id}>
                <td>
                  <div className="tm-person-cell">
                    <img className="tm-avatar-lg" src="/images/avatar.png" alt="" />
                    <div className="member-name-stack">
                      <div className="member-full-name">{memberDisplayName}</div>
                      <div className="member-subtitle">{memberSubtitle}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="member-contact-stack">
                    <div>{member.phone_number || '-'}</div>
                    <div className="member-subtitle">{member.email || '-'}</div>
                  </div>
                </td>
                <td>{teamName || '-'}</td>
                <td className="member-actions-cell">
                  <button
                    type="button"
                    className="tm-btn tm-btn-danger"
                    onClick={() => onRemove(member.id)}
                    disabled={isMutatingMembers}
                  >
                    {removingMemberId === member.id ? 'Removing...' : 'Remove'}
                  </button>
                </td>
              </tr>
            );
          })}
          {members.length === 0 && (
            <tr>
              <td colSpan={4} className="members-empty-cell">No members found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default TeamMembersTable;
