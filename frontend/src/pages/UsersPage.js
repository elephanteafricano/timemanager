import { useCallback, useState, useEffect } from 'react';
import usersService from '../services/users.service';
import clocksService from '../services/clocks.service';
import { USER_ROLES } from '../constants/roles';
import { getApiErrorMessage } from '../utils/apiError';
import { applyFieldChange } from '../utils/forms';
import { getArrayData } from '../utils/arrayData';
import PageHeader from '../components/PageHeader';

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
      const list = getArrayData(usersResponse.data);

      const statusEntries = await Promise.all(
        list.map(async (user) => {
          try {
            const clocksResponse = await clocksService.getUserClocks(user.id);
            const clocks = getArrayData(clocksResponse.data);
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
      setError(getApiErrorMessage(fetchError, 'Failed to load users'));
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (event) => {
    const { name, type, checked } = event.target;
    if (type === 'checkbox' && name === 'is_manager') {
      setFormData((prev) => ({
        ...prev,
        role: checked ? USER_ROLES.MANAGER : USER_ROLES.EMPLOYEE,
      }));
      return;
    }

    applyFieldChange({
      e: event,
      setData: setFormData,
    });
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
      setError(getApiErrorMessage(submitError, 'Failed to create user'));
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

      {error && <div className="error tm-page-error">{error}</div>}

      <div className="tm-split">
        <section className="tm-split-main">
          <div className="tm-card tm-card-scroll tm-card-pad-sm tm-w-full">
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
                      <div className="tm-person-cell">
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
          <div className="tm-card tm-card-pad-md tm-w-full tm-form-card">
            <div className="tm-form-header">
              <h2 className="tm-form-title">Create user</h2>
              <p className="tm-form-subtitle">Create manager or employee accounts.</p>
            </div>

            <form onSubmit={handleCreateUser} className="tm-form">
              <div className="tm-form-grid-2">
                <div className="tm-form-field">
                  <label htmlFor="user-first-name">First name</label>
                  <input
                    id="user-first-name"
                    className="tm-input"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="First name"
                    required
                  />
                </div>

                <div className="tm-form-field">
                  <label htmlFor="user-last-name">Last name</label>
                  <input
                    id="user-last-name"
                    className="tm-input"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div className="tm-form-grid-2">
                <div className="tm-form-field">
                  <label htmlFor="user-phone-number">Phone number</label>
                  <input
                    id="user-phone-number"
                    className="tm-input"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                  />
                </div>

                <div className="tm-form-field">
                  <label htmlFor="user-email">Email</label>
                  <input
                    id="user-email"
                    className="tm-input"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Email"
                    required
                  />
                </div>
              </div>

              <div className="tm-form-grid-2">
                <div className="tm-form-field">
                  <label htmlFor="user-username">Username</label>
                  <input
                    id="user-username"
                    className="tm-input"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Username"
                    required
                  />
                </div>

                <div className="tm-form-field">
                  <label htmlFor="user-password">Password</label>
                  <input
                    id="user-password"
                    className="tm-input"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Password"
                    required
                  />
                </div>
              </div>

              <label className="tm-form-check">
                <input
                  type="checkbox"
                  name="is_manager"
                  checked={formData.role === USER_ROLES.MANAGER}
                  onChange={handleInputChange}
                />
                Manager
              </label>

              <div className="tm-form-actions">
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
