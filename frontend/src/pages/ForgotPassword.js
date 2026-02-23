import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/auth.service';
import { runAsyncAction } from '../utils/asyncAction';
import './AuthSupport.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    await runAsyncAction({
      setLoading,
      setError,
      action: async () => {
        try {
          await authService.forgotPassword(email);
        } catch {
          throw new Error('Unable to process this request right now. Please try again.');
        }
      },
      onSuccess: () => setDone(true),
    });
  };

  return (
    <div className="auth-support-page">
      <div className="auth-support-card">
        <h1 className="auth-support-title">Forgot password</h1>
        <p className="auth-support-subtitle">Enter your email to receive a reset link.</p>

        {!done ? (
          <form className="auth-support-form" onSubmit={handleSubmit}>
            <label className="auth-support-label" htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              className="auth-support-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {error && <div className="auth-support-error">{error}</div>}
            <button className="auth-support-button" type="submit" disabled={loading || !email}>
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        ) : (
          <div className="auth-support-success">
            If an account with that email exists, a reset link has been sent.
          </div>
        )}

        <div className="auth-support-links">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
