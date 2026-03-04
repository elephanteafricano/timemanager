import React from 'react';
import Sidebar from './Sidebar';

function LoadingShell({ user, onLogout, backgroundUrl }) {
  const handleLogout = onLogout || (() => {});

  return (
    <div className="dashboard tm-shell">
      {backgroundUrl ? (
        <div className="tm-hero" style={{ backgroundImage: `url(${backgroundUrl})` }} aria-hidden="true" />
      ) : null}
      {user ? <Sidebar user={user} onLogout={handleLogout} /> : null}
      <div className="dashboard-content tm-panel">
        <div className="tm-card" style={{ padding: '20px' }}>Loading...</div>
      </div>
    </div>
  );
}

export default LoadingShell;
