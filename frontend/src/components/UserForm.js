import React, { useState, useEffect } from 'react';
import { validateEmail, getPasswordError } from '../utils/validators';
import { USER_ROLES } from '../constants/roles';
import { applyFieldChange } from '../utils/forms';
import './UserForm.css';

function UserForm({ user, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    password: '',
    role: USER_ROLES.EMPLOYEE,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        password: '',
        role: user.role || USER_ROLES.EMPLOYEE,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    applyFieldChange({
      e,
      setData: setFormData,
      clearError: () => setError(''),
    });
  };

  const handleSubmit = async () => {
    if (!formData.username || !formData.email) {
      setError('Username and email are required');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Invalid email format');
      return;
    }

    if (!formData.first_name || !formData.last_name) {
      setError('First name and last name are required');
      return;
    }

    if (!user && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    if (formData.password) {
      const passwordError = getPasswordError(formData.password);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    const data = { ...formData };
    
    // Only include password if it's being changed
    if (!user) {
      // Creating new user - password is required
      if (!data.password) {
        setError('Password is required for new users');
        return;
      }
    } else {
      // Editing existing user - remove password if empty
      if (!data.password) {
        delete data.password;
      }
      // Always exclude username from updates (cannot be changed)
      delete data.username;
    }

    onSubmit(data);
  };

  return (
    <div className="user-form">
      {error && <div className="form-error">{error}</div>}
      
      <div className="form-row">
        <div className="form-group">
          <label>First Name</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            placeholder="Enter first name"
          />
        </div>
        <div className="form-group">
          <label>Last Name</label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            placeholder="Enter last name"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter username"
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter email"
        />
      </div>

      <div className="form-group">
        <label>Phone Number</label>
        <input
          type="tel"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          placeholder="Enter phone number (optional)"
        />
      </div>

      {!user && (
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter password"
          />
        </div>
      )}

      <div className="form-group">
        <label>Role</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value={USER_ROLES.EMPLOYEE}>Employee</option>
          <option value={USER_ROLES.MANAGER}>Manager</option>
        </select>
      </div>

      <div className="form-actions">
        {loading && <div className="form-loading">Processing...</div>}
        {!loading && (
          <button 
            type="button"
            className="form-submit"
            onClick={handleSubmit}
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}

export default UserForm;
