import React, { useCallback, useState, useEffect } from 'react';
import usersService from '../services/users.service';
import clocksService from '../services/clocks.service';
import { USER_ROLES } from '../constants/roles';
import { getApiErrorMessage } from '../utils/apiError';
import PageHeader from '../components/PageHeader';
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

  return (
    <>
      <PageHeader
        title="All users"
        subtitle="Manage all users and create manager or employee accounts."
      />

      {error && (
        <div style={{ marginBottom: '16px', color: '#b42318' }}>
          {error}
        </div>
      )}

      <div className="tm-split">
        <section className="tm-split-main">
          <div className="tm-card tm-users-table-card tm-card-scroll tm-card-pad-sm tm-w-full">
            <table className="tm-table tm-table-compact tm-table-top-borders">
              <thead>
                <tr>
                  <th>First name</th>
                  <th>Last name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {!loadingUsers && users.map((userRow) => (
                  <tr key={userRow.id}>
                    <td>
                      <div className="tm-users-name-cell">
                        <img className="tm-avatar" src="/images/avatar.png" alt="" />
                        <span>{userRow.first_name}</span>
                      </div>
                    </td>
                    <td>{userRow.last_name}</td>
                    <td>{userRow.email}</td>
                    <td>{userRow.role}</td>
                    <td>
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
                    <td colSpan={5} className="tm-table-empty tm-table-empty-left">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {loadingUsers && <p>Loading users...</p>}
          </div>
        </section>

        <section className="tm-split-side">
          <div className="tm-card tm-users-side-card tm-card-pad-md tm-w-full">
            <h2 className="tm-users-form-title">Create user</h2>
            <form onSubmit={handleCreateUser} className="tm-users-form">
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
              <label className="tm-users-manager-label">
                <input
                  type="checkbox"
                  name="is_manager"
                  checked={formData.role === USER_ROLES.MANAGER}
                  onChange={handleInputChange}
                />
                Manager
              </label>
              <div className="tm-users-submit-row">
                <button type="submit" className="tm-btn tm-btn-primary" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create user'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}

export default UsersPage;
