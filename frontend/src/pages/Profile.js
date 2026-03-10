import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useOutletUser from '../hooks/useOutletUser';
import PageHeader from '../components/PageHeader';
import { applyFieldChange } from '../utils/forms';
import { getApiErrorMessage } from '../utils/apiError';
import './Profile.css';
import usersService from '../services/users.service';

function Profile() {
  const user = useOutletUser();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
    });
  }, [user]);

  const handleChange = (e) => {
    applyFieldChange({
      e,
      setData: setFormData,
      clearError: () => setError(''),
    });
  };

  const handleSaveProfile = async () => {
    if (!formData.email) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await usersService.updateUser(user.id, formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await usersService.deleteUser(user.id);
      logout();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account information"
        rightActions={(
          <button onClick={() => navigate('/home')} className="btn-secondary">
            Back to Home
          </button>
        )}
      />

      <div className="profile-container">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">{user.username[0].toUpperCase()}</div>
            <div className="profile-info">
              <h2>{user.first_name} {user.last_name}</h2>
              <p className="profile-username">@{user.username}</p>
              <span className={`role-badge ${user.role}`}>{user.role}</span>
            </div>
          </div>

          {!isEditing ? (
            <div className="profile-details">
              <div className="detail-group">
                <span className="detail-label">Email</span>
                <span className="detail-value">{user.email}</span>
              </div>
              <div className="detail-group">
                <span className="detail-label">Phone</span>
                <span className="detail-value">{user.phone_number || 'Not provided'}</span>
              </div>
              <div className="detail-group">
                <span className="detail-label">User ID</span>
                <span className="detail-value">#{user.id}</span>
              </div>
              <div className="detail-group">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>

              <div className="profile-actions">
                <button className="btn-edit" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <div className="form-actions">
                <button
                  className="btn-cancel"
                  onClick={() => {
                    setIsEditing(false);
                    setError('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn-save"
                  onClick={handleSaveProfile}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="profile-card danger-zone">
          <h3>Danger Zone</h3>
          <p>Once you delete your account, there is no going back. Please be certain.</p>
          <button
            className="btn-delete-account"
            onClick={handleDeleteAccount}
            disabled={loading}
          >
            Delete My Account
          </button>
        </div>
      </div>
    </>
  );
}

export default Profile;
