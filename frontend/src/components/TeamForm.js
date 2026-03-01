import React, { useState, useEffect } from 'react';
import { applyFieldChange } from '../utils/forms';
import './TeamForm.css';

function TeamForm({ team, users, loading, onChange }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userIds: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (team) {
      // Safely extract user IDs from team members/users, filtering out undefined entries
      const memberIds = (team.members || [])
        .filter(m => m && m.id)
        .map(m => m.id);
      const userIds = (team.users || [])
        .filter(u => u && u.id)
        .map(u => u.id);
      
      setFormData({
        name: team.name || '',
        description: team.description || '',
        userIds: memberIds.length > 0 ? memberIds : userIds,
      });
    }
  }, [team]);

  useEffect(() => {
    if (onChange) {
      onChange(formData);
    }
  }, [formData, onChange]);

  const handleChange = (e) => {
    applyFieldChange({
      e,
      setData: setFormData,
      clearError: () => setError(''),
    });
  };

  const handleUserToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }));
  };

  // Filter out invalid users
  const validUsers = (users || []).filter(u => u && u.id);

  return (
    <div className="team-form">
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-group">
        <label>Team Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter team name"
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Enter team description (optional)"
          rows="3"
        />
      </div>

      <div className="form-group">
        <label>Team Members</label>
        <div className="members-list">
          {validUsers.filter(u => u.role === 'employee').map(u => (
            <div key={u.id} className="member-item">
              <input
                type="checkbox"
                id={`member-${u.id}`}
                checked={formData.userIds.includes(u.id)}
                onChange={() => handleUserToggle(u.id)}
              />
              <label htmlFor={`member-${u.id}`}>
                {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
              </label>
            </div>
          ))}
        </div>
      </div>

      {loading && <div className="form-loading">Processing...</div>}
    </div>
  );
}

export default TeamForm;
