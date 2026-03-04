import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCurrentUser from '../hooks/useCurrentUser';
import Sidebar from './Sidebar';
import LoadingShell from './LoadingShell';

function AppShell() {
  const backgroundUrl = `${process.env.PUBLIC_URL}/images/halftime.jpg`;
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
      <div className="tm-hero" style={{ backgroundImage: `url(${backgroundUrl})` }} aria-hidden="true" />
      <Sidebar user={user} onLogout={logout} />
      <div className="dashboard-content tm-panel">
        <Outlet context={{ user }} />
      </div>
    </div>
  );
}

export default AppShell;
