import React, { useCallback, useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useCurrentUser from '../hooks/useCurrentUser';
import usersService from '../services/users.service';
import clocksService from '../services/clocks.service';
import Sidebar from '../components/Sidebar';
import { USER_ROLES } from '../constants/roles';
import { getApiErrorMessage } from '../utils/apiError';
import './Home.css';
import '../styles/ui.css';

const INITIAL_FORM = {
  first_name: '',
  last_name: '',
  phone_number: '',
  email: '',
  username: '',
  password: '',
  role: USER_ROLES.EMPLOYEE,
};

function UsersPage() {
  const backgroundUrl = `${process.env.PUBLIC_URL}/images/halftime.jpg`;
  const { logout } = useAuth();
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setError('');
    try {
      const usersResponse = await usersService.getUsers();
      const list = Array.isArray(usersResponse.data) ? usersResponse.data : [];

      const statusEntries = await Promise.all(
        list.map(async (user) => {
          try {
            const clocksResponse = await clocksService.getUserClocks(user.id);
            const clocks = Array.isArray(clocksResponse.data) ? clocksResponse.data : [];
            const latestClock = clocks[clocks.length - 1];
            const isOnline = Boolean(
              latestClock && (latestClock.clock_out === null || latestClock.clock_out === undefined)
            );
            return [user.id, isOnline ? 'Online' : 'Offline'];
          } catch {
            return [user.id, 'Offline'];
          }
        })
      );

      const statusByUserId = new Map(statusEntries);
      setUsers(
        list.map((user) => ({
          ...user,
          status: statusByUserId.get(user.id) || 'Offline',
        }))
      );
    } catch (fetchError) {
      const message = getApiErrorMessage(fetchError, 'Failed to load users');
      setError(message);
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    if (type === 'checkbox' && name === 'is_manager') {
      setFormData((prev) => ({
        ...prev,
        role: checked ? USER_ROLES.MANAGER : USER_ROLES.EMPLOYEE,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await usersService.createUser(formData);
      setFormData(INITIAL_FORM);
      await fetchUsers();
    } catch (submitError) {
      const message = getApiErrorMessage(submitError, 'Failed to create user');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

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
            <h1 className="dashboard-greeting">All users</h1>
            <p className="dashboard-subtitle">Manage all users and create manager or employee accounts.</p>
          </div>
        </header>

        {error && (
          <div style={{ marginBottom: '16px', color: '#b42318' }}>
            {error}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            gap: '24px',
          }}
        >
          <section style={{ flex: 1, minWidth: 0, display: 'flex' }}>
            <div
              className="tm-card"
              style={{ overflowX: 'auto', padding: '12px 16px', width: '100%', height: '100%' }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '8px' }}>First name</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Last name</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Role</th>
                    <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!loadingUsers && users.map((userRow) => (
                    <tr key={userRow.id}>
                      <td style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img className="tm-avatar" src="/images/avatar.png" alt="" />
                          <span>{userRow.first_name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>{userRow.last_name}</td>
                      <td style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>{userRow.email}</td>
                      <td style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>{userRow.role}</td>
                      <td style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>
                        {userRow.status === 'Online' ? (
                          <span className="tm-badge tm-badge-green">Online</span>
                        ) : (
                          <span className="tm-badge tm-badge-red">Offline</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!loadingUsers && users.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '8px', borderTop: '1px solid #e5e7eb' }}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {loadingUsers && <p>Loading users...</p>}
            </div>
          </section>

          <section style={{ width: '100%', maxWidth: '460px', display: 'flex' }}>
            <div className="tm-card" style={{ width: '100%', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Create user</h2>
              <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                <input
                  className="tm-input"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  placeholder="First name"
                  required
                />
                <input
                  className="tm-input"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  placeholder="Last name"
                  required
                />
                <input
                  className="tm-input"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                />
                <input
                  className="tm-input"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email"
                  required
                />
                <input
                  className="tm-input"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Username"
                  required
                />
                <input
                  className="tm-input"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Password"
                  required
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    name="is_manager"
                    checked={formData.role === USER_ROLES.MANAGER}
                    onChange={handleInputChange}
                  />
                  Manager
                </label>
                <div style={{ marginTop: 'auto', paddingTop: '4px' }}>
                  <button type="submit" className="tm-btn tm-btn-primary" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create user'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;
