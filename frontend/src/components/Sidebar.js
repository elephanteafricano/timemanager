import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isManagerRole } from '../utils/roles';
import './Sidebar.css';
import HomeIcon from '../assets/svgs/home.svg';
import DataIcon from '../assets/svgs/data.svg';
import ProfileIcon from '../assets/svgs/profile.svg';

function Sidebar({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isManager = isManagerRole(user);

  const menuItems = [
    { path: '/home', label: 'Home', icon: HomeIcon },
    { path: '/data', label: 'Data', icon: DataIcon },
    ...(isManager ? [{ path: '/profile', label: 'Profile', icon: ProfileIcon }] : []),
  ];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-logo">TimeManager</h2>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="sidebar-icon">
              <img src={item.icon} alt={item.label} />
            </span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <div className="user-avatar">{user.username?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
        )}
        <button onClick={onLogout} className="sidebar-logout">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
