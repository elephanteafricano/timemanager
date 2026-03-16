import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import authService from '../services/auth.service';
import { runAsyncAction } from '../utils/asyncAction';
import './AuthSupport.css';

function ResetPassword() {
  const location = useLocation();
  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setError('Missing reset token.');
      return;
    }

    await runAsyncAction({
      setLoading,
      setError,
      action: async () => {
        try {
          await authService.resetPassword(token, newPassword);
        } catch (err) {
          if (err?.response?.data?.error?.message) {
            throw err;
          }
          throw new Error('Invalid or expired reset token.');
        }
      },
      onSuccess: () => setDone(true),
    });
  };

  return (
    <div className="auth-support-page">
      <div className="auth-support-card">
        <h1 className="auth-support-title">Reset password</h1>
        <p className="auth-support-subtitle">Set a new password for your account.</p>

        {!done ? (
          <form className="auth-support-form" onSubmit={handleSubmit}>
            <label className="auth-support-label" htmlFor="new-password">New password</label>
            <input
              id="new-password"
              className="auth-support-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            {error && <div className="auth-support-error">{error}</div>}
            <button className="auth-support-button" type="submit" disabled={loading || !newPassword}>
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        ) : (
          <div className="auth-support-success">
            Password reset successful. You can now sign in with your new password.
          </div>
        )}

        <div className="auth-support-links">
          <Link to="/forgot-password">Request another link</Link>
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
