import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCurrentUser from '../hooks/useCurrentUser';
import { getBackgroundImageStyle, getDefaultBackgroundUrl } from '../utils/backgroundImage';
import Sidebar from './Sidebar';
import LoadingShell from './LoadingShell';

function AppShell() {
  const backgroundUrl = getDefaultBackgroundUrl();
  const { user, isLoading } = useCurrentUser();
  const { logout } = useAuth();

  if (isLoading) {
    return <LoadingShell user={user} onLogout={logout} backgroundUrl={backgroundUrl} />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard tm-shell">
      <div className="tm-hero" style={getBackgroundImageStyle(backgroundUrl)} aria-hidden="true" />
      <Sidebar user={user} onLogout={logout} />
      <div className="dashboard-content tm-panel">
        <div className="tm-outlet">
          <Outlet context={{ user }} />
        </div>
      </div>
    </div>
  );
}

export default AppShell;
