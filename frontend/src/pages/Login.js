import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import './Login.css';

function Login() {
  const backgroundUrl = `${process.env.PUBLIC_URL}/images/halftime.jpg`;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/home');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="login-shell">
      <aside className="login-brand" style={{ backgroundImage: `url(${backgroundUrl})` }}>
        <div className="login-brand-content">
          <h1 className="login-brand-title">Where time matters</h1>
          <p className="login-brand-subtitle">Precision. Accountability. Performance.</p>
        </div>
      </aside>

      <main className="login-panel">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-app-name">TimeManager</div>
            <div className="login-card-subtitle">Sign in to continue</div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label className="input-field">
              <span className="input-label">Email</span>
              <span className="input-control">
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="you@example.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </span>
            </label>

            <label className="input-field">
              <span className="input-label">Password</span>
              <span className="input-control">
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </span>
            </label>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="login-button"
              disabled={loading || !username || !password}
            >
              {loading ? 'Loading...' : 'Login'}
            </button>

            <button type="button" className="login-forgot" onClick={() => navigate('/forgot-password')}>
              Forgot Password?
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;
