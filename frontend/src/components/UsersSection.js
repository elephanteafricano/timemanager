import React from 'react';

function UsersSection({ users, currentUser, isManager, onEditUser, onDeleteUser, onAddUser }) {
  return (
    <section className="data-section">
      <div className="section-header">
        <h2 className="section-title">{isManager ? 'Team Members' : 'Users'} ({users.length})</h2>
        {isManager && (
          <button className="btn-add" onClick={onAddUser}>
            + Add User
          </button>
        )}
      </div>
      <div className="data-grid">
        {users.map(u => (
          <div key={u.id} className="data-card tm-card">
            <div className="card-header">
              <div className="user-avatar">{u.username[0].toUpperCase()}</div>
              <div className="card-title">{u.first_name} {u.last_name}</div>
            </div>
            <div className="card-body">
              <p className="card-detail">Username: {u.username}</p>
              <p className="card-detail">Email: {u.email}</p>
              {u.phone_number && <p className="card-detail">Phone: {u.phone_number}</p>}
              <div className="card-footer">
                <span className={`role-badge ${u.role}`}>{u.role}</span>
                {isManager && u.id !== currentUser.id && (
                  <div className="card-actions">
                    <button className="action-edit" onClick={() => onEditUser(u)}>
                      Edit
                    </button>
                    <button className="action-delete" onClick={() => onDeleteUser(u.id)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default UsersSection;
